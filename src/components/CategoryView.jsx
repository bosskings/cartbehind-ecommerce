"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronRight, SlidersHorizontal, ShoppingBag } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ProductCard from "@/components/ProductCard"
import { useProducts } from "@/hooks/useProducts"

const deliveryOptions = [
  { id: "all", name: "All items", value: "All" },
  { id: "same-day", name: "Same day delivery", value: "1" },
  { id: "7-days", name: "7 day delivery", value: "7" },
]

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#16131f]">
      <div className="aspect-[5/5] w-full bg-gray-200 dark:bg-white/10" />
      <div className="space-y-3 px-5 pb-5 pt-4">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  )
}

export default function CategoryView({ categoryName }) {
  const { products, loading, error } = useProducts()
  const [deliveryFilter, setDeliveryFilter] = useState("All")
  const [sortBy, setSortBy] = useState("default")

  // Filter products matching this category
  const categoryProducts = useMemo(() => {
    if (!products?.length) return []
    const target = (categoryName || "").trim().toLowerCase()
    return products.filter((p) => {
      const cat = (p.category || "").trim().toLowerCase()
      return cat === target
    })
  }, [products, categoryName])

  // Apply delivery filter and sorting
  const displayedProducts = useMemo(() => {
    let list = [...categoryProducts]

    if (deliveryFilter !== "All") {
      list = list.filter(
        (p) => String(p.deliveryTime || "1") === String(deliveryFilter),
      )
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }

    return list
  }, [categoryProducts, deliveryFilter, sortBy])

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] pb-24 pt-28 dark:bg-background md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.06),transparent_50%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Back button */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Link href="/" className="transition hover:text-(--theme)">
                Home
              </Link>
              <ChevronRight size={13} />
              <span className="text-gray-400">Categories</span>
              <ChevronRight size={13} />
              <span className="text-(--theme) font-bold">{categoryName}</span>
            </nav>

            <Link
              href="/"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200"
            >
              <ArrowLeft size={14} />
              <span>Back to store</span>
            </Link>
          </div>

          {/* Category Banner / Header */}
          <div className="mb-8 rounded-3xl border border-white/80 bg-gradient-to-r from-(--theme)/10 via-white/70 to-white/90 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] backdrop-blur dark:border-white/10 dark:from-[#280E89]/20 dark:via-[#16131f]/80 dark:to-[#16131f] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.24em] text-(--theme)">
                  Category Collection
                </span>
                <h1 className="mt-1 text-3xl font-black text-gray-950 dark:text-white sm:text-4xl">
                  {categoryName}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Browse all {categoryName.toLowerCase()} available for instant purchase and doorstep delivery.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-white px-5 py-3.5 text-center shadow-sm dark:bg-[#16131f]">
                <p className="text-2xl font-black text-(--theme)">
                  {loading ? "..." : categoryProducts.length}
                </p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Total {categoryProducts.length === 1 ? "Product" : "Products"}
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Sorting Toolbar */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Delivery Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {deliveryOptions.map((opt) => {
                const isActive = deliveryFilter === opt.value
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDeliveryFilter(opt.value)}
                    className={`relative cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "text-(--theme-second)"
                        : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#16131f] dark:text-gray-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="categoryDeliveryPill"
                        className="absolute inset-0 rounded-full bg-(--theme)"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    {opt.name}
                  </button>
                )
              })}
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-(--theme) dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200"
              >
                <option value="default">Default sorting</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          {/* Product Grid Area */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="font-semibold">{error}</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/50 px-6 py-16 text-center dark:border-white/10 dark:bg-[#16131f]/50">
              <ShoppingBag className="mx-auto mb-3 text-gray-400" size={38} strokeWidth={1.5} />
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                No products found
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {deliveryFilter !== "All"
                  ? `No items with ${deliveryOptions.find((d) => d.value === deliveryFilter)?.name.toLowerCase()} found in ${categoryName}.`
                  : `No products found under the ${categoryName} category.`}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {deliveryFilter !== "All" && (
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter("All")}
                    className="cursor-pointer rounded-full bg-(--theme) px-5 py-2.5 text-xs font-bold text-(--theme-second) transition hover:opacity-90"
                  >
                    Clear delivery filter
                  </button>
                )}
                <Link
                  href="/"
                  className="cursor-pointer rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-(--theme) hover:text-(--theme) dark:border-white/10 dark:bg-[#16131f] dark:text-gray-200"
                >
                  Explore all categories
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayedProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
