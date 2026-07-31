import React from "react";
import { Star } from "lucide-react";

const sampleProduct = {
  id: 1,
  brand: "ESSENCE",
  title: "Essence Mascara Lash Princess",
  rating: 2.6,
  price: 14309,
  originalPrice: 15984,
  discountPercent: 10,
  image:
    "/cat.jpeg",
};

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function ProductCard({ product = sampleProduct }) {
  const { brand, title, rating, price, originalPrice, discountPercent, image } =
    product;

  return (
    <div className="w-full max-w-[260px] overflow-hidden rounded-2xl bg-gray-50 transition-shadow duration-200 hover:shadow-md">
      {/* Image area */}
      <div className="relative flex h-56 items-center justify-center bg-gray-100 p-6">
        {discountPercent ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--theme)] px-3 py-1 text-xs font-semibold ">
            -{discountPercent}%
          </span>
        ) : null}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="space-y-1.5 px-5 pb-5 pt-4">
        <p className="text-xs font-medium tracking-wide text-gray-400">
          {brand}
        </p>

        <h3 className="truncate text-base font-semibold text-amber-800">
          {title}
        </h3>

        <div className="flex items-center gap-1 pt-0.5">
          <Star size={16} className="fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{rating}</span>
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-gray-900">
            {formatNaira(price)}
          </span>
          {originalPrice ? (
            <span className="text-sm text-gray-400 line-through">
              {formatNaira(originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}