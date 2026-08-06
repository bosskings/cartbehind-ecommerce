import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/CartContext"

const sampleProduct = {
  id: 1,
  brand: "ESSENCE",
  title: "Essence Mascara Lash Princess",
  rating: 2.6,
  price: 14309,
  originalPrice: 15984,
  discountPercent: 10,
  image: "/thumbnail.webp",
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

export default function ProductCard({
  product = sampleProduct,
  className = "",
}) {
  const { brand, title, rating, price, originalPrice, discountPercent, image, id } =
    product
  const { addToCart } = useCart()

  const handleAddToCart = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    addToCart(product)
  }

  return (
    <Link href={`/product/${id}`} className={`group block ${className}`}>
      <motion.div
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 cursor-pointer hover:shadow-lg"
      >

        {/* Image area */}
        <div className="relative aspect-[5/5] w-full bg-gray-100 overflow-hidden p-4">

          <button
            type="button"
            aria-label="Add to cart"
            className="absolute right-3 bottom-3 z-20 flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--theme)] px-3 text-[var(--theme-second)] shadow-lg transition-all duration-300 md:inset-x-0 md:mx-auto md:bottom-2 md:w-[90%] md:rounded-xl md:px-5 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            onClick={handleAddToCart}
          >
            <ShoppingBag size={16} />
            <span className="hidden md:inline">Add to cart</span>
          </button>

          {discountPercent ? (
            <span className="hidden group-hover:block transition-all absolute left-4 top-4 z-10 rounded-full bg-(--theme) px-3 py-1 text-xs font-bold text-(--theme-second) shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}

          <div className="relative h-full w-full">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110 rounded-xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 px-5 pb-5 pt-4 border-t-2 border-transparent transition-colors duration-300 ">
          <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
            {brand}
          </p>

          <h3 className="truncate text-sm font-medium text-gray-800 group-hover:text-(--theme) transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-1 pt-0.5">
            <Star size={16} stroke="none" className="fill-orange-400" />
            <span className="text-sm font-medium text-gray-700">{rating}</span>
          </div>

          <div className="flex justify-between items-baseline gap-2 pt-1">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {formatNaira(price)}
              </span>
              {originalPrice && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {formatNaira(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
