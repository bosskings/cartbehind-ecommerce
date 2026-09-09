"use client"

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

export default function CategoryCarousel() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await axios.get(`${BACKEND_URL}/api/v1/users/categories`);
        console.log("[CategoryCarousel] /users/categories response:", res);
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.categories ?? data?.data ?? [];
        setCategories(list);
      } catch (err) {
        console.error("[CategoryCarousel] Error fetching categories:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <section className="w-[95%] md:w-full mx-auto py-8">
      {/* Header */}
      <motion.div
        variants={headerReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mb-6 flex items-center justify-between gap-4"
      >
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Explore Categories
        </h2>

        <div className="flex shrink-0 items-center ">
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
      </motion.div>

      {/* Carousel */}
      <motion.div
        variants={trackContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="relative mask-[linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
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
          {categories.map((category) => {
            // Backend may return plain strings or objects with a .name field
            const catName = typeof category === "string" ? category : (category?.name || "");
            const fallbackImg = FALLBACK_IMAGES[catName.toLowerCase()] ?? null;
            const catImage = (typeof category === "object" && category?.image?.url) ? category.image.url : fallbackImg;
            const catInitial = catName.trim().charAt(0).toUpperCase();

            return (
              <SwiperSlide key={catName}>
                <MotionLink
                  href={`/category/${toSlug(catName)}`}
                  variants={itemReveal}
                  whileHover={{ y: -4 }}
                  aria-label={`Browse ${catName}`}
                  className="group flex w-full flex-col items-center gap-2 rounded-2xl py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--theme) focus-visible:ring-offset-2"
                >
                  <span className="relative h-16 w-16 min-[360px]:h-[72px] min-[360px]:w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-gray-100/80 shadow-sm transition-shadow duration-300 group-hover:shadow-md group-hover:border-(--theme)/40 sm:h-28 sm:w-28 md:h-30 md:w-30">
                    {catImage ? (
                      <Image
                        src={catImage}
                        alt={catName}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#280E89]/80 to-[#6c47ff]/70 text-xl font-black text-white sm:text-2xl">
                        {catInitial}
                      </span>
                    )}
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
    </section>
  );
}