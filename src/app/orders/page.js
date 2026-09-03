"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2, Package, ShoppingBag } from "lucide-react"
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

function getDeliverySummary(destination) {
  if (!destination) return null
  const parts = [destination.address, destination.state, destination.country].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

export default function OrdersPage() {
  const router = useRouter()
  const { isUserAuthenticated } = useAuth()
  const { orders, loadingOrders, ordersError, refreshOrders, formatTimestamp } = useOrders()

  useEffect(() => {
    if (!isUserAuthenticated) {
      router.replace("/login?next=/orders")
    }
  }, [isUserAuthenticated, router])

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

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.08),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:pt-32">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-(--theme) transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={16} />
            Back to shop
          </Link>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-(--theme)">Orders</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-4xl dark:text-white">
                Purchase history
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Recent orders from your CartBehind account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refreshOrders()}
              disabled={loadingOrders}
              className="inline-flex h-11 items-center justify-center rounded-full border border-(--theme)/20 bg-white px-5 text-sm font-semibold text-(--theme) transition hover:bg-(--theme)/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#16131f]"
            >
              {loadingOrders ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh orders"
              )}
            </button>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:p-7 dark:border-white/10 dark:bg-[#16131f]">
            {loadingOrders && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="mb-3 animate-spin text-(--theme)" size={28} />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Loading your orders…
                </p>
              </div>
            )}

            {!loadingOrders && ordersError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                <p className="font-semibold">Could not load orders</p>
                <p className="mt-1">{ordersError}</p>
                <button
                  type="button"
                  onClick={() => refreshOrders()}
                  className="mt-3 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loadingOrders && !ordersError && orders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
                <ShoppingBag className="mx-auto mb-3 text-gray-300" size={36} />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  No purchases yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Complete checkout to see your orders here.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-full bg-(--theme) px-5 py-2.5 text-sm font-bold text-(--theme-second) transition-all hover:scale-105 hover:bg-[#280E89]"
                >
                  Start shopping
                </Link>
              </div>
            )}

            {orders.length > 0 && (
              <ul className="space-y-4">
                {orders.map((order) => {
                  const deliverySummary = getDeliverySummary(order.destination)
                  const displayDate = formatOrderDate(order.createdAt) || formatTimestamp(order.createdAt)

                  return (
                    <li
                      key={order.id}
                      className="rounded-2xl border border-gray-100 bg-[#faf9fc] p-5 dark:border-white/10 dark:bg-[#12101a]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black text-gray-950 dark:text-white">
                              Order {order.id}
                            </h2>
                            <span className="rounded-full bg-(--theme)/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-(--theme)">
                              {order.status}
                            </span>
                            {order.paymentStatus && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Payment {order.paymentStatus}
                              </span>
                            )}
                          </div>

                          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2 dark:text-gray-300">
                            <p>
                              <span className="text-gray-400">Date:</span> {displayDate}
                            </p>
                            {order.hasTotal && (
                              <p>
                                <span className="text-gray-400">Total:</span>{" "}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {formatNaira(order.total)}
                                </span>
                              </p>
                            )}
                            {order.hasItemCount && (
                              <p>
                                <span className="text-gray-400">Items:</span> {order.itemCount}
                              </p>
                            )}
                            {order.trackingCode ? (
                              <p>
                                <span className="text-gray-400">Tracking:</span>{" "}
                                <span className="font-semibold tracking-wide text-gray-900 dark:text-white">
                                  {order.trackingCode}
                                </span>
                              </p>
                            ) : (
                              <p>
                                <span className="text-gray-400">Tracking:</span> Not available yet
                              </p>
                            )}
                          </div>

                          {deliverySummary && (
                            <p className="text-sm text-gray-500">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">
                                Delivery:
                              </span>{" "}
                              {deliverySummary}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {order.trackingCode && (
                            <Link
                              href={`/track?code=${encodeURIComponent(order.trackingCode)}`}
                              className="inline-flex items-center gap-2 rounded-full border border-(--theme)/25 bg-white px-4 py-2.5 text-sm font-bold text-(--theme) transition hover:scale-105 dark:bg-[#16131f]"
                            >
                              <Package size={16} />
                              Track parcel
                            </Link>
                          )}
                          <Link
                            href={`/orders/${encodeURIComponent(order.id)}`}
                            className="inline-flex items-center gap-2 rounded-full bg-(--theme) px-4 py-2.5 text-sm font-bold text-(--theme-second) transition hover:scale-105 hover:bg-[#280E89]"
                          >
                            View details
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
