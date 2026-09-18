import axios from "axios"

const PENDING_CHECKOUT_KEY = "cartbehind-pending-checkout"
const DELIVERY_LOCATIONS_KEY = "cartbehind-delivery-locations"

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL
}

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback
}

export function getPaymentCallbackUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/track`
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/track`
  }

  return "/track"
}

const SUCCESSFUL_PAYMENT_STATUSES = new Set(["successful", "completed"])

export function isSuccessfulPayment(status) {
  return SUCCESSFUL_PAYMENT_STATUSES.has(String(status || "").toLowerCase())
}

export function extractPaymentLink(responseData) {
  return (
    responseData?.paymentLink ||
    responseData?.data?.paymentLink ||
    responseData?.data?.data?.link ||
    responseData?.data?.link ||
    responseData?.link ||
    null
  )
}

export function extractBankTransfer(responseData) {
  const bt =
    responseData?.bankTransfer ||
    responseData?.bank_transfer ||
    responseData?.data?.bankTransfer ||
    responseData?.data?.bank_transfer ||
    responseData?.data?.data?.bankTransfer ||
    null

  if (!bt) return null

  return {
    bankName: bt.bankName || bt.bank_name || bt.bank || "Bank Transfer",
    accountNumber: bt.accountNumber || bt.account_number || bt.account || "",
    amount: bt.amount || bt.amountToPay || null,
    transferReference:
      bt.transferReference ||
      bt.transfer_reference ||
      bt.reference ||
      bt.tx_ref ||
      bt.flw_ref ||
      "",
    raw: bt,
  }
}

export function savePendingCheckout(checkout) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(
    PENDING_CHECKOUT_KEY,
    JSON.stringify({
      ...checkout,
      savedAt: new Date().toISOString(),
    }),
  )
}

export function readPendingCheckout() {
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return parsed && Array.isArray(parsed.items) ? parsed : null
  } catch {
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY)
    return null
  }
}

export function clearPendingCheckout() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(PENDING_CHECKOUT_KEY)
}

function readDeliveryLocations() {
  if (typeof window === "undefined") return {}

  try {
    const stored = window.localStorage.getItem(DELIVERY_LOCATIONS_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    window.localStorage.removeItem(DELIVERY_LOCATIONS_KEY)
    return {}
  }
}

export function saveDeliveryLocation({ orderId, trackingCode, paymentReference, destination }) {
  if (typeof window === "undefined" || !destination) return

  const locations = readDeliveryLocations()
  const keys = [orderId, trackingCode, paymentReference].filter(Boolean).map(String)
  for (const key of keys) {
    locations[key] = destination
  }

  if (keys.length) {
    window.localStorage.setItem(DELIVERY_LOCATIONS_KEY, JSON.stringify(locations))
  }
}

export function readDeliveryLocation({ orderId, trackingCode, paymentReference }) {
  const locations = readDeliveryLocations()
  const keys = [orderId, trackingCode, paymentReference].filter(Boolean).map(String)
  return keys.map((key) => locations[key]).find(Boolean) || null
}

export async function completeUserCart({ authToken, userId }) {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  if (!authToken) {
    throw new Error("You must be logged in to complete your cart.")
  }

  if (!userId) {
    throw new Error("We could not find your user id to complete the cart.")
  }

  const response = await axios.post(
    `${backendUrl}/api/v1/users/cart/complete`,
    { id: userId },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  )

  return response.data
}

export async function initiateFlutterwavePayment({ authToken, payload }) {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  if (!authToken) {
    throw new Error("You must be logged in to pay.")
  }

  const url = `${backendUrl}/api/v1/users/flutterwave/pay`

  console.log("💳 [Flutterwave Pay] Calling endpoint:", url, {
    payload,
    hasToken: Boolean(authToken),
  })

  try {
    const response = await axios.post(
      url,
      payload,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    console.log("💳 [Flutterwave Pay] Response status:", response.status)
    console.log("💳 [Flutterwave Pay] Full response returned:", response.data)

    return response.data
  } catch (error) {
    console.error("💳 [Flutterwave Pay] Error returned from endpoint:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    throw error
  }
}

export { getApiErrorMessage }


