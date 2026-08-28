"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Truck,
  Copy,
  Check,
  Plane,
  Package,
  Search,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import CheckoutModal from "@/components/CheckoutModal"
import { useOrders } from "@/components/OrderContext"
import { isSuccessfulPayment } from "@/lib/payments"

function formatStamp(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} GMT+1`
}

function TimelineIcon({ type, active }) {
  if (type === "plane") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f6bff] text-white shadow-[0_0_0_4px_rgba(47,107,255,0.18)]">
        <Plane size={14} />
      </span>
    )
  }
  if (type === "truck") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-500">
        <Truck size={12} />
      </span>
    )
  }
  if (type === "customs") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-500">
        <span className="text-[10px] font-black">◇</span>
      </span>
    )
  }
  return (
    <span
      className={`mt-1 h-3 w-3 rounded-full ${active ? "bg-[#2f6bff]" : "bg-gray-300"}`}
    />
  )
}

function TrackParcelContent() {
  const { orders, getOrderByTrackingCode } = useOrders()
  const searchParams = useSearchParams()
  const router = useRouter()
  const codeFromUrl = (searchParams.get("code") || "").toUpperCase()
  const paymentStatus = searchParams.get("status")
  const paymentTxRef = searchParams.get("tx_ref")
  const paymentTransactionId = searchParams.get("transaction_id")

  const [query, setQuery] = useState(codeFromUrl)
  const [activeCode, setActiveCode] = useState(codeFromUrl)
  const [copied, setCopied] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [paymentError, setPaymentError] = useState("")

  useEffect(() => {
    if (!paymentStatus || !paymentTxRef) return

    if (isSuccessfulPayment(paymentStatus)) {
      setPaymentInfo({
        tx_ref: paymentTxRef,
        transaction_id: paymentTransactionId ? Number(paymentTransactionId) : null,
        status: paymentStatus,
      })
      setPaymentError("")
      return
    }

    setPaymentInfo(null)
    setPaymentError("Payment was not completed. You can return to your cart and try again.")
  }, [paymentStatus, paymentTxRef, paymentTransactionId])

  const handleCloseCheckout = useCallback(() => {
    setPaymentInfo(null)
    router.replace("/track")
  }, [router])

  useEffect(() => {
    if (!codeFromUrl) return
    setQuery(codeFromUrl)
    setActiveCode(codeFromUrl)
    setNotFound(false)
  }, [codeFromUrl])

  const order = useMemo(() => {
    if (!activeCode) return null
    return getOrderByTrackingCode(activeCode)
  }, [activeCode, getOrderByTrackingCode, orders])

  const handleLookup = (event) => {
    event.preventDefault()
    const code = query.trim().toUpperCase()
    if (!code) return
    const found = getOrderByTrackingCode(code)
    setActiveCode(code)
    setNotFound(!found)
    router.replace(found ? `/track?code=${encodeURIComponent(code)}` : "/track")
  }

  const selectCode = (code) => {
    setQuery(code)
    setActiveCode(code)
    setNotFound(false)
    router.replace(`/track?code=${encodeURIComponent(code)}`)
  }

  const copyDetails = async () => {
    if (!order) return
    const text = [
      `Tracking: ${order.trackingCode}`,
      `Status: ${order.status} (${order.deliveryDays} days)`,
      `From: ${order.origin}`,
      `To: ${order.destination.address}, ${order.destination.state}, ${order.destination.country}`,
    ].join("\n")

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const copyCode = async () => {
    if (!order) return
    try {
      await navigator.clipboard.writeText(order.trackingCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const latest = order?.timeline?.[0]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(47,107,255,0.08),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:px-8 lg:pt-32">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-(--theme) transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-(--theme)">
            Tracking
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-4xl dark:text-white">
            Track your parcel
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your CartBehind tracking code to follow delivery status.
          </p>
        </div>

        <div className="space-y-5 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:p-7 dark:border-white/10 dark:bg-[#16131f]">
          {paymentError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <p>{paymentError}</p>
              <Link href="/cart" className="mt-2 inline-block font-semibold underline">
                Back to cart
              </Link>
            </div>
          )}

          <form onSubmit={handleLookup} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.toUpperCase())
                  setNotFound(false)
                }}
                placeholder="e.g. CBHNG…"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium tracking-wide text-gray-800 outline-none transition focus:border-[#2f6bff] focus:bg-white dark:border-white/10 dark:bg-[#12101a] dark:text-gray-200"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-[#2f6bff] px-6 text-sm font-bold text-white transition hover:bg-[#2557d6] cursor-pointer"
            >
              Track
            </button>
          </form>

          {orders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Recent parcels
              </p>
              <div className="flex flex-wrap gap-2">
                {orders.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCode(item.trackingCode)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      activeCode === item.trackingCode
                        ? "border-[#2f6bff] bg-[#eef4ff] text-[#2f6bff]"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#2f6bff]/40 hover:text-[#2f6bff] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
                    }`}
                  >
                    {item.trackingCode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {notFound && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              No parcel found for that code. Check the code from your checkout receipt.
            </p>
          )}

          <AnimatePresence mode="wait">
            {order && (
              <motion.div
                key={order.trackingCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-[#12101a]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2f6bff] text-white">
                      <Truck size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="text-2xl font-black text-[#1e3a8a] dark:text-[#93b4ff]">
                          {order.status}
                        </h2>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({order.deliveryDays} days)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-[#2f6bff]"
                      >
                        {order.trackingCode}
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyDetails}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 cursor-pointer dark:bg-white/10 dark:text-gray-200"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    Copy details
                  </button>
                </div>

                <div className="space-y-4 border-b border-gray-100 p-4 sm:p-5 dark:border-white/10">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Origin</p>
                      <p className="font-bold text-gray-900 dark:text-white">{order.origin}</p>
                    </div>
                    <span className="mb-1 text-gray-300">→</span>
                    <div>
                      <p className="text-xs text-gray-400">Destination</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {order.destination.state || order.destination.country}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="relative mb-3 h-1.5 rounded-full bg-gray-100 dark:bg-white/10">
                      <div className="absolute inset-y-0 left-0 w-[18%] rounded-full bg-[#2f6bff]" />
                      <span className="absolute left-[14%] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#2f6bff] text-white shadow-[0_0_0_4px_rgba(47,107,255,0.2)]">
                        <Truck size={12} />
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-gray-400 sm:text-xs">
                      {order.progressSteps.map((step) => (
                        <span
                          key={step.label}
                          className={`truncate ${step.current ? "font-semibold text-[#2f6bff]" : ""}`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {latest && (
                  <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-white/10">
                    <div className="flex gap-3">
                      <TimelineIcon type="plane" active />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">{latest.title}</p>
                        <div className="mt-2 flex items-start justify-between gap-3 rounded-xl bg-[#eef4ff] p-3 dark:bg-[#2f6bff]/10">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{latest.note}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatStamp(latest.at)}
                            </p>
                          </div>
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f6bff]/15 text-[#2f6bff]">
                            <Package size={22} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <ul>
                    {order.timeline.slice(1).map((event, index, list) => (
                      <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < list.length - 1 && (
                          <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200 dark:bg-white/10" />
                        )}
                        <div className="relative z-10 flex w-7 justify-center pt-0.5">
                          <TimelineIcon type={event.icon} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">{event.note}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatStamp(event.at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 sm:px-5 dark:border-white/10 dark:bg-[#0c0a14] dark:text-gray-400">
                  Delivering to {order.destination.address}, {order.destination.state},{" "}
                  {order.destination.country}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!order && orders.length === 0 && !notFound && (
            <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
              <Package className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No parcels yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Complete checkout to get a tracking code for your order.
              </p>
              <Link
                href="/cart"
                className="mt-5 inline-flex rounded-full bg-(--theme) px-5 py-2.5 text-sm font-bold text-(--theme-second) transition-all hover:scale-105 hover:bg-[#280E89]"
              >
                Go to cart
              </Link>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={Boolean(paymentInfo)}
        onClose={handleCloseCheckout}
        paymentInfo={paymentInfo}
      />
    </main>
  )
}

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#f7f5fb] dark:bg-background">
            <p className="text-sm text-gray-500">Loading tracker…</p>
          </main>
        }
      >
        <TrackParcelContent />
      </Suspense>
      <Footer />
    </>
  )
}
