"use client"

import Image from "next/image"
import Link from "next/link"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Star, ChevronLeft, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react"
import { products } from "@/data/products"
import { useCart } from "@/components/CartContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

const reviews = [
  { name: "Eleanor Collins", rating: 4, comment: "Would not recommend!" },
  { name: "Lucas Gordon", rating: 5, comment: "Very satisfied!" },
  { name: "Eleanor Collins", rating: 5, comment: "Highly impressed!" },
]

export default function ProductDetailPage({ params }) {
  const { id } = use(params)
  const product = products.find((item) => String(item.id) === String(id))
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="mx-auto mt-24 max-w-3xl px-4 pb-20 text-center">
          <p className="text-xl font-semibold text-gray-900">Product not found.</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-(--theme) px-5 py-3 text-sm font-semibold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89]"
          >
            Back to Shop
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const handleAddToCart = () => {
    addToCart({ ...product, quantity })
    router.push("/cart")
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.07),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--theme) transition-opacity hover:opacity-70"
          >
            <ChevronLeft size={18} />
            Back to shop
          </Link>

          {/* Mobile: stacked · Desktop: image left, info right */}
          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
            {/* Product image */}
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(40,14,137,0.06)] sm:p-6 lg:sticky lg:top-28 lg:p-8">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Product info */}
            <div className="mt-6 space-y-6 lg:mt-0 lg:py-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-400">
                  {product.brand}
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                  {product.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-(--theme)/10 px-3 py-2 font-semibold text-(--theme)">
                  <Star size={16} className="fill-(--theme) text-(--theme)" />
                  {product.rating}
                </div>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-2">
                  {product.stock}+ in stock
                </span>
                {product.category && (
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-2">
                    {product.category}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-4 border-b border-gray-200/80 pb-6">
                <div>
                  <p className="text-3xl font-black tabular-nums text-gray-950 lg:text-4xl">
                    {formatNaira(product.price)}
                  </p>
                  <p className="mt-1 text-sm text-gray-400 line-through">
                    {formatNaira(product.originalPrice)}
                  </p>
                </div>
                <span className="rounded-full bg-(--theme)/10 px-3 py-1.5 text-sm font-bold text-(--theme)">
                  -{product.discountPercent}% off
                </span>
              </div>

              <p className="max-w-xl text-sm leading-7 text-gray-600 lg:text-base lg:leading-8">
                {product.description}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:gap-5">
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-50 hover:text-(--theme)"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-10 text-center text-lg font-bold tabular-nums text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-50 hover:text-(--theme)"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-(--theme) px-6 py-3.5 text-sm font-bold text-(--theme-second) transition-all duration-300 hover:scale-105 hover:bg-[#280E89] lg:max-w-xs lg:flex-none lg:px-8"
                >
                  <ShoppingBag size={18} />
                  Add to Cart
                </button>
              </div>

              {/* Perks — row on desktop, stack on mobile */}
              <div className="grid gap-3 rounded-[24px] border border-gray-100 bg-white p-4 text-sm text-gray-600 sm:grid-cols-3 lg:p-5">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <Truck size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Free shipping</p>
                    <p className="text-xs text-gray-500">On every order</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Secure payment</p>
                    <p className="text-xs text-gray-500">Fully protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <RotateCcw size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Easy returns</p>
                    <p className="text-xs text-gray-500">Within 14 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details + reviews — stacked on mobile, side-by-side on desktop */}
          <div className="mt-10 space-y-6 lg:mt-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
            <section className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(40,14,137,0.06)] lg:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400">
                Details
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900 lg:text-2xl">
                Product details
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-gray-600 lg:text-[15px]">
                <p>Elegant packaging and cruelty-free formula made for everyday glamour.</p>
                <p>Ships in 3–5 business days.</p>
                <p>Works well with sensitive skin and long wear.</p>
              </div>
              {product.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(40,14,137,0.06)] lg:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400">
                Reviews
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900 lg:text-2xl">
                Customer reviews
              </h2>
              <div className="mt-5 space-y-4">
                {reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 bg-[#f7f5fb] p-4 lg:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
                          Verified buyer
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-(--theme)">
                        {review.rating} ★
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
