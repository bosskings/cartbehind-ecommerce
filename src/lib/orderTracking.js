const ORDER_TRACKING_KEY = "cartbehind-order-tracking"
const LEGACY_ORDERS_KEY = "cartbehind-orders"

function readRecords() {
  if (typeof window === "undefined") return []

  try {
    const stored = window.localStorage.getItem(ORDER_TRACKING_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem(ORDER_TRACKING_KEY)
    return []
  }
}

function writeRecords(records) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(ORDER_TRACKING_KEY, JSON.stringify(records))
}

export function generateTrackingCode(state = "") {
  const region =
    String(state || "NG")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "NG"
  const suffix = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()

  return `CBH${region}${suffix}`
}

export function saveOrderTrackingRecord({ orderId, txRef, trackingCode, destination }) {
  if (!trackingCode) return null

  const records = readRecords()
  const nextRecord = {
    orderId: orderId ? String(orderId) : "",
    txRef: txRef ? String(txRef) : "",
    trackingCode: String(trackingCode).toUpperCase(),
    destination: {
      address: destination?.address || "",
      state: destination?.state || "",
      country: destination?.country || "",
    },
    updatedAt: new Date().toISOString(),
  }

  const existingIndex = records.findIndex((record) => {
    if (nextRecord.orderId && record.orderId === nextRecord.orderId) return true
    if (nextRecord.txRef && record.txRef === nextRecord.txRef) return true
    if (nextRecord.trackingCode && record.trackingCode === nextRecord.trackingCode) return true
    return false
  })

  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...nextRecord }
  } else {
    records.unshift(nextRecord)
  }

  writeRecords(records.slice(0, 50))
  return nextRecord
}

export function findTrackingRecordForOrder(order) {
  if (!order) return null

  const orderId = String(order.id || order.orderId || "")
  const txRef = String(order.payment?.txRef || order.payment?.tx_ref || order.txRef || order.tx_ref || "")

  return (
    readRecords().find((record) => {
      if (orderId && record.orderId && record.orderId === orderId) return true
      if (txRef && record.txRef && record.txRef === txRef) return true
      return false
    }) || null
  )
}

export function readLegacyStoredOrders() {
  if (typeof window === "undefined") return []

  try {
    const stored = window.localStorage.getItem(LEGACY_ORDERS_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getOrderMergeKey(order) {
  if (!order) return ""

  if (order.trackingCode) return `track:${String(order.trackingCode).toUpperCase()}`
  if (order.id) return `id:${String(order.id)}`
  if (order.payment?.txRef) return `tx:${String(order.payment.txRef)}`
  if (order.payment?.tx_ref) return `tx:${String(order.payment.tx_ref)}`

  return ""
}

export function mergeOrderLists(backendOrders = []) {
  const combined = [
    ...backendOrders.map(applyOrderTrackingEnhancements),
    ...readLegacyStoredOrders().map(applyOrderTrackingEnhancements),
  ]

  for (const record of readRecords()) {
    combined.push(applyOrderTrackingEnhancements(buildOrderFromTrackingRecord(record)))
  }

  const merged = new Map()

  for (const order of combined) {
    if (!order) continue

    const key = getOrderMergeKey(order)
    if (!key) continue

    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, order)
      continue
    }

    const existingDate = new Date(existing.createdAt || existing.updatedAt || 0).getTime()
    const nextDate = new Date(order.createdAt || order.updatedAt || 0).getTime()

    merged.set(key, nextDate >= existingDate ? { ...existing, ...order } : existing)
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || 0).getTime() -
      new Date(a.createdAt || a.updatedAt || 0).getTime(),
  )
}

export function findOrderByTrackingCode(orders, code) {
  const normalized = String(code || "").trim().toUpperCase()
  if (!normalized) return null

  const fromOrders = orders.find(
    (order) => String(order.trackingCode || "").toUpperCase() === normalized,
  )
  if (fromOrders) return fromOrders

  const legacyOrder = readLegacyStoredOrders().find(
    (order) => String(order.trackingCode || "").toUpperCase() === normalized,
  )
  if (legacyOrder) return applyOrderTrackingEnhancements(legacyOrder)

  const record = findTrackingRecordByCode(normalized)
  if (!record) return null

  return applyOrderTrackingEnhancements(buildOrderFromTrackingRecord(record))
}

export function findTrackingRecordByCode(code) {
  const normalized = String(code || "").trim().toUpperCase()
  if (!normalized) return null

  return readRecords().find((record) => record.trackingCode === normalized) || null
}

export function applyOrderTrackingEnhancements(order) {
  if (!order) return null

  const record = findTrackingRecordForOrder(order)
  if (!record) return order

  return {
    ...order,
    trackingCode: order.trackingCode || record.trackingCode,
    destination: {
      address: order.destination?.address || record.destination?.address || "",
      state: order.destination?.state || record.destination?.state || "",
      country: order.destination?.country || record.destination?.country || "",
    },
  }
}

export function buildOrderFromTrackingRecord(record) {
  if (!record) return null

  return {
    id: record.orderId || record.txRef || record.trackingCode,
    trackingCode: record.trackingCode,
    status: "Processing",
    createdAt: record.updatedAt,
    destination: record.destination,
    payment: record.txRef ? { txRef: record.txRef } : {},
    items: [],
    total: 0,
    itemCount: 0,
  }
}
