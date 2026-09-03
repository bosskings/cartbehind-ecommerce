"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { useAuth } from "@/components/AuthContext"
import { useOrders } from "@/components/OrderContext"

const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString("en-NG")}`

function formatOrderDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getItemLabel(item) {
  return item?.title || item?.name || item?.productName || "Item"
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id
  const { isUserAuthenticated } = useAuth()
  const { getOrderById, withOrderDisplayFallbacks, formatTimestamp } = useOrders()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isUserAuthenticated) {
      router.replace(`/login?next=/orders/${encodeURIComponent(orderId || "")}`)
    }
  }, [isUserAuthenticated, orderId, router])

  useEffect(() => {
    if (!isUserAuthenticated || !orderId) return

    let cancelled = false

    async function loadOrder() {
      try {
        setLoading(true)
        setError("")
        const fetched = await getOrderById(orderId)
        if (cancelled) return

        if (!fetched) {
          setOrder(null)
          setError("Order not found.")
          return
        }

        setOrder(withOrderDisplayFallbacks(fetched))
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setOrder(null)
          setError("Could not load this order.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrder()

    return () => {
      cancelled = true
    }
  }, [getOrderById, isUserAuthenticated, orderId, withOrderDisplayFallbacks])

  if (!isUserAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] dark:bg-background">
          <Loader2 className="animate-spin text-(--theme)" size={24} />
        </main>
        <Footer />
      </>
    )
  }

  const displayDate = order ? formatOrderDate(order.createdAt) || formatTimestamp(order.createdAt) : ""
  const destination = order?.destination || {}
  const destinationText = [destination.address, destination.state, destination.country]
    .filter(Boolean)
    .join(", ")

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.08),transparent_55%)]" />

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-28 md:px-8 lg:pt-32">
          <Link
            href="/orders"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-(--theme) transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={16} />
            Back to purchase history
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/80 bg-white py-20 text-center shadow-[0_8px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#16131f]">
              <Loader2 className="mb-3 animate-spin text-(--theme)" size={28} />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Loading order details…
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <p className="font-semibold">{error}</p>
              <Link href="/orders" className="mt-4 inline-block font-semibold underline">
                Return to purchase history
              </Link>
            </div>
          )}

          {!loading && order && (
            <div className="space-y-5 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:p-7 dark:border-white/10 dark:bg-[#16131f]">
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-(--theme)">Order</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 dark:text-white">
                    {order.id}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">{displayDate}</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-(--theme)/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-(--theme)">
                  {order.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-[#faf9fc] p-4 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Total</p>
                  <p className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
                    {formatNaira(order.total)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-[#faf9fc] p-4 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Tracking</p>
                  <p className="mt-2 text-lg font-black tracking-wide text-gray-950 dark:text-white">
                    {order.trackingCode || "Not available yet"}
                  </p>
                  {order.trackingCode && (
                    <Link
                      href={`/track?code=${encodeURIComponent(order.trackingCode)}`}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-(--theme) hover:underline"
                    >
                      <Package size={16} />
                      Track parcel
                    </Link>
                  )}
                </div>
              </div>

              {destinationText && (
                <div className="rounded-2xl border border-gray-100 bg-[#faf9fc] p-4 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Delivery
                  </p>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{destinationText}</p>
                </div>
              )}

              {order.items?.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Items
                  </p>
                  <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-white/10 dark:border-white/10">
                    {order.items.map((item, index) => {
                      const quantity = Number(item.quantity ?? item.qty ?? 1) || 1
                      const price = Number(item.price ?? item.unitPrice ?? 0) || 0

                      return (
                        <li
                          key={item.id || item._id || `${getItemLabel(item)}-${index}`}
                          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {getItemLabel(item)}
                            </p>
                            <p className="text-xs text-gray-400">Qty {quantity}</p>
                          </div>
                          <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                            {formatNaira(price * quantity)}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {order.trackingCode && (
                <Link
                  href={`/track?code=${encodeURIComponent(order.trackingCode)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-(--theme) px-6 py-3.5 text-sm font-bold text-(--theme-second) transition hover:scale-105 hover:bg-[#280E89]"
                >
                  <Package size={16} />
                  Track parcel
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
