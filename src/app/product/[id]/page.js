"use client"

import Image from "next/image"
import Link from "next/link"
import { use, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react"
import { useCart } from "@/components/CartContext"
import { useProducts } from "@/hooks/useProducts"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

function isRemoteImage(src) {
  return typeof src === "string" && /^https?:\/\//.test(src)
}

function ProductImage({ src, alt, className, sizes, priority = false }) {
  if (isRemoteImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
    />
  )
}

// const reviews = [
//   { name: "Eleanor Collins", comment: "Would not recommend!" },
//   { name: "Lucas Gordon", comment: "Very satisfied!" },
//   { name: "Eleanor Collins", comment: "Highly impressed!" },
// ]

function ProductDetailSkeleton() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#f7f5fb] dark:bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,14,137,0.07),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 lg:pt-32">
          {/* Back button skeleton */}
          <div className="h-5 w-28 animate-pulse rounded-md bg-gray-200 dark:bg-white/10" />

          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
            {/* Image card skeleton */}
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(40,14,137,0.06)] sm:p-6 lg:sticky lg:top-28 lg:p-8 dark:border-white/10 dark:bg-surface">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              {/* Thumbnail skeletons */}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-18 w-18 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="h-18 w-18 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="h-18 w-18 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
              </div>
            </div>

            {/* Info skeleton */}
            <div className="mt-6 space-y-6 lg:mt-0 lg:py-2">
              <div className="space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-10 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
                <div className="h-8 w-1/2 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="border-b border-gray-200/80 pb-6 dark:border-white/10">
                <div className="h-10 w-44 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="space-y-2.5">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-12 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="h-12 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="grid gap-3 rounded-[24px] border border-gray-100 bg-white p-5 sm:grid-cols-3 dark:border-white/10 dark:bg-surface">
                <div className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function ProductDetailPage({ params }) {
  const { id } = use(params)
  const { products, loading, error } = useProducts()
  const product = products.find((item) => String(item.id) === String(id))
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const router = useRouter()

  const galleryImages = useMemo(() => {
    if (!product) return []
    const list = []
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((item) => {
        const url = typeof item === "string" ? item : item?.url
        if (url && !list.includes(url)) {
          list.push(url)
        }
      })
    }
    if (product.image && !list.includes(product.image)) {
      list.unshift(product.image)
    }
    return list.length > 0 ? list : ["/thumbnail.webp"]
  }, [product])

  const activeIndex = Math.min(selectedImageIndex, Math.max(0, galleryImages.length - 1))
  const currentImage = galleryImages[activeIndex] || product?.image || "/thumbnail.webp"

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({ ...product, image: currentImage, quantity })
    router.push("/cart")
  }

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="mx-auto mt-24 max-w-3xl px-4 pb-20 text-center">
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{error}</p>
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

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="mx-auto mt-24 max-w-3xl px-4 pb-20 text-center">
          <p className="text-xl font-semibold text-gray-900 dark:text-white">Product not found.</p>
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

          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_8px_40px_rgba(40,14,137,0.06)] sm:p-6 lg:sticky lg:top-28 lg:p-8 dark:border-white/10 dark:bg-surface dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
              {/* Main Image */}
              <div className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
                <ProductImage
                  key={currentImage}
                  src={currentImage}
                  alt={product.title}
                  priority
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-black/60 dark:text-white dark:hover:bg-black/80 cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-black/60 dark:text-white dark:hover:bg-black/80 cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {activeIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {galleryImages.length > 1 && (
                <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1 pt-1">
                  {galleryImages.map((imgUrl, index) => {
                    const isSelected = index === activeIndex
                    return (
                      <button
                        key={`${imgUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-(--theme) ring-2 ring-(--theme)/30 scale-105 shadow-sm"
                            : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300 dark:border-white/15"
                        }`}
                        aria-label={`View product image ${index + 1}`}
                      >
                        <ProductImage
                          src={imgUrl}
                          alt={`${product.title} - preview ${index + 1}`}
                          className="h-full w-full object-cover"
                          sizes="72px"
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-6 lg:mt-0 lg:py-2">
              <div>
                {product.brand ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-400 dark:text-gray-500">
                    {product.brand}
                  </p>
                ) : null}
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] dark:text-white">
                  {product.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="rounded-full border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-surface dark:text-gray-200">
                  {product.stock}+ in stock
                </span>
                {product.category && (
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-surface dark:text-gray-200">
                    {product.category}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-4 border-b border-gray-200/80 pb-6 dark:border-white/10">
                <div>
                  <p className="text-3xl font-black tabular-nums text-gray-950 lg:text-4xl dark:text-white">
                    {formatNaira(product.price)}
                  </p>
                  {product.originalPrice ? (
                    <p className="mt-1 text-sm text-gray-400 line-through dark:text-gray-500">
                      {formatNaira(product.originalPrice)}
                    </p>
                  ) : null}
                </div>
                {product.discountPercent ? (
                  <span className="rounded-full bg-(--theme)/10 px-3 py-1.5 text-sm font-bold text-(--theme)">
                    -{product.discountPercent}% off
                  </span>
                ) : null}
              </div>

              <p className="max-w-xl text-sm leading-7 text-gray-600 lg:text-base lg:leading-8 dark:text-gray-300">
                {product.description}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:gap-5">
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-sm dark:border-white/10 dark:bg-surface">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-50 hover:text-(--theme) dark:text-gray-300 dark:hover:bg-white/10"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-10 text-center text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || quantity + 1, quantity + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-50 hover:text-(--theme) dark:text-gray-300 dark:hover:bg-white/10"
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

              <div className="grid gap-3 rounded-[24px] border border-gray-100 bg-white p-4 text-sm text-gray-600 sm:grid-cols-3 lg:p-5 dark:border-white/10 dark:bg-surface dark:text-gray-300">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <Truck size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Free shipping</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">On every order</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Secure payment</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fully protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--theme)/10 text-(--theme)">
                    <RotateCcw size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Easy returns</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Within 14 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6 lg:mt-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
            <section className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(40,14,137,0.06)] lg:p-7 dark:border-white/10 dark:bg-surface dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400 dark:text-gray-500">
                Details
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900 lg:text-2xl dark:text-white">
                Product details
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-gray-600 lg:text-[15px] dark:text-gray-300">
                <p>{product.description}</p>
                <p>Ships in 3–5 business days.</p>
              </div>
              {product.category ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-surface-muted dark:text-gray-300">
                    {product.category}
                  </span>
                </div>
              ) : null}
            </section>

            {/* <section className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_8px_40px_rgba(40,14,137,0.06)] lg:p-7 dark:border-white/10 dark:bg-surface dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gray-400 dark:text-gray-500">
                Reviews
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900 lg:text-2xl dark:text-white">
                Customer reviews
              </h2>
              <div className="mt-5 space-y-4">
                {reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 bg-[#f7f5fb] p-4 lg:p-5 dark:border-white/10 dark:bg-surface-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{review.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
                          Verified buyer
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </section> */}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
