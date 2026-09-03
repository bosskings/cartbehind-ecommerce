"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/AuthContext"
import { fetchUserOrder, fetchUserOrders, getApiErrorMessage } from "@/lib/orders"
import {
  applyOrderTrackingEnhancements,
  findOrderByTrackingCode,
  mergeOrderLists,
} from "@/lib/orderTracking"

const OrderContext = createContext(null)

function pad(n) {
  return String(n).padStart(2, "0")
}

function formatTimestamp(date, timeZone = "GMT+1") {
  if (!date) return ""

  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${timeZone}`
}

export function estimateDeliveryDays(country = "", state = "") {
  const text = `${country} ${state}`.toLowerCase()
  if (text.includes("nigeria") || text.includes("lagos") || text.includes("abuja")) return 3
  if (text.includes("ghana") || text.includes("kenya") || text.includes("south africa")) return 5
  if (text.includes("uk") || text.includes("united kingdom") || text.includes("usa") || text.includes("united states") || text.includes("canada")) return 7
  return 5
}

export function buildTimeline({ createdAt, destination, deliveryDays }) {
  const start = createdAt ? new Date(createdAt) : new Date()
  const hours = (h) => new Date(start.getTime() + h * 60 * 60 * 1000).toISOString()
  const city = destination?.state || destination?.country || "Destination"

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
      note: `Carrier note: Last-mile delivery forecast - ${deliveryDays} days to ${city}`,
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

export function withOrderDisplayFallbacks(order) {
  if (!order) return null

  const destination = order.destination || {}
  const deliveryDays = order.deliveryDays || estimateDeliveryDays(destination.country, destination.state)
  const createdAt = order.createdAt || new Date().toISOString()

  return {
    ...order,
    createdAt,
    deliveryDays,
    origin: order.origin || "Lagos, Nigeria",
    destination: {
      address: destination.address || "",
      state: destination.state || "",
      country: destination.country || "",
    },
    timeline: order.timeline?.length
      ? order.timeline
      : buildTimeline({ createdAt, destination, deliveryDays }),
    progressSteps: order.progressSteps?.length
      ? order.progressSteps
      : [
          { label: "Lagos", done: true, current: true },
          { label: destination.country || "En route", done: false, current: false },
          { label: destination.state || "Local hub", done: false, current: false },
          { label: "Delivered", done: false, current: false },
        ],
  }
}

export function OrderProvider({ children }) {
  const { isUserAuthenticated, userSession } = useAuth()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState("")
  const authToken = userSession?.authToken

  const refreshOrders = useCallback(async () => {
    if (!isUserAuthenticated || !authToken) {
      setOrders([])
      setOrdersError("")
      return []
    }

    try {
      setLoadingOrders(true)
      setOrdersError("")
      const nextOrders = mergeOrderLists(await fetchUserOrders(authToken))
      setOrders(nextOrders)
      return nextOrders
    } catch (error) {
      console.error(error)
      const message = getApiErrorMessage(error, "Could not load your orders.")
      setOrdersError(message)
      const fallbackOrders = mergeOrderLists([])
      setOrders(fallbackOrders)
      return fallbackOrders
    } finally {
      setLoadingOrders(false)
    }
  }, [authToken, isUserAuthenticated])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

  const getOrderById = useCallback(
    async (orderId) => {
      if (!authToken || !orderId) return null

      const cached = orders.find((order) => String(order.id) === String(orderId))
      if (cached) return cached

      const fetched = await fetchUserOrder(authToken, orderId)
      return applyOrderTrackingEnhancements(fetched)
    },
    [authToken, orders],
  )

  const getOrderByTrackingCode = useCallback(
    (code) => findOrderByTrackingCode(orders, code),
    [orders],
  )

  const value = useMemo(
    () => ({
      orders,
      loadingOrders,
      ordersError,
      refreshOrders,
      getOrderById,
      getOrderByTrackingCode,
      formatTimestamp,
      withOrderDisplayFallbacks,
    }),
    [getOrderById, getOrderByTrackingCode, loadingOrders, orders, ordersError, refreshOrders],
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
