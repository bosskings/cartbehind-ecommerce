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
import { useAuth, isUserAuthError } from "@/components/AuthContext"
import { useOrders } from "@/components/OrderContext"
import { fetchUserTrackedParcel } from "@/lib/orders"
import { isSuccessfulPayment, readPendingCheckout } from "@/lib/payments"

function formatStamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date unavailable"
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

function TrackingSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-[#12101a]">
      <div className="flex items-center gap-3 border-b border-gray-100 p-5 dark:border-white/10">
        <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-white/10" />
        <div className="space-y-2"><div className="h-5 w-32 rounded bg-gray-200 dark:bg-white/10" /><div className="h-3 w-44 rounded bg-gray-200 dark:bg-white/10" /></div>
      </div>
      <div className="space-y-4 p-5"><div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-white/10" /><div className="h-20 rounded-xl bg-gray-100 dark:bg-white/5" /><div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-white/10" /></div>
    </div>
  )
}

function TrackParcelContent() {
  const { refreshOrders, withOrderDisplayFallbacks } = useOrders()
  const { userSession, handleUserAuthExpired } = useAuth()
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
  const [trackedTransit, setTrackedTransit] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState("")
  const [trackingRequestKey, setTrackingRequestKey] = useState(0)

  useEffect(() => {
    if (!paymentStatus || !paymentTxRef) return

    if (isSuccessfulPayment(paymentStatus)) {
      const pendingCheckout = readPendingCheckout()
      if (pendingCheckout) {
        setPaymentInfo({
          tx_ref: paymentTxRef,
          transaction_id: paymentTransactionId ? Number(paymentTransactionId) : null,
          status: paymentStatus,
        })
        setPaymentError("")
      } else {
        setPaymentInfo(null)
        setPaymentError("")
      }
      return
    }

    setPaymentInfo(null)
    setPaymentError("Payment was not completed. You can return to your cart and try again.")
  }, [paymentStatus, paymentTxRef, paymentTransactionId])

  const handleCloseCheckout = useCallback(() => {
    setPaymentInfo(null)
    router.replace("/track")
    refreshOrders()
  }, [refreshOrders, router])

  useEffect(() => {
    if (!codeFromUrl) return
    setQuery(codeFromUrl)
    setActiveCode(codeFromUrl)
    setNotFound(false)
  }, [codeFromUrl])

  useEffect(() => {
    if (!activeCode || !userSession?.authToken) {
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setTrackingLoading(true)
      setTrackingError("")
      setNotFound(false)

      fetchUserTrackedParcel(userSession.authToken, activeCode)
        .then((response) => {
          if (cancelled) return
          const transit =
            response?.transit ||
            response?.data?.transit ||
            response?.data ||
            response ||
            null
          const looksLikeTransit = Boolean(
            transit &&
            (Array.isArray(transit.currentLocation) ||
              transit.trackingNumber ||
              transit._id ||
              transit.orderId),
          )
          setTrackedTransit(looksLikeTransit ? transit : null)
          setNotFound(!looksLikeTransit)
          if (!looksLikeTransit) {
            setTrackingError("")
          }
        })
        .catch((error) => {
          if (cancelled) return
          if (isUserAuthError(error)) {
            handleUserAuthExpired?.()
            setTrackedTransit(null)
            setTrackingError("")
            return
          }
          console.error("User parcel tracking failed:", error)
          setTrackedTransit(null)
          if (error?.response?.status === 404) {
            setNotFound(true)
            setTrackingError("")
          } else {
            setNotFound(false)
            setTrackingError(error?.response?.data?.message || "Could not load parcel tracking details.")
          }
        })
        .finally(() => {
          if (!cancelled) setTrackingLoading(false)
        })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activeCode, trackingRequestKey, userSession?.authToken])

  const order = useMemo(() => {
    if (!activeCode) return null
    if (userSession?.authToken && trackingLoading) return null
    if (userSession?.authToken && trackingError) return null
    if (userSession?.authToken && notFound) return null
    if (userSession?.authToken && !trackedTransit) return null
    if (!trackedTransit) return null

    const locations = Array.isArray(trackedTransit.currentLocation)
      ? [...trackedTransit.currentLocation].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      : []

    const progressSteps = locations.length
      ? locations.map((entry, index) => ({
        id: entry._id || `progress-${index}`,
        label: entry.location || `Update ${index + 1}`,
        done: index > 0,
        current: index === 0,
      }))
      : [{ id: "awaiting-update", label: "Awaiting update", done: false, current: true }]

    const timeline = locations.length
      ? locations.map((entry, index) => ({
        id: entry._id || `location-${index}`,
        title: entry.location || "Transit update",
        note: entry.description || "",
        at: entry.timestamp || trackedTransit.shippedDate,
        icon: index === 0 ? "truck" : "dot",
        active: index === 0,
        currentLocation: entry.location || "",
      }))
      : [{
        id: "no-transit-updates",
        title: "No transit updates yet",
        note: "The carrier has not added a location update.",
        at: trackedTransit.shippedDate,
        icon: "dot",
        active: false,
      }]

    return withOrderDisplayFallbacks({
      id: trackedTransit.orderId || activeCode,
      trackingCode: trackedTransit.trackingNumber || activeCode,
      status: trackedTransit.status,
      deliveryStatus: trackedTransit.status,
      carrier: trackedTransit.carrier || "",
      createdAt: trackedTransit.shippedDate,
      shippedDate: trackedTransit.shippedDate,
      deliveredDate: trackedTransit.deliveredDate,
      progressSteps,
      timeline,
    })
  }, [activeCode, notFound, trackedTransit, trackingError, trackingLoading, userSession?.authToken, withOrderDisplayFallbacks])

  const handleLookup = (event) => {
    event.preventDefault()
    const code = query.trim().toUpperCase()
    if (!code) return
    setActiveCode(code)
    setNotFound(false)
    setTrackingError("")
    setTrackedTransit(null)
    setTrackingRequestKey((current) => current + 1)
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
  const currentLocation = latest?.currentLocation || latest?.title || "Not available yet"

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
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium tracking-wide text-gray-800 outline-none transition focus:border-[#2f6bff] dark:border-white/10 dark:bg-[#12101a] dark:text-gray-200"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-[#2f6bff] px-6 text-sm font-bold text-white transition hover:bg-[#2557d6] cursor-pointer"
            >
              Track
            </button>
          </form>

          {notFound && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              No parcel found for that tracking code.
            </p>
          )}

          {trackingError && !notFound && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {trackingError}
            </p>
          )}

          {trackingLoading && <TrackingSkeleton />}

          <AnimatePresence mode="wait">
            {order && !trackingLoading && (
              <motion.div
                key={order.trackingCode || order.id}
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
                      {order.carrier && (
                        <p className="mt-1 text-xs font-semibold text-gray-400">
                          Carrier: {order.carrier}
                        </p>
                      )}
                      {order.shippedDate && (
                        <p className="mt-1 text-xs text-gray-400">
                          Shipped: {formatStamp(order.shippedDate)}
                        </p>
                      )}
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
                      <p className="text-xs text-gray-400">Current location</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {currentLocation}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {order.progressSteps.length} backend timeline {order.progressSteps.length === 1 ? "update" : "updates"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.progressSteps.map((step, index) => (
                        <span
                          key={step.id || `${step.label}-${index}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${step.current ? "bg-[#2f6bff] text-white" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"}`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-4 sm:p-5 dark:border-white/10">
                  <ul>
                    {order.timeline.map((event, index, list) => (
                      <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < list.length - 1 && (
                          <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200 dark:bg-white/10" />
                        )}
                        <div className="relative z-10 flex w-7 justify-center pt-0.5">
                          <TimelineIcon type={event.icon} active={index === 0} />
                        </div>
                        <div className={`min-w-0 flex-1 rounded-xl p-3 ${index === 0 ? "bg-[#eef4ff] dark:bg-[#2f6bff]/10" : ""}`}>
                          <p className={`text-sm font-semibold ${index === 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>
                            {event.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{event.note}</p>
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

          {!order && !notFound && !trackingLoading && !trackingError && (
            <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
              <Package className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Search for a parcel</p>
              <p className="mt-1 text-xs text-gray-400">
                Enter a tracking code above to retrieve its latest delivery status.
              </p>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={Boolean(paymentInfo)}
        onClose={handleCloseCheckout}
        paymentInfo={paymentInfo}
        onOrderSettled={refreshOrders}
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
