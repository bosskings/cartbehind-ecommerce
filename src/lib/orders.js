import axios from "axios"

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback
}

function getHeaders(authToken) {
  if (!authToken) {
    throw new Error("You must be logged in to view orders.")
  }

  return {
    Authorization: `Bearer ${authToken}`,
  }
}

function getBackendUrlOrThrow() {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  return backendUrl
}

export function normalizeOrder(rawOrder) {
  if (!rawOrder || typeof rawOrder !== "object") return null

  const destination =
    rawOrder.destination ||
    rawOrder.shipping ||
    rawOrder.delivery ||
    rawOrder.deliveryAddress ||
    {}
  const payment = rawOrder.payment || rawOrder.paymentInfo || {}
  const items = rawOrder.items || rawOrder.products || rawOrder.orderItems || []
  const hasTotal = rawOrder.total != null || rawOrder.amount != null || rawOrder.grandTotal != null
  const hasItemCount =
    rawOrder.itemCount != null || rawOrder.quantity != null || (Array.isArray(items) && items.length > 0)
  const trackingCode =
    rawOrder.trackingCode ||
    rawOrder.tracking_code ||
    rawOrder.trackingId ||
    rawOrder.tracking_id ||
    ""
  const id = rawOrder.id || rawOrder._id || rawOrder.orderId || rawOrder.order_id || ""

  return {
    ...rawOrder,
    id,
    orderId: id,
    trackingCode,
    status: rawOrder.status || rawOrder.orderStatus || rawOrder.deliveryStatus || "Processing",
    paymentStatus: rawOrder.paymentStatus || payment.status || payment.paymentStatus || "",
    total: Number(rawOrder.total ?? rawOrder.amount ?? rawOrder.grandTotal ?? 0) || 0,
    hasTotal,
    createdAt:
      rawOrder.createdAt || rawOrder.created_at || rawOrder.datePurchased || rawOrder.date || rawOrder.updatedAt,
    itemCount: Number(rawOrder.itemCount ?? rawOrder.quantity ?? items.length) || items.length || 0,
    hasItemCount,
    items: Array.isArray(items) ? items : [],
    payment: {
      ...payment,
      txRef: payment.txRef || payment.tx_ref || rawOrder.txRef || rawOrder.tx_ref || "",
      transactionId:
        payment.transactionId ||
        payment.transaction_id ||
        rawOrder.transactionId ||
        rawOrder.transaction_id ||
        "",
    },
    destination: {
      address: destination.address || destination.street || rawOrder.address || "",
      state: destination.state || rawOrder.state || "",
      country: destination.country || rawOrder.country || "",
    },
  }
}

export function normalizeOrdersResponse(data) {
  const orders =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.orders) && data.orders) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.data?.orders) && data.data.orders) ||
    []

  return orders.map(normalizeOrder).filter(Boolean)
}

export function normalizeSingleOrderResponse(data) {
  const order = data?.order || data?.data?.order || data?.data || data
  return normalizeOrder(order)
}

export async function fetchUserOrders(authToken) {
  const backendUrl = getBackendUrlOrThrow()
  const response = await axios.get(`${backendUrl}/api/v1/users/orders`, {
    headers: getHeaders(authToken),
  })

  console.log("Orders fetch response:", response.data)
  return normalizeOrdersResponse(response.data)
}

export async function fetchUserOrder(authToken, orderId) {
  const backendUrl = getBackendUrlOrThrow()
  const response = await axios.get(`${backendUrl}/api/v1/users/orders/${orderId}`, {
    headers: getHeaders(authToken),
  })

  console.log("Single order fetch response:", response.data)
  return normalizeSingleOrderResponse(response.data)
}

export { getApiErrorMessage }
