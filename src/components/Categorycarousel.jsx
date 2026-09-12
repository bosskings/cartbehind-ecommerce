"use client"

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
// Swiper core styles (required)
import "swiper/css";
import "swiper/css/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const MotionLink = motion(Link);

// Convert "Home Decorations" → "home-decorations"
const toSlug = (name) => name.trim().toLowerCase().replace(/\s+/g, "-");

// Fallback images keyed by category name (case-insensitive)
const FALLBACK_IMAGES = {
  "electronics": "/ct-1.jpg",
  "motorcycles": "/ct-2.jpg",
  "beauty": "/ct-3.jpg",
  "smartphones": "/ct-4.jpg",
  "sports": "/ct-5.jpg",
  "sunglasses": "/ct-6.jpg",
  "tablets": "/ct-7.jpg",
  "home decorations": "/ct-8.jpg",
  "groceries": "/ct-9.jpg",
  "furniture": "/ct-10.jpg",
  "fragrances": "/ct-11.jpg",
  "kitchen accessories": "/ct-12.jpg",
  "laptops": "/ct-13.jpg",
  "mens shirts": "/ct-14.jpg",
  "sneakers": "/ct-15.jpg",
  "watches": "/ct-16.jpg",
  "clothings": "/ct-1.jpg",
};

function getCategoryImageUrl(category, catName) {
  if (category && typeof category === "object") {
    // 1. Direct string URL on category.image
    if (typeof category.image === "string" && category.image.trim()) {
      return category.image.trim();
    }
    // 2. Object with url or secure_url
    if (category.image && typeof category.image === "object") {
      if (typeof category.image.url === "string" && category.image.url.trim()) {
        return category.image.url.trim();
      }
      if (typeof category.image.secure_url === "string" && category.image.secure_url.trim()) {
        return category.image.secure_url.trim();
      }
    }
    // 3. Direct url, secure_url, or imageUrl on category object
    if (typeof category.url === "string" && category.url.trim()) {
      return category.url.trim();
    }
    if (typeof category.secure_url === "string" && category.secure_url.trim()) {
      return category.secure_url.trim();
    }
    if (typeof category.imageUrl === "string" && category.imageUrl.trim()) {
      return category.imageUrl.trim();
    }
  }

  // 4. Fallback images map
  if (catName && typeof catName === "string") {
    const fallback = FALLBACK_IMAGES[catName.trim().toLowerCase()];
    if (fallback) return fallback;
  }

  return null;
}

function CategoryItemImage({ src, alt, initial }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#280E89]/80 to-[#6c47ff]/70 text-xl font-black text-white sm:text-2xl">
        {initial}
      </span>
    );
  }

  const isRemote = typeof src === "string" && /^https?:\/\//.test(src);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="112px"
      unoptimized={isRemote}
      onError={() => setHasError(true)}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
    />
  );
}

const headerReveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const trackContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemReveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function CategoryCarousel({ categories: propCategories = [] }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [backendCategories, setBackendCategories] = useState([]);
  const [loading, setLoading] = useState(!propCategories || propCategories.length === 0);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        if (!backendCategories.length && (!propCategories || !propCategories.length)) {
          setLoading(true);
        }
        setFetchError(null);
        const res = await axios.get(`${BACKEND_URL}/api/v1/users/categories`);
        if (!isMounted) return;
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.categories ?? data?.data ?? [];
        if (list.length > 0) {
          setBackendCategories(list);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[CategoryCarousel] Error fetching categories:", err);
          setFetchError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge backend categories (which have admin-uploaded images) with propCategories
  const categories = useMemo(() => {
    if (backendCategories.length > 0) {
      const propMap = new Map();
      if (Array.isArray(propCategories)) {
        propCategories.forEach((cat) => {
          const name = typeof cat === "string" ? cat : cat?.name;
          if (name) propMap.set(name.trim().toLowerCase(), cat);
        });
      }

      const merged = backendCategories.map((cat) => {
        const catName = typeof cat === "string" ? cat : (cat?.name || "");
        const propMatch = propMap.get(catName.trim().toLowerCase());
        const existingImg = getCategoryImageUrl(cat, catName);

        // If backend category has no explicit image, fall back to product image if available
        if ((!existingImg || existingImg === "/thumbnail.webp") && propMatch) {
          const propImg = getCategoryImageUrl(propMatch, catName);
          if (propImg && propImg !== "/thumbnail.webp") {
            return {
              ...cat,
              name: catName,
              image: propImg,
            };
          }
        }
        return cat;
      });

      // Include any prop categories not in backend categories
      if (Array.isArray(propCategories)) {
        const backendNames = new Set(
          backendCategories.map((c) => (typeof c === "string" ? c : c?.name || "").trim().toLowerCase())
        );
        propCategories.forEach((pCat) => {
          const pName = (typeof pCat === "string" ? pCat : pCat?.name || "").trim().toLowerCase();
          if (pName && !backendNames.has(pName)) {
            merged.push(pCat);
          }
        });
      }

      return merged;
    }

    if (Array.isArray(propCategories) && propCategories.length > 0) {
      return propCategories;
    }

    return [];
  }, [backendCategories, propCategories]);

  return (
    <section className="w-[95%] md:w-full mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Explore Categories
        </h2>

        <div className="flex shrink-0 items-center gap-1.5">
          <motion.button
            ref={prevRef}
            type="button"
            aria-label="Previous categories"
            disabled={atStart}
            whileHover={!atStart ? { scale: 1.08 } : {}}
            whileTap={!atStart ? { scale: 0.94 } : {}}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-200 hover:border-(--theme) hover:bg-(--theme)/10 hover:text-(--theme) disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:cursor-not-allowed cursor-pointer dark:border-white/15 dark:text-gray-400 dark:disabled:hover:border-white/15"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            ref={nextRef}
            type="button"
            aria-label="Next categories"
            disabled={atEnd}
            whileHover={!atEnd ? { scale: 1.08 } : {}}
            whileTap={!atEnd ? { scale: 0.94 } : {}}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-200 hover:border-(--theme) hover:bg-(--theme)/10 hover:text-(--theme) disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:cursor-not-allowed cursor-pointer dark:border-white/15 dark:text-gray-400 dark:disabled:hover:border-white/15"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && categories.length === 0 ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="h-16 w-16 min-[360px]:h-[72px] min-[360px]:w-[72px] sm:h-28 sm:w-28 rounded-full bg-gray-200 dark:bg-white/10" />
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        /* Carousel */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
        >
          <Swiper
            modules={[FreeMode, Navigation]}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            navigation
            onSlideChange={(swiper) => {
              setAtStart(swiper.isBeginning);
              setAtEnd(swiper.isEnd);
            }}
            onReachBeginning={() => setAtStart(true)}
            onReachEnd={() => setAtEnd(true)}
            onFromEdge={() => {
              setAtStart(false);
              setAtEnd(false);
            }}
            spaceBetween={8}
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 0.65,
              momentumVelocityRatio: 0.65,
            }}
            resistanceRatio={0.6}
            grabCursor
            slidesPerView={4}
            breakpoints={{
              360: { slidesPerView: 4, spaceBetween: 8 },
              480: { slidesPerView: 4, spaceBetween: 12 },
              640: { slidesPerView: 4.5, spaceBetween: 12 },
              768: { slidesPerView: 6, spaceBetween: 5 },
              1024: { slidesPerView: 7.5, spaceBetween: 12 },
              1280: { slidesPerView: 9.3, spaceBetween: 14 },
              1500: { slidesPerView: 10.2, spaceBetween: 5 },
              1750: { slidesPerView: 10.5, spaceBetween: 5 },
            }}
            className="py-2!"
          >
            {categories.map((category, index) => {
              const catName = typeof category === "string" ? category : (category?.name || "");
              const catImage = getCategoryImageUrl(category, catName);
              const catInitial = catName.trim().charAt(0).toUpperCase();
              const slideKey = (typeof category === "object" && (category?._id || category?.id))
                ? String(category._id || category.id)
                : `${catName}-${index}`;

              return (
                <SwiperSlide key={slideKey}>
                  <MotionLink
                    href={`/category/${toSlug(catName)}`}
                    whileHover={{ y: -4 }}
                    aria-label={`Browse ${catName}`}
                    className="group flex w-full flex-col items-center gap-2 rounded-2xl py-1 opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--theme) focus-visible:ring-offset-2"
                  >
                    <span className="relative h-16 w-16 min-[360px]:h-[72px] min-[360px]:w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-gray-100/80 shadow-sm transition-shadow duration-300 group-hover:shadow-md group-hover:border-(--theme)/40 sm:h-28 sm:w-28 md:h-30 md:w-30">
                      <CategoryItemImage
                        src={catImage}
                        alt={catName}
                        initial={catInitial}
                      />
                      {/* Glowing ring on hover */}
                      <span className="absolute inset-0 rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:ring-(--theme)/30" />
                    </span>
                    <span className="flex h-10 items-center text-center text-sm font-medium leading-tight text-gray-600 transition-colors group-hover:text-(--theme) line-clamp-2 dark:text-gray-300">
                      {catName}
                    </span>
                  </MotionLink>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </motion.div>
      )}
    </section>
  );
}