import React from "react"
import Image from "next/image"
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
  image: "/cat.jpeg",
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

export default function ProductCard({
  product = sampleProduct,
  className = "",
}) {
  const { brand, title, rating, price, originalPrice, discountPercent, image } =
    product
  const { addToCart } = useCart()

  const handleAddToCart = () => addToCart(product)

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative w-full overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      {/* Image area */}
      <div className="relative aspect-[5/4] w-full bg-gray-100 overflow-hidden p-2">
        {discountPercent ? (
          <span className="hidden group-hover:block transition-all absolute left-4 top-4 z-10 rounded-full bg-[var(--theme)] px-3 py-1 text-xs font-bold text-[var(--theme-second)] shadow-sm">
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
      <div className="space-y-1.5 px-5 pb-5 pt-4 border-t-2 border-transparent transition-colors duration-300 group-hover:border-[var(--theme)]/30">
        <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
          {brand}
        </p>

        <h3 className="truncate text-sm font-medium text-gray-800 group-hover:text-[var(--theme)] transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-1 pt-0.5">
          <Star size={16} className="fill-[var(--theme)] text-[var(--theme)]" />
          <span className="text-sm font-medium text-gray-700">{rating}</span>
        </div>

        <div className="flex justify-between items-baseline gap-2 pt-1">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatNaira(price)}
            </span>
            {/* {originalPrice && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                {formatNaira(originalPrice)}
              </span>
            )} */}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            aria-label="Add to cart"
            onClick={handleAddToCart}
            className="rounded-full bg-[var(--theme)] px-2 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--theme)] flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}