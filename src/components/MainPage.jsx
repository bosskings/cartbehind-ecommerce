"use client"

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { usePathname } from "next/navigation"
import Link from 'next/link'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

import CategoryCarousel from './Categorycarousel'
import ProductCard from './ProductCard'
import DealOfTheDay from './Dealoftheday'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const heroSlides = [
  {
    id: 1,
    image: '/hero-bg.jpeg',
    title: 'Discover Something',
    highlight: 'Extraordinary',
    subtitle: 'Curated collections from the world’s best brands. Premium quality, unbeatable prices.',
    cta: 'Shop Now',
  },
  {
    id: 2,
    image: '/hero-bg.jpeg',
    title: 'Up to 50% Off',
    highlight: 'Deal of the Day',
    subtitle: 'Limited time offers on top‑rated products. Grab yours before they’re gone.',
    cta: 'View Deals',
  },
  {
    id: 3,
    image: '/hero-bg.jpeg',
    title: 'New Arrivals',
    highlight: 'Fresh Drops',
    subtitle: 'Explore the latest trends and must‑have items added to our collection.',
    cta: 'Explore',
  },
]

const getCategoryPath = (name) =>
  name === "All" ? "/" : `/category/${name.toLowerCase().replace(/\s+/g, "-")}`

const categoryFilters = [
  { id: 1, name: "All" },
  { id: 2, name: "Beauty" },
  { id: 3, name: "Fragrances" },
  { id: 4, name: "Furniture" },
]

const MainPage = ({ category = 'All' }) => {
  const pathname = usePathname()

  return (
    <>
      {/* ---- HERO CAROUSEL ---- */}
      <section className="relative w-full h-[70vh] md:h-[85vh] min-h-[450px]">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={true}
          className="w-full h-full"
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={slide.image}
                  fill
                  className="object-cover"
                  alt={slide.title}
                  priority
                />
                <div className="absolute inset-0 bg-black/60" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <h1 className="font-extrabold tracking-tight leading-[1.1] text-[clamp(2.5rem,6vw,5.5rem)]">
                      {slide.title} <br />
                      <span className="text-[var(--theme)]">{slide.highlight}</span>
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                      {slide.subtitle}
                    </p>
                    <button
                      onClick={() => console.log(`Navigate to: ${slide.cta}`)}
                      aria-label={slide.cta}
                      className="mt-8 px-8 py-3 rounded-full bg-[var(--theme)] text-gray-900 font-semibold hover:bg-[var(--theme)]/80 cursor-pointer transition-colors"
                    >
                      {slide.cta}
                    </button>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination style – matches theme */}
        <style jsx>{`
          :global(.swiper-pagination-bullet) {
            background: white;
            opacity: 0.6;
          }
          :global(.swiper-pagination-bullet-active) {
            background: var(--theme);
            opacity: 1;
          }
        `}</style>
      </section>

      {/* ---- CATEGORY FILTERS ---- */}
      <nav className="w-[95%]  mx-auto py-5 flex gap-2 overflow-x-auto scrollbar-hide justify-center">
        {/* 
          scrollbar-hide requires tailwind-scrollbar-hide plugin or custom CSS.
          Alternative: add a custom style for webkit-scrollbar to hide it.
        */}
        {categoryFilters.map((cat) => (
          <Link
            key={cat.id}
            href={getCategoryPath(cat.name)}
            className={`${pathname === getCategoryPath(cat.name)
              ? "bg-[var(--theme)] text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100"
              } font-medium rounded-full sm:px-4 px-5 py-2.5 text-xs transition-colors`}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* ---- EXPLORE CATEGORIES ---- */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
        className="relative w-full"
      >
        <div className="w-[95%]">
          <CategoryCarousel />
        </div>
      </motion.section>

      {/* ---- TRENDING NOW ---- */}
      <section className="relative md:w-[90%]   mx-auto mt-12">
        <h2 className="text-2xl mb-4 ml-5 font-extrabold tracking-tight text-gray-900">
          Trending Now
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="w-[95%] mx-auto grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div key={i} variants={fadeUp}>
              <ProductCard />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- DEAL OF THE DAY ---- */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={fadeUp}
        className="relative w-[95%] sm:w-[98%] mx-auto mt-12"
      >
        <DealOfTheDay />
      </motion.section>

      {/* ---- NEW ARRIVALS ---- */}
      <section className="relative md:w-[90%]   mx-auto mt-12">
        <h2 className="text-2xl mb-4 ml-5 font-extrabold tracking-tight text-gray-900">
          New Arrivals
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="w-[95%] mx-auto grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div key={i} variants={fadeUp}>
              <ProductCard />
            </motion.div>
          ))}
        </motion.div>
      </section>

    </>
  )
}

export default MainPage