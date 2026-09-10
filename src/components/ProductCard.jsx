import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/components/CartContext"

const sampleProduct = {
  id: 1,
  brand: "ESSENCE",
  title: "Essence Mascara Lash Princess",
  price: 14309,
  originalPrice: 15984,
  discountPercent: 10,
  image: "/thumbnail.webp",
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`
}

function isRemoteImage(src) {
  return typeof src === "string" && /^https?:\/\//.test(src)
}

function ProductImage({ src, alt, className }) {
  if (isRemoteImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      loading="lazy"
    />
  )
}

export default function ProductCard({
  product = sampleProduct,
  className = "",
}) {
  const { brand, title, price, originalPrice, discountPercent, image, id } =
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

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            type="button"
            aria-label="Add to cart"
            className="absolute right-2.5 bottom-2.5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-(--theme) text-(--theme-second) shadow-md ring-2 ring-white/90 transition-all duration-200 hover:bg-[#280E89] active:shadow-sm md:inset-x-0 md:mx-auto md:bottom-2 md:h-11 md:w-[90%] md:rounded-xl md:px-5 md:ring-0 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 cursor-pointer"
            onClick={handleAddToCart}
          >
            <ShoppingBag size={17} />
            <span className="hidden md:inline font-bold text-xs tracking-wide">Add to cart</span>
          </motion.button>

          {discountPercent ? (
            <span className="hidden group-hover:block transition-all absolute left-4 top-4 z-10 rounded-full bg-(--theme) px-3 py-1 text-xs font-bold text-(--theme-second) shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}

          <div className="relative h-full w-full">
            <ProductImage
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-xl"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 px-5 pb-5 pt-4 border-t-2 border-transparent transition-colors duration-300 ">
          <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
            {brand}
          </p>

          <h3 className="truncate text-sm font-medium text-gray-800 group-hover:text-(--theme) transition-colors dark:text-gray-100">
            {title}
          </h3>

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
