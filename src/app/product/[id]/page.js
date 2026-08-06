"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Star, ChevronLeft } from "lucide-react"
import { products } from "@/data/products"
import { useCart } from "@/components/CartContext"

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

export default function ProductDetailPage({ params }) {
  const { id } = params
  const product = products.find((item) => String(item.id) === String(id))
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  if (!product) {
    return (
      <div className="mx-auto mt-24 max-w-3xl px-4 text-center">
        <p className="text-xl font-semibold text-gray-900">Product not found.</p>
        <Link href="/" className="mt-4 inline-flex rounded-full bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-[var(--theme-second)]">
          Back to Shop
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart({ ...product, quantity })
    router.push("/cart")
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--theme)]">
          <ChevronLeft size={18} /> Back to shop
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-[32px] bg-gray-100 p-6">
            <Image
              src={product.image}
              alt={product.title}
              width={640}
              height={640}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-400">{product.brand}</p>
              <h1 className="mt-3 text-4xl font-black text-gray-950">{product.title}</h1>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="inline-flex items-center gap-1 rounded-full bg-[var(--theme)]/10 px-3 py-2 text-[var(--theme)]">
                <Star size={16} className="text-[var(--theme)]" />
                {product.rating}
              </div>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2">{product.stock}+ items in stock</span>
            </div>

            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-black text-gray-950">{formatNaira(product.price)}</p>
                <p className="text-sm text-gray-400 line-through">{formatNaira(product.originalPrice)}</p>
              </div>
              <span className="rounded-full bg-[var(--theme)]/10 px-3 py-1 text-[var(--theme)]">-{product.discountPercent}%</span>
            </div>

            <p className="max-w-xl text-sm leading-7 text-gray-600">{product.description}</p>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 transition hover:border-gray-300"
                >
                  -
                </button>
                <span className="min-w-[2rem] text-center text-lg font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-600 transition hover:border-gray-300"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--theme)] px-6 py-3 text-sm font-semibold text-[var(--theme-second)] transition hover:bg-[var(--theme)]/90 sm:w-auto"
              >
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>

            <div className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Free shipping</span>
                <span className="font-semibold text-gray-900">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Secure payment</span>
                <span className="font-semibold text-gray-900">Guaranteed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Easy returns</span>
                <span className="font-semibold text-gray-900">14 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Product details</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>Elegant packaging and cruelty-free formula made for everyday glamour.</p>
            <p>Ships in 3-5 business days.</p>
            <p>Works well with sensitive skin and long wear.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Customer reviews</h2>
          <div className="mt-4 space-y-4">
            {[
              { name: "Eleanor Collins", rating: 4, comment: "Would not recommend!" },
              { name: "Lucas Gordon", rating: 5, comment: "Very satisfied!" },
              { name: "Eleanor Collins", rating: 5, comment: "Highly impressed!" },
            ].map((review, idx) => (
              <div key={idx} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Customer review</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--theme)]">{review.rating} ★</span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
