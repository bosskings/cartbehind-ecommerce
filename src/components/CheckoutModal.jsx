"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, CheckCircle2, Package, MapPin, Copy, Check } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useOrders } from "@/components/OrderContext"
import { useAuth } from "@/components/AuthContext"
import { useRouter } from "next/navigation"
import { clearPendingCheckout, readPendingCheckout } from "@/lib/payments"

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200 dark:focus:bg-[#1a1625]"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

export default function CheckoutModal({ isOpen, onClose, paymentInfo }) {
  const { items, subtotal, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { isUserAuthenticated } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState("shipping")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [order, setOrder] = useState(null)
  const [checkout, setCheckout] = useState(null)

  const [shipping, setShipping] = useState({
    address: "",
    country: "",
    state: "",
  })

  useEffect(() => {
    if (!isOpen || isUserAuthenticated) return
    onClose()
    router.push("/login?next=/cart")
  }, [isOpen, isUserAuthenticated, onClose, router])

  useEffect(() => {
    if (!isOpen) return

    if (!paymentInfo) {
      onClose()
      return
    }

    setStep("shipping")
    setError("")
    setCopied(false)
    setOrder(null)
    const pendingCheckout = readPendingCheckout()
    setCheckout({
      items: pendingCheckout?.items?.length ? pendingCheckout.items : items,
      total: Number(pendingCheckout?.total ?? subtotal) || 0,
      itemCount: Number(pendingCheckout?.itemCount ?? items.length) || 0,
    })
    setShipping({ address: "", country: "", state: "" })
  }, [isOpen, paymentInfo, onClose])

  if (!isOpen || !isUserAuthenticated || !paymentInfo) return null

  const checkoutItems = checkout?.items ?? items
  const checkoutTotal = checkout?.total ?? subtotal
  const checkoutItemCount = checkout?.itemCount ?? items.length

  const stepLabel = {
    shipping: "Delivery location",
    done: "Order confirmed",
  }[step]

  const handleShippingSubmit = (event) => {
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

    const created = createOrder({
      items: checkoutItems,
      total: checkoutTotal,
      payment: {
        provider: "flutterwave",
        txRef: paymentInfo.tx_ref,
        transactionId: paymentInfo.transaction_id,
        status: "successful",
      },
      shipping: {
        address: shipping.address.trim(),
        country: shipping.country.trim(),
        state: shipping.state.trim(),
      },
    })

    setOrder(created)
    clearPendingCheckout()
    clearCart()
    setStep("done")
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
              {step === "done" ? (
                <CheckCircle2 size={20} />
              ) : (
                <MapPin size={20} />
              )}
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
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, address: e.target.value }))
                    }
                    placeholder="12 Admiralty Way, Lekki"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Country</span>
                    <input
                      className={fieldClass}
                      value={shipping.country}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, country: e.target.value }))
                      }
                      placeholder="Nigeria"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">State</span>
                    <input
                      className={fieldClass}
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, state: e.target.value }))
                      }
                      placeholder="Lagos"
                    />
                  </label>
                </div>

                {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer"
                >
                  Confirm delivery location
                  <span aria-hidden="true">→</span>
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
                    Item will be shipped to you in{" "}
                    <span className="font-bold text-(--theme)">
                      {order.deliveryDays}{" "}
                      {order.deliveryDays === 1 ? "day" : "days"}
                    </span>
                    .
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {order.destination.address}, {order.destination.state},{" "}
                    {order.destination.country}
                  </p>
                </div>

                <div className="rounded-2xl border border-(--theme)/15 bg-white p-5 dark:border-white/10 dark:bg-[#16131f]">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
                    Tracking code
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <code className="text-lg font-black tracking-wide text-gray-950 dark:text-white">
                      {order.trackingCode}
                    </code>
                    <button
                      type="button"
                      onClick={copyTracking}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-(--theme) dark:hover:bg-white/10"
                      aria-label="Copy tracking code"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Use Track parcel in the navbar anytime to follow your shipment.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push(`/track?code=${encodeURIComponent(order.trackingCode)}`)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-(--theme)/25 bg-white px-6 py-3.5 text-sm font-bold text-(--theme) transition-all duration-300 hover:scale-105 cursor-pointer dark:bg-[#16131f]"
                  >
                    <Package size={16} />
                    Track parcel
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

