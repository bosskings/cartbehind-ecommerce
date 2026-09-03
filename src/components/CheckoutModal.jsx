"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, CheckCircle2, Package, MapPin, Copy, Check, ArrowRight } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useOrders } from "@/components/OrderContext"
import { useAuth } from "@/components/AuthContext"
import { useRouter } from "next/navigation"
import {
  clearPendingCheckout,
  completeUserCart,
  getApiErrorMessage,
  readPendingCheckout,
} from "@/lib/payments"
import { generateTrackingCode, saveOrderTrackingRecord } from "@/lib/orderTracking"

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200 dark:focus:bg-[#1a1625]"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

function findMatchingOrder(orders, paymentInfo) {
  if (!orders?.length) return null

  const txRef = String(paymentInfo?.tx_ref || "")
  const transactionId = String(paymentInfo?.transaction_id || "")

  return (
    orders.find((order) => {
      const payment = order.payment || {}
      return (
        (txRef && String(payment.txRef || payment.tx_ref || order.txRef || order.tx_ref || "") === txRef) ||
        (transactionId &&
          String(
            payment.transactionId ||
            payment.transaction_id ||
            order.transactionId ||
            order.transaction_id ||
            "",
          ) === transactionId)
      )
    }) || null
  )
}

function isMissingActiveCartError(error) {
  const status = error?.response?.status
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    ""

  return status === 404 && /active cart not found/i.test(message)
}

export default function CheckoutModal({ isOpen, onClose, paymentInfo, onOrderSettled }) {
  const { items, subtotal, clearCart } = useCart()
  const { refreshOrders, withOrderDisplayFallbacks } = useOrders()
  const { isUserAuthenticated, userSession } = useAuth()
  const router = useRouter()
  const authToken = userSession?.authToken
  const userId = userSession?.user?.id

  const [step, setStep] = useState("shipping")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [order, setOrder] = useState(null)
  const [checkout, setCheckout] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [shipping, setShipping] = useState({
    address: "",
    country: "",
    state: "",
  })
  const initializedPaymentRef = useRef(null)

  useEffect(() => {
    if (!isOpen || isUserAuthenticated) return
    onClose()
    router.push("/login?next=/cart")
  }, [isOpen, isUserAuthenticated, onClose, router])

  useEffect(() => {
    if (!isOpen || !paymentInfo) {
      if (!isOpen) initializedPaymentRef.current = null
      return
    }

    if (!authToken || !userId) return

    const sessionKey = `${paymentInfo.tx_ref}:${paymentInfo.transaction_id ?? ""}`
    if (initializedPaymentRef.current === sessionKey) return

    initializedPaymentRef.current = sessionKey
    setStep("shipping")
    setError("")
    setCopied(false)
    setOrder(null)
    setSubmitting(false)

    const pendingCheckout = readPendingCheckout()
    setCheckout({
      items: pendingCheckout?.items?.length ? pendingCheckout.items : items,
      total: Number(pendingCheckout?.total ?? subtotal) || 0,
      itemCount: Number(pendingCheckout?.itemCount ?? items.length) || 0,
    })
    setShipping({ address: "", country: "", state: "" })

    let cancelled = false

    void (async () => {
      try {
        const response = await completeUserCart({ authToken, userId })
        if (response) {
          await clearCart()
        }
      } catch (err) {
        if (isMissingActiveCartError(err)) {
          return
        }

        console.error("Failed to complete paid cart.", err)
        if (cancelled) return

        setError(
          getApiErrorMessage(
            err,
            "Payment received, but we could not complete your cart yet. You can still confirm your delivery location.",
          ),
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authToken, isOpen, items, paymentInfo, subtotal, userId])

  if (!isOpen || !isUserAuthenticated || !paymentInfo) return null

  const checkoutItems = checkout?.items ?? items
  const checkoutTotal = checkout?.total ?? subtotal
  const checkoutItemCount = checkout?.itemCount ?? items.length

  const stepLabel = {
    shipping: "Delivery location",
    done: "Order confirmed",
  }[step]

  const handleShippingSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!shipping.address.trim() || !shipping.country.trim() || !shipping.state.trim()) {
      setError("Please fill in address, country, and state.")
      return
    }

    if (!checkoutItems.length || checkoutTotal <= 0) {
      setError("We could not find the paid cart details. Please contact support with your payment reference.")
      return
    }

    try {
      setSubmitting(true)
      const refreshedOrders = await refreshOrders()
      const matchedOrder = findMatchingOrder(refreshedOrders, paymentInfo)
      const destination = {
        address: shipping.address.trim(),
        country: shipping.country.trim(),
        state: shipping.state.trim(),
      }

      const baseOrder =
        matchedOrder ||
        {
          id: paymentInfo.tx_ref || "payment-confirmed",
          status: "Processing",
          total: checkoutTotal,
          itemCount: checkoutItemCount,
          items: checkoutItems,
          createdAt: new Date().toISOString(),
          payment: {
            provider: "flutterwave",
            txRef: paymentInfo.tx_ref,
            transactionId: paymentInfo.transaction_id,
            status: "successful",
          },
        }

      const trackingCode = baseOrder.trackingCode || generateTrackingCode(destination.state)

      saveOrderTrackingRecord({
        orderId: baseOrder.id,
        txRef: paymentInfo.tx_ref,
        trackingCode,
        destination,
      })

      const receiptOrder = withOrderDisplayFallbacks({
        ...baseOrder,
        trackingCode,
        destination,
      })

      setOrder(receiptOrder)
      clearPendingCheckout()
      setStep("done")
      await refreshOrders()
      onOrderSettled?.()
    } catch (err) {
      console.error(err)
      setError("Your payment was received, but we could not refresh your order yet. Please check purchase history.")
    } finally {
      setSubmitting(false)
    }
  }

  const copyTracking = async () => {
    if (!order?.trackingCode) return
    try {
      await navigator.clipboard.writeText(order.trackingCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const destinationText = [order?.destination?.address, order?.destination?.state, order?.destination?.country]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-[#f5f5f5] shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:bg-[#12101a]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-[#f4f4f4]/95 px-6 py-5 backdrop-blur dark:border-white/10 dark:bg-[#16131f]/95">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
              {step === "done" ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Checkout</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stepLabel}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10"
            aria-label="Close checkout"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === "shipping" && (
              <motion.form
                key="shipping"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleShippingSubmit}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Payment received
                    </span>
                    <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                      {formatNaira(checkoutTotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    {checkoutItemCount} {checkoutItemCount === 1 ? "item" : "items"} paid via Flutterwave
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Where should we deliver your items?
                </p>

                <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Street address</span>
                  <input
                    className={fieldClass}
                    value={shipping.address}
                    onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                    placeholder="12 Admiralty Way, Lekki"
                    disabled={submitting}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Country</span>
                    <input
                      className={fieldClass}
                      value={shipping.country}
                      onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                      placeholder="Nigeria"
                      disabled={submitting}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">State</span>
                    <input
                      className={fieldClass}
                      value={shipping.state}
                      onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                      placeholder="Lagos"
                      disabled={submitting}
                    />
                  </label>
                </div>

                {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  {submitting ? "Confirming..." : "Confirm delivery location"}
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            )}

            {step === "done" && order && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-(--theme)/10 text-(--theme)"
                >
                  <Package size={28} />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    You&apos;re all set
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Your order has been confirmed and will appear in purchase history.
                  </p>
                  {destinationText && <p className="mt-1 text-xs text-gray-400">{destinationText}</p>}
                </div>

                <div className="rounded-2xl border border-(--theme)/15 bg-white p-5 dark:border-white/10 dark:bg-[#16131f]">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
                    {order.trackingCode ? "Tracking code" : "Order id"}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <code className="break-all text-lg font-black tracking-wide text-gray-950 dark:text-white">
                      {order.trackingCode || order.id}
                    </code>
                    {order.trackingCode && (
                      <button
                        type="button"
                        onClick={copyTracking}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-(--theme) dark:hover:bg-white/10"
                        aria-label="Copy tracking code"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    You can open Purchase history anytime to continue tracking this order.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push(order.trackingCode ? `/track?code=${encodeURIComponent(order.trackingCode)}` : "/orders")
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-(--theme)/25 bg-white px-6 py-3.5 text-sm font-bold text-(--theme) transition-all duration-300 hover:scale-105 cursor-pointer dark:bg-[#16131f]"
                  >
                    <Package size={16} />
                    {order.trackingCode ? "Track parcel" : "Purchase history"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-6 py-3.5 text-sm font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

