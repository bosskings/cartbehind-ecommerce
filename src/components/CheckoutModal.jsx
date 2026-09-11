"use client"

import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, CheckCircle2, Package, MapPin, ArrowRight, Loader2 } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useOrders } from "@/components/OrderContext"
import { useAuth } from "@/components/AuthContext"
import { useRouter } from "next/navigation"
import {
  clearPendingCheckout,
  completeUserCart,
  getApiErrorMessage,
  readPendingCheckout,
  saveDeliveryLocation,
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
  const userId = userSession?.user?.id || userSession?.user?._id || userSession?.id || userSession?._id

  const [step, setStep] = useState("shipping") // "processing" | "shipping" | "done"
  const [error, setError] = useState("")
  const [order, setOrder] = useState(null)
  const [checkout, setCheckout] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState(null)
  const completedOrderIdRef = useRef(null)

  const itemsRef = useRef(items)
  itemsRef.current = items
  const subtotalRef = useRef(subtotal)
  subtotalRef.current = subtotal

  const [shipping, setShipping] = useState({
    addressLine1: "",
    addressLine2: "",
    country: "",
    state: "",
    postcode: "",
  })
  const initializedPaymentRef = useRef(null)

  useEffect(() => {
    if (!isOpen || isUserAuthenticated) return
    onClose()
    router.push("/login?next=/cart")
  }, [isOpen, isUserAuthenticated, onClose, router])

  const applyDeliveryDetails = async (shippingData, explicitOrderId = null) => {
    console.log("==> [CheckoutModal] applyDeliveryDetails invoked with:", {
      shippingData,
      explicitOrderId,
      completedOrderIdRef: completedOrderIdRef.current,
      completedOrderId,
    })

    const refreshedOrders = await refreshOrders()
    console.log("==> [CheckoutModal] Refreshed orders list:", refreshedOrders)

    let matchedOrder = findMatchingOrder(refreshedOrders, paymentInfo)
    const fallbackId = explicitOrderId || completedOrderIdRef.current || completedOrderId

    if (!matchedOrder && fallbackId && refreshedOrders?.length) {
      matchedOrder = refreshedOrders.find(
        (o) => String(o.id || o._id) === String(fallbackId),
      )
    }

    if (!matchedOrder && refreshedOrders?.length) {
      matchedOrder =
        refreshedOrders.find(
          (o) => (o.deliveryStatus === "PENDING" || !o.destination?.address) && (o.id || o._id),
        ) || refreshedOrders[0]
    }

    let orderIdToUpdate = matchedOrder?.id || matchedOrder?._id || fallbackId

    if (!orderIdToUpdate && authToken && userId) {
      try {
        const compRes = await completeUserCart({ authToken, userId })
        const compId =
          compRes?.order?._id ||
          compRes?.order?.id ||
          compRes?.data?.order?._id ||
          compRes?.data?.order?.id ||
          compRes?.data?._id ||
          compRes?.data?.id ||
          compRes?._id ||
          compRes?.id
        if (compId) {
          orderIdToUpdate = String(compId)
          completedOrderIdRef.current = String(compId)
          setCompletedOrderId(String(compId))
        }
      } catch (e) {
        console.error("Attempted completeUserCart on applyDeliveryDetails:", e)
      }
    }

    const destination = {
      address: [shippingData.addressLine1?.trim(), shippingData.addressLine2?.trim()].filter(Boolean).join(", "),
      addressLine1: (shippingData.addressLine1 || "").trim(),
      addressLine2: (shippingData.addressLine2 || "").trim(),
      country: (shippingData.country || "").trim(),
      state: (shippingData.state || "").trim(),
      postcode: (shippingData.postcode || "").trim(),
    }

    const currentCheckout = checkout || readPendingCheckout()
    const activeItems = currentCheckout?.items?.length ? currentCheckout.items : itemsRef.current
    const activeTotal = Number(currentCheckout?.total ?? subtotalRef.current) || 0
    const activeItemCount = Number(currentCheckout?.itemCount ?? itemsRef.current.length) || 0

    const baseOrder =
      matchedOrder ||
      {
        id: orderIdToUpdate || paymentInfo.tx_ref || "payment-confirmed",
        _id: orderIdToUpdate,
        status: "Processing",
        total: activeTotal,
        itemCount: activeItemCount,
        items: activeItems,
        createdAt: new Date().toISOString(),
        payment: {
          provider: "flutterwave",
          txRef: paymentInfo.tx_ref,
          transactionId: paymentInfo.transaction_id,
          status: "successful",
        },
      }

    const receiptOrder = withOrderDisplayFallbacks({
      ...baseOrder,
      id: orderIdToUpdate || baseOrder.id,
      destination,
    })

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (backendUrl && authToken && orderIdToUpdate) {
      const deliveryPayload = {
        deliveryDetails: {
          country: destination.country,
          city: destination.state,
          address: destination.address,
          stateOrProvince: destination.state,
          postCode: destination.postcode,
        },
      }

      console.log("==> [CheckoutModal] Updating order ID:", orderIdToUpdate)
      console.log("==> [CheckoutModal] Delivery payload:", deliveryPayload)

      try {
        const updateRes = await axios.put(
          `${backendUrl}/api/v1/users/orders/${orderIdToUpdate}`,
          deliveryPayload,
          { headers: { Authorization: `Bearer ${authToken}` } },
        )
        console.log("==> [CheckoutModal] Order update response:", updateRes.data)
      } catch (updateErr) {
        console.error("==> [CheckoutModal] Failed to update order delivery details:", updateErr)
      }
    }

    saveDeliveryLocation({
      orderId: receiptOrder.id,
      trackingCode: receiptOrder.trackingCode,
      paymentReference: paymentInfo.tx_ref,
      destination,
    })

    setOrder(receiptOrder)
    clearPendingCheckout()
    setStep("done")

    try {
      await clearCart()
    } catch (e) {
      console.error("==> [CheckoutModal] clearCart error:", e)
    }

    await refreshOrders()
    onOrderSettled?.()
    console.log("==> [CheckoutModal] Successfully completed order and transitioned to 'done'")
  }

  useEffect(() => {
    if (!isOpen || !paymentInfo) {
      if (!isOpen) initializedPaymentRef.current = null
      return
    }

    if (!authToken || !userId) return

    const sessionKey = `${paymentInfo.tx_ref}:${paymentInfo.transaction_id ?? ""}`
    if (initializedPaymentRef.current === sessionKey) return

    initializedPaymentRef.current = sessionKey
    setError("")
    setOrder(null)
    setSubmitting(false)

    const pendingCheckout = readPendingCheckout()
    console.log("==> [CheckoutModal] Read pendingCheckout from localStorage:", pendingCheckout)

    const savedDelivery = pendingCheckout?.deliveryDetails
    const hasValidSavedDelivery = Boolean(
      savedDelivery?.addressLine1?.trim() &&
      savedDelivery?.country?.trim() &&
      savedDelivery?.state?.trim(),
    )

    console.log("==> [CheckoutModal] savedDelivery details:", savedDelivery)
    console.log("==> [CheckoutModal] hasValidSavedDelivery:", hasValidSavedDelivery)

    setCheckout({
      items: pendingCheckout?.items?.length ? pendingCheckout.items : itemsRef.current,
      total: Number(pendingCheckout?.total ?? subtotalRef.current) || 0,
      itemCount: Number(pendingCheckout?.itemCount ?? itemsRef.current.length) || 0,
    })

    if (savedDelivery) {
      setShipping({
        addressLine1: savedDelivery.addressLine1 || "",
        addressLine2: savedDelivery.addressLine2 || "",
        country: savedDelivery.country || "",
        state: savedDelivery.state || "",
        postcode: savedDelivery.postcode || "",
      })
    } else {
      setShipping({ addressLine1: "", addressLine2: "", country: "", state: "", postcode: "" })
    }

    setStep(hasValidSavedDelivery ? "processing" : "shipping")

    void (async () => {
      let extractedOrderId = null
      try {
        console.log("==> [CheckoutModal] Calling completeUserCart...")
        const response = await completeUserCart({ authToken, userId })
        console.log("==> [CheckoutModal] completeUserCart response:", response)
        const id =
          response?.order?._id ||
          response?.order?.id ||
          response?.data?.order?._id ||
          response?.data?.order?.id ||
          response?.data?._id ||
          response?.data?.id ||
          response?._id ||
          response?.id
        if (id) {
          extractedOrderId = String(id)
          completedOrderIdRef.current = extractedOrderId
          setCompletedOrderId(extractedOrderId)
        }
      } catch (err) {
        if (!isMissingActiveCartError(err)) {
          console.error("==> [CheckoutModal] Failed to complete paid cart:", err)
        } else {
          console.log("==> [CheckoutModal] Active cart already completed or missing.")
        }
      }

      if (hasValidSavedDelivery && savedDelivery) {
        try {
          console.log("==> [CheckoutModal] Auto applying delivery details with orderId:", extractedOrderId)
          await applyDeliveryDetails(savedDelivery, extractedOrderId)
        } catch (err) {
          console.error("==> [CheckoutModal] Auto apply delivery failed:", err)
          setStep("shipping")
          setError("Please verify and confirm your delivery location below.")
        }
      } else {
        console.log("==> [CheckoutModal] No valid saved delivery details found, showing shipping form.")
        setStep("shipping")
      }
    })()
  }, [authToken, isOpen, paymentInfo?.tx_ref, paymentInfo?.transaction_id, userId])

  if (!isOpen || !isUserAuthenticated || !paymentInfo) return null

  const checkoutItems = checkout?.items ?? items
  const checkoutTotal = checkout?.total ?? subtotal
  const checkoutItemCount = checkout?.itemCount ?? items.length

  const stepLabel = {
    processing: "Finalizing order",
    shipping: "Delivery location",
    done: "Order confirmed",
  }[step]

  const handleShippingSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!shipping.addressLine1.trim() || !shipping.country.trim() || !shipping.state.trim()) {
      setError("Please fill in country, address, and state/province.")
      return
    }

    if (!checkoutItems.length || checkoutTotal <= 0) {
      setError("We could not find the paid cart details. Please contact support with your payment reference.")
      return
    }

    try {
      setSubmitting(true)
      await applyDeliveryDetails(shipping)
    } catch (err) {
      console.error(err)
      setError("Your payment was received, but we could not refresh your order yet. Please check purchase history.")
    } finally {
      setSubmitting(false)
    }
  }

  const destinationText = [
    order?.destination?.addressLine1 || shipping.addressLine1,
    order?.destination?.addressLine2 || shipping.addressLine2,
    order?.destination?.state || shipping.state,
    order?.destination?.postcode || shipping.postcode,
    order?.destination?.country || shipping.country,
  ]
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
              {step === "done" ? (
                <CheckCircle2 size={20} />
              ) : step === "processing" ? (
                <Loader2 size={20} className="animate-spin" />
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
            className="rounded-full p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Close checkout"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-10 text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-(--theme)/10 text-(--theme)">
                  <Loader2 size={32} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Finalizing your order…
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Registering your delivery details and setting up tracking.
                  </p>
                </div>
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

                {/* Address line 1 */}
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

                {/* Address line 2 */}
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

            {step === "done" && (
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push("/orders")
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-(--theme)/25 bg-white px-6 py-3.5 text-sm font-bold text-(--theme) transition-all duration-300 hover:scale-105 cursor-pointer dark:bg-[#16131f]"
                  >
                    <Package size={16} />
                    Purchase history
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
