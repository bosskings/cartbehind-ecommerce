"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X, CreditCard, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/components/AuthContext"
import { useCart } from "@/components/CartContext"
import {
  extractPaymentLink,
  getApiErrorMessage,
  getPaymentCallbackUrl,
  initiateFlutterwavePayment,
  savePendingCheckout,
} from "@/lib/payments"

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200 dark:focus:bg-[#1a1625]"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

function onlyDigits(value) {
  return value.replace(/\D/g, "")
}

export default function PayCustomerModal({ isOpen, onClose, amount, itemCount }) {
  const { userSession } = useAuth()
  const { items } = useCart()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setName("")
    setPhone("")
    setError("")
    setSubmitting(false)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    const trimmedName = name.trim()
    const trimmedPhone = onlyDigits(phone)

    if (!trimmedName) {
      setError("Enter your full name.")
      return
    }

    if (trimmedPhone.length < 10) {
      setError("Enter a valid phone number.")
      return
    }

    if (!amount || amount <= 0) {
      setError("Cart total must be greater than zero.")
      return
    }

    try {
      setSubmitting(true)

      const redirect_url = getPaymentCallbackUrl()
      const payload = {
        amount,
        currency: "NGN",
        redirect_url,
        customer: {
          email: userSession?.email,
          name: trimmedName,
          phonenumber: trimmedPhone,
        },
        customizations: {
          title: "CartBehind",
          description: `Payment for ${itemCount} ${itemCount === 1 ? "item" : "items"}`,
        },
      }

      const response = await initiateFlutterwavePayment({
        authToken: userSession?.authToken,
        payload,
      })

      console.log("Flutterwave pay response:", response)

      const paymentLink = extractPaymentLink(response)
      if (!paymentLink) {
        throw new Error("Payment link was not returned by the server.")
      }

      savePendingCheckout({
        items,
        total: amount,
        itemCount,
      })

      window.location.href = paymentLink
    } catch (err) {
      console.error("Flutterwave payment endpoint error:", {
        status: err?.response?.status,
        response: err?.response?.data,
        url: err?.config?.url,
        payload: err?.config?.data,
        message: err?.message,
      })
      console.error(err)
      const message = getApiErrorMessage(err, "Could not start payment. Please try again.")
      setError(message)
      toast.error(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl rounded-[28px] bg-[#f5f5f5] shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:bg-[#12101a]"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Checkout</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your contact details</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
            aria-label="Close checkout"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
          <div className="rounded-2xl border border-(--theme)/15 bg-white p-4 dark:border-white/10 dark:bg-[#16131f]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Amount due</span>
              <span className="text-xl font-black text-gray-950 dark:text-white">
                {formatNaira(amount)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {itemCount} {itemCount === 1 ? "item" : "items"} · Secure Flutterwave payment
            </p>
          </div>

          <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Full name</span>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              autoComplete="name"
              disabled={submitting}
            />
          </label>

          <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Phone number</span>
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(onlyDigits(e.target.value).slice(0, 15))}
              placeholder="08012345678"
              inputMode="tel"
              autoComplete="tel"
              disabled={submitting}
            />
          </label>

          <p className="text-xs text-gray-400">
            Paying as <span className="font-medium text-gray-600 dark:text-gray-300">{userSession?.email}</span>
          </p>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to payment…
              </>
            ) : (
              <>Continue to payment</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}


