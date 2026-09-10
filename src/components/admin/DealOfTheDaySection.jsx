"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import toast from "react-hot-toast"
import {
  Zap,
  Percent,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Package,
  Eye,
  Check,
  AlertCircle,
  Tag,
  ArrowRight,
  TrendingDown,
} from "lucide-react"
import { Field, inputClass } from "./formUi"
import DealOfTheDay from "../Dealoftheday"
import { getAdminToken } from "@/lib/cloudinary"

function normalizeProductItem(product, index = 0) {
  const primaryImage =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
    product.image?.url ||
    (typeof product.image === "string" ? product.image : null) ||
    product.url ||
    "/thumbnail.webp"

  const hasHotDealStatus =
    typeof product.hotDeal?.status === "boolean"
      ? product.hotDeal.status
      : typeof product.status === "boolean"
        ? product.status
        : false

  const hotDealPercent =
    Number(product.hotDeal?.percentage) ||
    Number(product.hotDeal?.discountPercent) ||
    Number(product.percentage) ||
    Number(product.discountPercent) ||
    0

  return {
    id: product.id ?? product._id ?? Date.now() + index,
    brand: product.brand || product.category || "CartBehind",
    title: product.title || product.name || "Untitled product",
    name: product.name || product.title || "Untitled product",
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
    discountPercent: hotDealPercent,
    percentage: hotDealPercent,
    status: hasHotDealStatus,
    hotDeal: product.hotDeal || { status: hasHotDealStatus, percentage: hotDealPercent },
    image: primaryImage,
    category: product.category || "General",
    description: product.description || "",
    stock: Number(product.stock) || 0,
    deliveryTime: product.deliveryTime != null ? String(product.deliveryTime) : "1",
    publicId: product.publicId || product.images?.[0]?.publicId || "",
    fileType: product.fileType || product.images?.[0]?.fileType || "",
  }
}

