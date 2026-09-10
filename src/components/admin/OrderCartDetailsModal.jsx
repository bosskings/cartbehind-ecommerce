"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  AlertCircle,
  Boxes,
  Calendar,
  Check,
  Code,
  Copy,
  CreditCard,
  ExternalLink,
  Layers,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react"
import { getAdminToken } from "@/lib/cloudinary"
import {
  fetchAdminCartDetails,
  getApiErrorMessage,
  isAdminAuthError,
  normalizeCartDetailsResponse,
} from "@/lib/orders"
import { formatOrderDate } from "@/components/admin/transitUtils"

function formatNumber(value) {
  return new Intl.NumberFormat("en-NG").format(Number(value) || 0)
}

function formatNaira(value) {
  return `NGN ${formatNumber(value)}`
}

export default function OrderCartDetailsModal({
  order,
  userEmail,
  onClose,
  onAuthExpired,
  onOpenTransitEditor,
  onOpenTransitDetails,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cartItems, setCartItems] = useState([])
  const [rawResponse, setRawResponse] = useState(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const orderId = order?.id || order?._id || order?.orderId

  const loadCartDetails = async () => {
    if (!orderId) {
      console.warn("OrderCartDetailsModal: No order ID found on order:", order)
      setError("No valid order ID found.")
      setLoading(false)
      return
    }

    const token = getAdminToken()
    if (!token) {
      onAuthExpired?.()
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log(`[OrderCartDetailsModal] Requesting /admin/cart-details/${orderId}...`)
      const data = await fetchAdminCartDetails(token, orderId)
      
      // Prominent console logs so the user can easily inspect in DevTools:
      console.log(`%c[OrderCartDetailsModal] FULL BACKEND RESPONSE FOR ORDER: ${orderId}`, "color: #10b981; font-weight: bold; font-size: 14px;")
      console.log("Raw Response Object:", data)
      try {
        console.log("Full Formatted JSON:\n" + JSON.stringify(data, null, 2))
      } catch (e) {
        console.warn("Could not stringify data:", e)
      }

      setRawResponse(data)
      const normalized = normalizeCartDetailsResponse(data)
      console.log(`[OrderCartDetailsModal] Normalized ${normalized.length} cart items:`, normalized)
      setCartItems(normalized)
    } catch (err) {
      console.error(`[OrderCartDetailsModal] Failed to fetch cart details for order ${orderId}:`, err)
      if (isAdminAuthError(err)) {
        onAuthExpired?.()
        return
      }
      const message = getApiErrorMessage(err, "Failed to load order product details.")
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCartDetails()
  }, [orderId])

  const totals = useMemo(() => {
    const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
    const calculatedTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0)
    const displayTotal = calculatedTotal > 0 ? calculatedTotal : (order?.total || 0)

    return {
      itemCount: cartItems.length,
      totalQuantity,
      calculatedTotal,
      displayTotal,
    }
  }, [cartItems, order?.total])

  const copyRawJson = async () => {
    if (!rawResponse) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2))
      setCopied(true)
      toast.success("Raw JSON copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy JSON.")
    }
  }

  const customerLabel = userEmail || order?.email || order?.userEmail || order?.userId || "Guest Customer"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs p-0 transition-opacity sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-white shadow-2xl dark:bg-[#16131f] sm:rounded-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 p-5 dark:border-white/10 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-(--theme)/10 px-2.5 py-1 text-xs font-bold text-(--theme)">
                  <ShoppingBag size={14} />
                  Order Products
                </span>
                <span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                  ID: #{orderId}
                </span>
              </div>
              <h2 className="mt-1.5 truncate text-xl font-black text-gray-900 dark:text-white">
                {customerLabel}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {formatOrderDate(order?.datePurchased || order?.createdAt)}
                </span>
                {order?.paymentStatus && (
                  <span className="flex items-center gap-1 font-semibold">
                    <CreditCard size={13} />
                    Payment: <span className="uppercase">{order.paymentStatus}</span>
                  </span>
                )}
                {order?.deliveryStatus && (
                  <span className="flex items-center gap-1 font-semibold">
                    <Truck size={13} />
                    Delivery: <span className="uppercase">{order.deliveryStatus}</span>
                  </span>
                )}
              </div>
              {order?.deliveryDetails && (order?.deliveryDetails?.address || order?.deliveryDetails?.city) && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  <MapPin size={13} className="shrink-0 text-(--theme)" />
                  <span className="truncate">
                    <strong className="text-gray-700 dark:text-gray-200">Ship to: </strong>
                    {[
                      order.deliveryDetails.address,
                      order.deliveryDetails.city,
                      order.deliveryDetails.stateOrProvince || order.deliveryDetails.state,
                      order.deliveryDetails.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {order.deliveryDetails.postCode ? ` (${order.deliveryDetails.postCode})` : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {rawResponse && (
                <button
                  type="button"
                  onClick={() => setShowRawJson((prev) => !prev)}
                  title="Toggle raw response JSON"
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                    showRawJson
                      ? "border-(--theme) bg-(--theme)/10 text-(--theme)"
                      : "border-gray-200 text-gray-600 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-300"
                  }`}
                >
                  <Code size={14} />
                  <span>{showRawJson ? "Hide JSON" : "Raw JSON"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close order details"
                className="shrink-0 cursor-pointer rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-(--theme)" />
              <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Fetching products for order #{orderId}...
              </p>
              <p className="text-xs text-gray-400">Calling GET /api/v1/admin/cart-details/{orderId}</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-2 font-bold">{error}</p>
              <p className="mt-1 text-xs text-red-500">
                Check browser console for the full error details.
              </p>
              <button
                type="button"
                onClick={loadCartDetails}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          )}

          {/* Raw JSON Inspector View (When toggled) */}
          {showRawJson && rawResponse && (
            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-950 p-4 text-white dark:border-white/10">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <Code size={14} />
                  <span>Raw Backend Response (GET /api/v1/admin/cart-details/{orderId})</span>
                </div>
                <button
                  type="button"
                  onClick={copyRawJson}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-200 transition hover:bg-white/20"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-xl bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-300">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}

          {!loading && !error && cartItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f7f5fb] py-14 text-center dark:border-white/10 dark:bg-[#12101a]">
              <Package className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-200">
                No products found in this order
              </p>
              <p className="mt-1 text-xs text-gray-400">
                The cart details response did not contain any products. Click &quot;Raw JSON&quot; above to inspect the backend response.
              </p>
            </div>
          )}

          {!loading && !error && cartItems.length > 0 && (
            <div className="space-y-4">
              {/* Order Stats Overview */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-semibold text-gray-400">Unique Products</p>
                  <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">
                    {totals.itemCount}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-semibold text-gray-400">Total Units</p>
                  <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">
                    {totals.totalQuantity}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-semibold text-gray-400">Calculated Value</p>
                  <p className="mt-1 text-lg font-black text-(--theme)">
                    {formatNaira(totals.displayTotal)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 dark:border-white/10 dark:bg-[#12101a]">
                  <p className="text-xs font-semibold text-gray-400">Delivery Status</p>
                  <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {order?.deliveryStatus || "PENDING"}
                  </p>
                </div>
              </div>

              {/* Product Cards */}
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-[#12101a]/50">
                {cartItems.map((item, index) => (
                  <article
                    key={item.id || index}
                    className="flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      {/* Product Thumbnail */}
                      <div
                        className="h-16 w-16 shrink-0 rounded-xl border border-black/5 bg-gray-100 bg-cover bg-center dark:border-white/10 dark:bg-white/10"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                        role="img"
                        aria-label={item.name}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                              <Tag size={10} />
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {item.productId && (
                            <span className="font-mono text-[11px] text-gray-400">
                              SKU: {item.productId}
                            </span>
                          )}
                          {item.stock !== null && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Stock: {formatNumber(item.stock)}
                            </span>
                          )}
                        </div>

                        {/* Extra image gallery previews if available */}
                        {item.images && item.images.length > 1 && (
                          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto">
                            {item.images.slice(0, 4).map((img, imgIdx) => {
                              const thumbUrl = typeof img === "string" ? img : img?.url
                              if (!thumbUrl) return null
                              return (
                                <a
                                  key={imgIdx}
                                  href={thumbUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-7 w-7 shrink-0 rounded-md border border-gray-200 bg-cover bg-center transition hover:scale-105 dark:border-white/10"
                                  style={{ backgroundImage: `url("${thumbUrl}")` }}
                                  title="View original image"
                                />
                              )
                            })}
                            {item.images.length > 4 && (
                              <span className="text-[10px] text-gray-400">
                                +{item.images.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity breakdown */}
                    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-50 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400">
                          Unit: {formatNaira(item.price)}
                        </p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Subtotal
                        </p>
                        <p className="text-base font-black text-gray-900 dark:text-white">
                          {formatNaira(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#f7f5fb] p-4 dark:border-white/10 dark:bg-[#12101a] sm:px-6">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {cartItems.length > 0 && (
              <span>
                Showing <strong>{cartItems.length}</strong> items in this order
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenTransitEditor && (
              <button
                type="button"
                onClick={() => onOpenTransitEditor(order)}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3.5 text-xs font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
              >
                <Truck size={15} />
                Transit Editor
              </button>
            )}

            {onOpenTransitDetails && (
              <button
                type="button"
                onClick={() => onOpenTransitDetails(order)}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3.5 text-xs font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-200"
              >
                <ExternalLink size={15} />
                Transit Details
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-(--theme) px-5 text-xs font-bold text-(--theme-second) transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
