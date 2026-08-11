"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  Package,
  MapPin,
  Copy,
  Check,
} from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useOrders } from "@/components/OrderContext"
import { useRouter } from "next/navigation"

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200 dark:focus:bg-[#1a1625]"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

function onlyDigits(value) {
  return value.replace(/\D/g, "")
}

function formatCardNumber(value) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function CheckoutModal({ isOpen, onClose }) {
  const { items, subtotal, clearCart } = useCart()
  const { createOrder } = useOrders()
  const router = useRouter()

  const [step, setStep] = useState("payment") // payment | processing | success | shipping | done
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [order, setOrder] = useState(null)

  const [card, setCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  })

  const [shipping, setShipping] = useState({
    address: "",
    country: "",
    state: "",
  })

  useEffect(() => {
    if (!isOpen) return
    setStep("payment")
    setError("")
    setCopied(false)
    setOrder(null)
    setCard({ name: "", number: "", expiry: "", cvc: "" })
    setShipping({ address: "", country: "", state: "" })
  }, [isOpen])

  if (!isOpen) return null

  const stepLabel = {
    payment: "Step 1 of 2: Payment",
    processing: "Processing payment…",
    success: "Payment successful",
    shipping: "Step 2 of 2: Delivery location",
    done: "Order confirmed",
  }[step]

  const handlePay = (event) => {
    event.preventDefault()
    setError("")

    const digits = onlyDigits(card.number)
    if (!card.name.trim()) {
      setError("Enter the name on your card.")
      return
    }
    if (digits.length < 16) {
      setError("Enter a valid 16-digit card number.")
      return
    }
    if (onlyDigits(card.expiry).length < 4) {
      setError("Enter a valid expiry date (MM/YY).")
      return
    }
    if (onlyDigits(card.cvc).length < 3) {
      setError("Enter a valid CVC.")
      return
    }

    setStep("processing")
    window.setTimeout(() => {
      setStep("success")
    }, 2200)
  }

  const handleShippingSubmit = (event) => {
    event.preventDefault()
    setError("")

    if (!shipping.address.trim() || !shipping.country.trim() || !shipping.state.trim()) {
      setError("Please fill in address, country, and state.")
      return
    }

    const created = createOrder({
      items,
      total: subtotal,
      payment: {
        last4: onlyDigits(card.number).slice(-4),
        brand: "Card",
      },
      shipping: {
        address: shipping.address.trim(),
        country: shipping.country.trim(),
        state: shipping.state.trim(),
      },
    })

    setOrder(created)
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
              {step === "done" || step === "success" ? (
                <CheckCircle2 size={20} />
              ) : step === "shipping" ? (
                <MapPin size={20} />
              ) : (
                <CreditCard size={20} />
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
            {step === "payment" && (
              <motion.form
                key="payment"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handlePay}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-(--theme)/15 bg-white p-4 dark:border-white/10 dark:bg-[#16131f]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Amount due</span>
                    <span className="text-xl font-black text-gray-950 dark:text-white">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {items.length} {items.length === 1 ? "item" : "items"} · Simulated payment
                  </p>
                </div>

                <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Name on card</span>
                  <input
                    className={fieldClass}
                    value={card.name}
                    onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Alex Johnson"
                    autoComplete="cc-name"
                  />
                </label>

                <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Card number</span>
                  <input
                    className={fieldClass}
                    value={card.number}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))
                    }
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                </label>

                <div className="grid gap-4 grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Expiry</span>
                    <input
                      className={fieldClass}
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))
                      }
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">CVC</span>
                    <input
                      className={fieldClass}
                      value={card.cvc}
                      onChange={(e) =>
                        setCard((c) => ({
                          ...c,
                          cvc: onlyDigits(e.target.value).slice(0, 4),
                        }))
                      }
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </label>
                </div>

                {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer"
                >
                  <Lock size={16} />
                  Pay {formatNaira(subtotal)}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Demo checkout — no real charge. Stripe can be wired later.
                </p>
              </motion.form>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-10 text-center"
              >
                <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rounded-full border-4 border-(--theme)/20 border-t-(--theme)"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <CreditCard className="text-(--theme)" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Processing payment
                </h3>
                <p className="mt-2 max-w-xs text-sm text-gray-500">
                  Securing your card details and confirming the charge…
                </p>
                <div className="mt-6 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-(--theme)"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -12 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Payment successful
                </h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Your order is paid. Set a delivery location so we can create a tracking
                  code for your parcel.
                </p>

                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer"
                >
                  <Package size={18} />
                  Set up tracking
                </button>
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.form
                key="shipping"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleShippingSubmit}
                className="space-y-5"
              >
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
