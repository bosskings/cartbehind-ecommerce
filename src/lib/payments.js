import axios from "axios"

const PENDING_CHECKOUT_KEY = "cartbehind-pending-checkout"

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
    responseData?.data?.link ||
    responseData?.link ||
    responseData?.data?.data?.link ||
    null
  )
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

export async function initiateFlutterwavePayment({ authToken, payload }) {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is missing.")
  }

  if (!authToken) {
    throw new Error("You must be logged in to pay.")
  }

  const response = await axios.post(
    `${backendUrl}/api/v1/users/flutterwave/pay`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  )

  return response.data
}

export { getApiErrorMessage }