export default function DealOfTheDaySection({
  products: initialProducts = [],
  onProductUpdated,
}) {
  const [products, setProducts] = useState(initialProducts)
  const [loadingProducts, setLoadingProducts] = useState(!initialProducts.length)
  const [productsError, setProductsError] = useState("")

  // Form states per user specification:
  // 1. Selected product ID
  const [selectedProductId, setSelectedProductId] = useState("")
  // 2. Status: true or false
  const [status, setStatus] = useState(true)
  // 3. Percentage input
  const [percentage, setPercentage] = useState("20")

  // Filter/search in product picker
  const [searchQuery, setSearchQuery] = useState("")
  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL

  // Fetch products from backend
  const fetchProductsList = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError("")
    try {
      const response = await fetch(
        `${API_URL}/api/v1/users/products?page=1&limit=100`,
        { cache: "no-store" }
      )
      const rawData = await response.json()
      const rawList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.products)
          ? rawData.products
          : Array.isArray(rawData?.data)
            ? rawData.data
            : []

      const normalized = rawList.map(normalizeProductItem)
      setProducts(normalized)

      // If no product currently selected, pick the first one by default
      if (normalized.length > 0 && !selectedProductId) {
        setSelectedProductId(String(normalized[0].id))
        if (normalized[0].discountPercent) {
          setPercentage(String(normalized[0].discountPercent))
        }
        if (typeof normalized[0].status === "boolean") {
          setStatus(normalized[0].status)
        }
      }
    } catch (err) {
      console.error("Failed to fetch products for Deal of the Day:", err)
      setProductsError(err.message || "Failed to load products.")
    } finally {
      setLoadingProducts(false)
    }
  }, [API_URL, selectedProductId])

  // Initial fetch on mount if products empty
  useEffect(() => {
    if (!initialProducts.length) {
      fetchProductsList()
    } else {
      const normalized = initialProducts.map(normalizeProductItem)
      setProducts(normalized)
      if (normalized.length > 0 && !selectedProductId) {
        setSelectedProductId(String(normalized[0].id))
      }
    }
  }, [initialProducts, fetchProductsList, selectedProductId])

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    )
  }, [products, searchQuery])

  // Currently selected product object
  const selectedProduct = useMemo(() => {
    return (
      products.find((p) => String(p.id) === String(selectedProductId)) ||
      products[0] ||
      null
    )
  }, [products, selectedProductId])

  // When selected product changes, sync its existing discount or status if available
  const handleSelectProduct = (prodId) => {
    setSelectedProductId(prodId)
    const found = products.find((p) => String(p.id) === String(prodId))
    if (found) {
      if (found.hotDeal?.percentage || found.percentage || found.discountPercent) {
        setPercentage(
          String(found.hotDeal?.percentage || found.percentage || found.discountPercent)
        )
      }
      if (typeof found.hotDeal?.status === "boolean") {
        setStatus(found.hotDeal.status)
      } else if (typeof found.status === "boolean") {
        setStatus(found.status)
      }
    }
  }

  // Calculated deal price for preview
  const originalPrice = selectedProduct ? selectedProduct.price : 79984
  const discountVal = Math.min(100, Math.max(0, Number(percentage) || 0))
  const calculatedDealPrice = Math.max(
    0,
    Math.round(originalPrice * (1 - discountVal / 100))
  )
  const savingsAmount = Math.max(0, originalPrice - calculatedDealPrice)

  // Quick preset percentages
  const applyPresetPercentage = (val) => {
    setPercentage(String(val))
  }

  // Submit handler calling /admin/update-item/{theproductId}
  const handleSubmitDeal = async (e) => {
    e?.preventDefault()

    if (!selectedProductId) {
      toast.error("Please select a product first.")
      return
    }

    const numPercentage = Number(percentage)
    if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
      toast.error("Please enter a valid percentage between 0 and 100.")
      return
    }

    const token = getAdminToken()
    if (!token) {
      toast.error("Admin authorization token not found. Please log in again.")
      return
    }

    setIsSubmitting(true)

    // Pass name, description, price, stock, and hotDeal object with status and percentage as string
    const payload = {
      name: (selectedProduct?.name || selectedProduct?.title || "").trim(),
      description: selectedProduct?.description || "",
      price: Number(selectedProduct?.price || 0),
      stock: Number(selectedProduct?.stock || 0),
      hotDeal: {
        status: Boolean(status),
        percentage: String(percentage),
      },
    }

    console.log("🚀 [Deal of the Day] Sending payload to /admin/update-item:", {
      productId: selectedProductId,
      endpoint: `${API_URL}/api/v1/admin/update-item/${encodeURIComponent(selectedProductId)}`,
      payload,
    })

    try {
      const response = await fetch(
        `${API_URL}/api/v1/admin/update-item/${encodeURIComponent(selectedProductId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => ({}))

      console.log("📥 [Deal of the Day] Server response:", {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (!response.ok) {
        throw new Error(data?.message || `Update failed with status ${response.status}`)
      }

      toast.success(data?.message || "Deal of the day updated successfully!")

      // Update local product state
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(selectedProductId)
            ? {
                ...p,
                status: Boolean(status),
                percentage: String(percentage),
                discountPercent: numPercentage,
                hotDeal: {
                  status: Boolean(status),
                  percentage: String(percentage),
                },
              }
            : p
        )
      )

      if (onProductUpdated) {
        onProductUpdated(selectedProductId, payload)
      }
    } catch (err) {
      console.error("Error updating deal of the day:", err)
      toast.error(err.message || "Could not update item. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-r from-(--theme)/10 via-white to-(--theme)/5 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:from-[#1e172e] dark:via-[#16131f] dark:to-[#1a1528] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--theme) text-(--theme-second) shadow-lg shadow-(--theme)/20">
              <Zap size={26} className="fill-(--theme-second)" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Deal of the Day
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-(--theme)/15 px-2.5 py-0.5 text-xs font-black text-(--theme) dark:bg-(--theme)/25">
                  Promotional
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a product, set its deal status and discount percentage, and push updates live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchProductsList}
              disabled={loadingProducts}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm transition hover:border-(--theme) hover:text-(--theme) disabled:opacity-60 dark:border-white/10 dark:bg-[#12101a] dark:text-gray-200"
            >
              <RefreshCw size={14} className={loadingProducts ? "animate-spin" : ""} />
              Refresh Products
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Form (Left) & Live Preview (Right) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Controls Column */}
        <div className="space-y-6 lg:col-span-7">
          <form onSubmit={handleSubmitDeal} className="space-y-6">
            {/* Step 1: Select Product */}
            <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-(--theme)" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    1. Select Product
                  </h3>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {products.length} products available
                </span>
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                  <RefreshCw size={16} className="animate-spin text-(--theme)" />
                  Loading products catalog...
                </div>
              ) : productsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {productsError}
                  <button
                    type="button"
                    onClick={fetchProductsList}
                    className="ml-2 font-bold underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search filter input */}
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search product by name or category..."
                      className={inputClass("pl-9 h-11 text-sm")}
                    />
                  </div>

                  {/* Product Dropdown Selector */}
                  <Field label="Choose Product">
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className={inputClass("cursor-pointer font-medium")}
                    >
                      {filteredProducts.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.title} — ₦{prod.price.toLocaleString()} ({prod.category})
                        </option>
                      ))}
                    </select>
                  </Field>

                  {/* Selected Product Card Preview */}
                  {selectedProduct && (
                    <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 dark:border-white/10 dark:bg-[#12101a]">
                      <div
                        className="h-16 w-16 shrink-0 rounded-xl border border-black/5 bg-white bg-contain bg-center bg-no-repeat p-1 dark:border-white/10 dark:bg-[#16131f]"
                        style={{
                          backgroundImage: `url("${selectedProduct.image || "/thumbnail.webp"}")`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold text-gray-900 dark:text-white">
                            {selectedProduct.title}
                          </p>
                          {selectedProduct.status && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Active Deal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedProduct.category} &bull; ID: #{selectedProduct.id}
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-(--theme)">
                          ₦{selectedProduct.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Step 2: Deal Status (True / False) */}
            <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-(--theme)" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    2. Set Deal Status
                  </h3>
                </div>
                <span className="text-xs font-semibold text-gray-400">Boolean (true / false)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus(true)}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-bold transition-all ${status === true
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-[#f7f5fb] text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
                    }`}
                >
                  <CheckCircle2 size={18} className={status === true ? "text-emerald-600" : "text-gray-400"} />
                  <div className="text-left">
                    <p className="font-extrabold leading-tight">True</p>
                    <p className="text-[11px] font-normal opacity-80">Deal Active</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus(false)}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-bold transition-all ${status === false
                    ? "border-rose-500 bg-rose-50 text-rose-700 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/30 dark:text-rose-300 ring-2 ring-rose-500/20"
                    : "border-gray-200 bg-[#f7f5fb] text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
                    }`}
                >
                  <XCircle size={18} className={status === false ? "text-rose-600" : "text-gray-400"} />
                  <div className="text-left">
                    <p className="font-extrabold leading-tight">False</p>
                    <p className="text-[11px] font-normal opacity-80">Deal Inactive</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Step 3: Add Percentage */}
            <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Percent size={18} className="text-(--theme)" />
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    3. Add Percentage
                  </h3>
                </div>
                <span className="text-xs font-semibold text-gray-400">Discount percentage</span>
              </div>

              <div className="space-y-4">
                <Field label="Discount Percentage (%)">
                  <div className="relative">
                    <Percent
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g. 20"
                      className={inputClass("pl-9 font-bold text-base")}
                    />
                  </div>
                </Field>

                {/* Quick preset percentage pills */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Quick Presets:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {[10, 15, 20, 25, 30, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => applyPresetPercentage(val)}
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${Number(percentage) === val
                          ? "bg-(--theme) text-(--theme-second) shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
                          }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation breakdown */}
                {selectedProduct && (
                  <div className="mt-3 rounded-xl border border-gray-100 bg-[#f7f5fb] p-3.5 text-xs dark:border-white/10 dark:bg-[#12101a]">
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500">Original Price:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        ₦{originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500">Discount ({discountVal}%):</span>
                      <span className="font-semibold text-emerald-600">
                        -₦{savingsAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 text-sm font-extrabold">
                      <span className="text-gray-700 dark:text-gray-300">New Deal Price:</span>
                      <span className="text-(--theme)">
                        ₦{calculatedDealPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedProductId}
                className="inline-flex h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-(--theme) px-8 text-base font-black text-(--theme-second) shadow-xl shadow-(--theme)/25 transition hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Updating Deal of the Day...
                  </>
                ) : (
                  <>
                    <Zap size={22} className="fill-(--theme-second)" />
                    Update Deal of the Day
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Customer Preview Column */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={17} className="text-(--theme)" />
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Customer Storefront Preview
                </h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${status
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                  }`}
              >
                {status ? "Live Active" : "Inactive Deal"}
              </span>
            </div>

            {/* Preview Box */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 p-2 shadow-inner dark:border-white/10 dark:bg-[#12101a]">
              <div className="w-full">
                <DealOfTheDay
                  productName={selectedProduct?.title || "Select a Product"}
                  discountPercent={discountVal}
                  price={calculatedDealPrice}
                  originalPrice={originalPrice}
                  image={selectedProduct?.image || "/thumbnail.webp"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
