import React, { useState, useEffect, useCallback } from "react";
import { Zap, ShoppingBag, Clock } from "lucide-react";

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function getTimeParts(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    hrs: Math.floor(totalSeconds / 3600),
    min: Math.floor((totalSeconds % 3600) / 60),
    sec: totalSeconds % 60,
  };
}

function useCountdown(endTime) {
  const [msRemaining, setMsRemaining] = useState(() => endTime - Date.now());

  useEffect(() => {
    const tick = () => setMsRemaining(Math.max(0, endTime - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return getTimeParts(msRemaining);
}

function TimeBox({ value, label }) {
  return (
    <div className="flex w-20 flex-col items-center rounded-xl bg-white py-3 shadow-sm">
      <span className="text-2xl font-extrabold tabular-nums text-gray-900">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[10px] font-medium tracking-wide text-gray-400">
        {label}
      </span>
    </div>
  );
}

export default function DealOfTheDay({
  discountPercent = 2,
  productName = "Calvin Klein CK One",
  price = 78472,
  originalPrice = 79984,
  image = "https://cdn.dummyjson.com/products/images/fragrances/Calvin%20Klein%20CK%20One/1.png",
  // Pass an actual Date/timestamp for the deal's real end time in production.
  // If omitted, falls back to "23h 47m 28s from mount" — computed ONCE via
  // lazy useState init, not as a default param (default params re-run on
  // every render, which was the bug: it kept resetting to "now + offset").
  endTime,
  onGrabDeal,
}) {
  const [fallbackEndTime] = useState(
    () => Date.now() + (23 * 3600 + 47 * 60 + 28) * 1000
  );
  const effectiveEndTime = endTime ?? fallbackEndTime;

  const { hrs, min, sec } = useCountdown(effectiveEndTime);

  const handleGrabDeal = useCallback(() => {
    if (onGrabDeal) onGrabDeal();
  }, [onGrabDeal]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-white to-gray-200 w-[90%] mx-auto p-4">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[var(--theme)]">
            <Zap size={16} className="fill-[var(--theme)]" />
            <span className="text-xs font-bold tracking-widest">
              DEAL OF THE DAY
            </span>
          </div>

          <h2 className="mb-3 text-4xl font-extrabold text-gray-900 md:text-5xl">
            Up to <span className="text-[var(--theme)]">{discountPercent}% Off</span>
          </h2>

          <p className="mb-6 text-lg text-gray-500">{productName}</p>

          <div className="mb-6 flex gap-4">
            <TimeBox value={hrs} label="HRS" />
            <TimeBox value={min} label="MIN" />
            <TimeBox value={sec} label="SEC" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4">
            <button
              onClick={handleGrabDeal}
              className="flex items-center gap-2 rounded-full bg-[var(--theme)] px-6 py-3 font-semibold text-[var(--theme-second)] transition-all duration-300 hover:scale-105 hover:bg-[#280E89] cursor-pointer"
            >
              <ShoppingBag size={18} />
              Grab the Deal
            </button>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">
                {formatNaira(price)}
              </span>
              <span className="text-base text-gray-400 line-through">
                {formatNaira(originalPrice)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={14} />
            <span>Offer ends soon. Limited stock available.</span>
          </div>
        </div>

        {/* Right: product image */}
        <div className="flex items-center justify-center">
          <img
            src={image}
            alt={productName}
            className="h-72 w-auto object-contain drop-shadow-xl md:h-96"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}