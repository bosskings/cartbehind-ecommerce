"use client"

import React, { useState, useMemo } from "react"
import {
  Zap,
  ShoppingBag,
  Clock,
  ImagePlus,
  Sparkles,
  Calendar,
  Percent,
  Tag,
  ArrowRight,
  Eye,
  RotateCcw,
  Check,
  AlertCircle,
  Package,
} from "lucide-react"
import { Field, inputClass } from "./formUi"
import DealOfTheDay from "../Dealoftheday"

export default function DealOfTheDaySection({ products = [] }) {
  // Default values mirroring Dealoftheday.jsx
  const [productName, setProductName] = useState("Calvin Klein CK One")
  const [price, setPrice] = useState("78472")
  const [originalPrice, setOriginalPrice] = useState("79984")
  const [discountPercent, setDiscountPercent] = useState("2")
  const [imagePreview, setImagePreview] = useState(
    "https://cdn.dummyjson.com/products/images/fragrances/Calvin%20Klein%20CK%20One/1.png"
  )
  const [imageUrl, setImageUrl] = useState("")
  const [dealDurationHours, setDealDurationHours] = useState(24)
  const [customEndTime, setCustomEndTime] = useState(() => {
    const defaultDate = new Date(Date.now() + 24 * 3600 * 1000)
    return defaultDate.toISOString().slice(0, 16)
  })
  const [badgeText, setBadgeText] = useState("DEAL OF THE DAY")
  const [selectedProductId, setSelectedProductId] = useState("")

  // Calculate effective end time timestamp for live preview
  const effectiveEndTime = useMemo(() => {
    if (customEndTime) {
      const parsed = new Date(customEndTime).getTime()
      if (!isNaN(parsed) && parsed > Date.now()) return parsed
    }
    return Date.now() + dealDurationHours * 3600 * 1000
  }, [customEndTime, dealDurationHours])

  // Handle auto-calculating discount percentage
  const autoCalculateDiscount = () => {
    const p = parseFloat(price)
    const orig = parseFloat(originalPrice)
    if (p > 0 && orig > p) {
      const calculated = Math.round(((orig - p) / orig) * 100)
      setDiscountPercent(String(calculated))
    }
  }

  // Handle product selection from catalog
  const handleSelectProduct = (e) => {
    const prodId = e.target.value
    setSelectedProductId(prodId)
    if (!prodId) return

    const found = products.find((p) => String(p.id) === String(prodId))
    if (found) {
      setProductName(found.title || found.name || "")
      setPrice(found.price ? String(found.price) : "")
      if (found.originalPrice && Number(found.originalPrice) > Number(found.price)) {
        setOriginalPrice(String(found.originalPrice))
        const calc = Math.round(
          ((Number(found.originalPrice) - Number(found.price)) /
            Number(found.originalPrice)) *
            100
        )
        setDiscountPercent(String(calc))
      } else if (found.discountPercent) {
        setDiscountPercent(String(found.discountPercent))
        const orig = Math.round(
          Number(found.price) / (1 - Number(found.discountPercent) / 100)
        )
        setOriginalPrice(String(orig))
      } else {
        const estOriginal = Math.round(Number(found.price) * 1.25)
        setOriginalPrice(String(estOriginal))
        setDiscountPercent("20")
      }
      if (found.image) {
        setImagePreview(found.image)
        setImageUrl("")
      }
    }
  }

  // Quick preset duration click
  const applyPresetDuration = (hours) => {
    setDealDurationHours(hours)
    const futureDate = new Date(Date.now() + hours * 3600 * 1000)
    setCustomEndTime(futureDate.toISOString().slice(0, 16))
  }

  // Handle local image file upload for preview
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setImagePreview(objectUrl)
      setImageUrl("")
    }
  }

  // Handle manual image URL input
  const handleImageUrlChange = (e) => {
    const val = e.target.value
    setImageUrl(val)
    if (val.trim()) {
      setImagePreview(val.trim())
    }
  }

  // Reset form to demo values
  const handleReset = () => {
    setProductName("Calvin Klein CK One")
    setPrice("78472")
    setOriginalPrice("79984")
    setDiscountPercent("2")
    setImagePreview(
      "https://cdn.dummyjson.com/products/images/fragrances/Calvin%20Klein%20CK%20One/1.png"
    )
    setImageUrl("")
    setSelectedProductId("")
    applyPresetDuration(24)
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
                  <Sparkles size={12} />
                  Promotional
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure the headline featured deal and preview how it will appear to store visitors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:bg-[#12101a] dark:text-gray-200"
            >
              <RotateCcw size={14} />
              Reset Form
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Form (Left) & Live Preview (Right) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Controls Column */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <Tag size={18} className="text-(--theme)" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Deal Details & Pricing
                </h3>
              </div>
              <span className="text-xs font-semibold text-gray-400">All fields reactive</span>
            </div>

            {/* Quick Catalog Product Selector */}
            {products.length > 0 && (
              <div className="mb-5 rounded-xl border border-dashed border-(--theme)/30 bg-(--theme)/5 p-4 dark:bg-(--theme)/10">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-(--theme)">
                  Quick Fill From Store Catalog
                </label>
                <div className="relative">
                  <Package size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className={inputClass("pl-10 cursor-pointer font-medium")}
                    value={selectedProductId}
                    onChange={handleSelectProduct}
                  >
                    <option value="">-- Choose a product to auto-fill --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.name} — ₦{Number(p.price || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <Field label="Product Name / Title">
                  <input
                    className={inputClass()}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Calvin Klein CK One"
                  />
                </Field>
              </div>

              {/* Deal Price */}
              <div>
                <Field label="Deal Price (₦)">
                  <input
                    type="number"
                    min="0"
                    className={inputClass()}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="78472"
                  />
                </Field>
              </div>

              {/* Original Price */}
              <div>
                <Field label="Original Price (₦ - Strikethrough)">
                  <input
                    type="number"
                    min="0"
                    className={inputClass()}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="79984"
                  />
                </Field>
              </div>

              {/* Discount Percentage */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    Discount (%)
                  </span>
                  {Number(originalPrice) > Number(price) && (
                    <button
                      type="button"
                      onClick={autoCalculateDiscount}
                      className="cursor-pointer text-[11px] font-extrabold text-(--theme) hover:underline"
                    >
                      Auto-calculate
                    </button>
                  )}
                </div>
                <div className="relative mt-2">
                  <Percent size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    max="99"
                    className={inputClass("pl-9")}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              {/* Badge Text */}
              <div>
                <Field label="Badge / Header Tag">
                  <input
                    className={inputClass()}
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="DEAL OF THE DAY"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Deal Duration & Timer Section */}
          <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-(--theme)" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Countdown Timer & Expiry
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {/* Quick Duration Preset Pills */}
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Quick Duration Presets
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: "12 Hours", hours: 12 },
                    { label: "24 Hours (1 Day)", hours: 24 },
                    { label: "48 Hours (2 Days)", hours: 48 },
                    { label: "3 Days", hours: 72 },
                    { label: "7 Days (1 Week)", hours: 168 },
                  ].map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => applyPresetDuration(preset.hours)}
                      className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        dealDurationHours === preset.hours
                          ? "bg-(--theme) text-(--theme-second) shadow-sm"
                          : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:bg-[#12101a] dark:text-gray-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Date & Time Picker */}
              <div className="pt-2">
                <Field label="Or Set Specific Expiry Date & Time">
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      className={inputClass("pl-10 font-medium cursor-pointer")}
                      value={customEndTime}
                      onChange={(e) => {
                        setCustomEndTime(e.target.value)
                        setDealDurationHours(null)
                      }}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          {/* Image Upload / URL Section */}
          <section className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#16131f] sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <ImagePlus size={18} className="text-(--theme)" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Product Image
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {/* File Upload Area */}
              <label className="flex min-h-32 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-[#f7f5fb] p-4 transition hover:border-(--theme) hover:bg-white dark:border-white/15 dark:bg-[#12101a] dark:hover:bg-white/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="sr-only"
                />
                <span
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white bg-contain bg-center bg-no-repeat p-1 text-(--theme) dark:border-white/10 dark:bg-[#16131f]"
                  style={imagePreview ? { backgroundImage: `url("${imagePreview}")` } : undefined}
                >
                  {!imagePreview && <ImagePlus size={24} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 dark:text-gray-100">
                    {imagePreview ? "Change product image file" : "Upload product image"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, or WEBP (transparent or high-res recommended)
                  </p>
                </div>
              </label>

              {/* Direct Image URL input */}
              <div>
                <Field label="Or Direct Image URL">
                  <input
                    type="url"
                    className={inputClass()}
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/product-image.png"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--theme) px-6 text-sm font-black text-(--theme-second) shadow-lg shadow-(--theme)/20 transition hover:opacity-90 active:scale-98"
            >
              <Zap size={18} className="fill-(--theme-second)" />
              Add Deal of the Day
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 px-6 text-sm font-bold text-gray-600 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Live Preview Column (Right) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={17} className="text-(--theme)" />
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Customer Storefront Preview
                </h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Live Rendering
              </span>
            </div>

            {/* Preview Container */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 p-2 shadow-inner dark:border-white/10 dark:bg-[#12101a]">
              <div className="w-full">
                <DealOfTheDay
                  productName={productName || "Product Title"}
                  discountPercent={Number(discountPercent) || 0}
                  price={Number(price) || 0}
                  originalPrice={Number(originalPrice) || 0}
                  image={imagePreview || "/thumbnail.webp"}
                  endTime={effectiveEndTime}
                />
              </div>
            </div>

            {/* Deal Summary Specs Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 text-xs shadow-sm dark:border-white/10 dark:bg-[#16131f]">
              <h4 className="mb-3 font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Deal Configuration Summary
              </h4>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between border-b border-gray-100 pb-1.5 dark:border-white/5">
                  <span className="text-gray-500">Product:</span>
                  <span className="font-bold truncate max-w-[200px]">{productName || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5 dark:border-white/5">
                  <span className="text-gray-500">Deal Price:</span>
                  <span className="font-bold text-(--theme)">₦{Number(price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5 dark:border-white/5">
                  <span className="text-gray-500">Original Price:</span>
                  <span className="font-medium line-through text-gray-400">₦{Number(originalPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5 dark:border-white/5">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-bold text-emerald-600">{discountPercent}% Off</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timer Target:</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {new Date(effectiveEndTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
