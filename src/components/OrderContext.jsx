"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

const OrderContext = createContext(null)
const STORAGE_KEY = "cartbehind-orders"

function readStoredOrders() {
  if (typeof window === "undefined") return []

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function pad(n) {
  return String(n).padStart(2, "0")
}

function formatTimestamp(date, timeZone = "GMT+1") {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${timeZone}`
}

export function generateTrackingCode() {
  const stamp = Date.now().toString().slice(-10)
  const rand = Math.floor(100 + Math.random() * 900)
  return `CBHNG${stamp}${rand}`
}

export function estimateDeliveryDays(country = "", state = "") {
  const text = `${country} ${state}`.toLowerCase()
  if (text.includes("nigeria") || text.includes("lagos") || text.includes("abuja")) return 3
  if (text.includes("ghana") || text.includes("kenya") || text.includes("south africa")) return 5
  if (text.includes("uk") || text.includes("united kingdom") || text.includes("usa") || text.includes("united states") || text.includes("canada")) return 7
  return 5
}

function buildTimeline({ createdAt, destination, deliveryDays }) {
  const start = new Date(createdAt)
  const hours = (h) => new Date(start.getTime() + h * 60 * 60 * 1000).toISOString()
  const city = destination.state || destination.country || "Destination"

  return [
    {
      id: "departed",
      title: "Departed from departure country/region",
      note: "Carrier note: Left from departure country/region",
      at: hours(8),
      icon: "plane",
      active: true,
    },
    {
      id: "leaving",
      title: "Leaving from departure country/region",
      note: "Carrier note: Leaving from departure country/region",
      at: hours(4),
      icon: "dot",
    },
    {
      id: "export-done",
      title: "Export customs clearance complete",
      note: "Carrier note: Export clearance success",
      at: hours(3),
      icon: "customs",
    },
    {
      id: "export-start",
      title: "Export customs clearance started",
      note: "Carrier note: Export customs clearance started",
      at: hours(2.5),
      icon: "dot",
    },
    {
      id: "hub",
      title: "Arrived at departure transport hub",
      note: "Carrier note: Arrived at departure transport hub",
      at: hours(2),
      icon: "dot",
    },
    {
      id: "forecast",
      title: "Carrier update",
      note: `Carrier note: Last-mile delivery forecast — ${deliveryDays} days to ${city}`,
      at: hours(1.5),
      icon: "dot",
    },
    {
      id: "outbound",
      title: "[Lagos Hub] Departed from sorting center",
      note: "Carrier note: Outbound in sorting center",
      at: hours(1),
      icon: "truck",
    },
    {
      id: "inbound",
      title: "[Lagos Hub] Processing at sorting center",
      note: "Carrier note: Inbound in sorting center",
      at: hours(0.2),
      icon: "dot",
    },
  ]
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(readStoredOrders)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }, [orders])

  const createOrder = ({ items, total, payment, shipping }) => {
    const createdAt = new Date().toISOString()
    const deliveryDays = estimateDeliveryDays(shipping.country, shipping.state)
    const trackingCode = generateTrackingCode()

    const order = {
      id: `ord_${Date.now()}`,
      trackingCode,
      status: "Delivering",
      deliveryDays,
      origin: "Lagos, Nigeria",
      destination: {
        address: shipping.address,
        country: shipping.country,
        state: shipping.state,
      },
      payment: {
        last4: payment.last4,
        brand: payment.brand || "Card",
      },
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      total,
      createdAt,
      timeline: buildTimeline({
        createdAt,
        destination: shipping,
        deliveryDays,
      }),
      progressSteps: [
        { label: "Lagos", done: true, current: true },
        { label: shipping.country || "En route", done: false, current: false },
        { label: shipping.state || "Local hub", done: false, current: false },
        { label: "Delivered", done: false, current: false },
      ],
    }

    setOrders((current) => [order, ...current])
    return order
  }

  const getOrderByTrackingCode = (code) => {
    const normalized = code.trim().toUpperCase()
    return orders.find((order) => order.trackingCode.toUpperCase() === normalized) || null
  }

  const value = useMemo(
    () => ({
      orders,
      createOrder,
      getOrderByTrackingCode,
      formatTimestamp,
    }),
    [orders],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error("useOrders must be used within OrderProvider")
  }
  return context
}
