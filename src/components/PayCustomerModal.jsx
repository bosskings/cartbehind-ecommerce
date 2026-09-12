"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, MapPin, Loader2 } from "lucide-react"
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

const selectClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-(--theme) focus:bg-white dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200 dark:focus:bg-[#1a1625] cursor-pointer"

const formatNaira = (amount) => `₦${amount.toLocaleString("en-NG")}`

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)", "Congo (Kinshasa)",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
]

function PayCustomerModalContent({ onClose, amount, itemCount }) {
  const { userSession } = useAuth()
  const { items } = useCart()
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [shipping, setShipping] = useState({
    addressLine1: "",
    addressLine2: "",
    country: "Nigeria",
    state: "",
    postcode: "",
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!shipping.addressLine1.trim() || !shipping.country.trim() || !shipping.state.trim()) {
      setError("Please fill in country, address, and state/province.")
      return
    }

    if (!amount || amount <= 0) {
      setError("Cart total must be greater than zero.")
      return
    }

    try {
      setSubmitting(true)

      const customerName =
        userSession?.user?.name ||
        userSession?.user?.fullName ||
        userSession?.email?.split("@")[0] ||
        "Customer"
      const customerPhone =
        userSession?.user?.phoneNumber ||
        userSession?.user?.phone ||
        ""

      const redirect_url = getPaymentCallbackUrl()
      const payload = {
        amount,
        currency: "NGN",
        redirect_url,
        customer: {
          email: userSession?.email,
          name: customerName,
          phonenumber: customerPhone,
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

      const paymentLink = extractPaymentLink(response)
      if (!paymentLink) {
        throw new Error("Payment link was not returned by the server.")
      }

      savePendingCheckout({
        items,
        total: amount,
        itemCount,
        deliveryDetails: {
          addressLine1: shipping.addressLine1.trim(),
          addressLine2: shipping.addressLine2.trim(),
          country: shipping.country.trim(),
          state: shipping.state.trim(),
          postcode: shipping.postcode.trim(),
        },
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
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-[#f5f5f5] shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:bg-[#12101a]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-[#f5f5f5]/95 px-6 py-5 backdrop-blur dark:border-white/10 dark:bg-[#12101a]/95">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--theme)/10 text-(--theme)">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Checkout</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivery details</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10 cursor-pointer"
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

          {/* Delivery Address */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 dark:border-white/10 dark:bg-[#16131f]">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Delivery address
            </p>

            {/* Country */}
            <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Country <span className="text-red-500">*</span></span>
              <div className="relative">
                <select
                  className={selectClass}
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </label>

            {/* Address Line 1 */}
            <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Address line 1 <span className="text-red-500">*</span></span>
              <input
                className={fieldClass}
                value={shipping.addressLine1}
                onChange={(e) => setShipping((s) => ({ ...s, addressLine1: e.target.value }))}
                placeholder="12 Admiralty Way, Lekki"
                disabled={submitting}
              />
            </label>

            {/* Address Line 2 */}
            <label className="block space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Address line 2 <span className="text-gray-400 font-normal text-xs">(optional)</span></span>
              <input
                className={fieldClass}
                value={shipping.addressLine2}
                onChange={(e) => setShipping((s) => ({ ...s, addressLine2: e.target.value }))}
                placeholder="Apartment, suite, floor, etc."
                disabled={submitting}
              />
            </label>

            {/* State & Postcode */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">State / Province <span className="text-red-500">*</span></span>
                <input
                  className={fieldClass}
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  placeholder="Lagos"
                  disabled={submitting}
                />
              </label>
              <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Postcode</span>
                <input
                  className={fieldClass}
                  value={shipping.postcode}
                  onChange={(e) => setShipping((s) => ({ ...s, postcode: e.target.value }))}
                  placeholder="100001"
                  disabled={submitting}
                />
              </label>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Paying as <span className="font-medium text-gray-600 dark:text-gray-300">{userSession?.email}</span>
          </p>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme) px-8 py-3.5 text-base font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
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

export default function PayCustomerModal({ isOpen, onClose, amount, itemCount }) {
  if (!isOpen) return null
  return (
    <PayCustomerModalContent
      key={isOpen ? "open" : "closed"}
      onClose={onClose}
      amount={amount}
      itemCount={itemCount}
    />
  )
}
