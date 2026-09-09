"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import Link from 'next/link'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import {
  ArrowRight,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Star,
  Quote,
  Mail,
  Lock,
  RotateCcw,
  ChevronRight
} from 'lucide-react'

import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

import CategoryCarousel from './Categorycarousel'
import ProductCard from './ProductCard'
import DealOfTheDay from './Dealoftheday'
import Hero from './Hero'
import { useProducts } from '@/hooks/useProducts'
import { groupProductsByCategory } from '@/lib/products'

// ——— Motion variants ———
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

// ——— Data ———
const heroSlides = [
  {
    id: 1,
    image: '/hero.jpg',
    title: 'Discover Something',
    highlight: 'Extraordinary',
    subtitle: 'Curated collections from the world’s best brands. Premium quality, unbeatable prices.',
    cta: 'Shop Now',
  },
  {
    id: 2,
    image: '/hero-bg1.jpg',
    title: 'Up to 50% Off',
    highlight: 'Deal of the Day',
    subtitle: 'Limited time offers on top-rated products. Grab yours before they’re gone.',
    cta: 'View Deals',
  },
  {
    id: 4,
    image: '/hero-bgg.jpg',
    title: 'Exclusive Offers',
    highlight: 'Limited Time',
    subtitle: 'Special deals reserved for our most loyal customers.',
    cta: 'Claim Now',
  },
]

const premiumPillars = [
  {
    icon: ShieldCheck,
    title: 'Verified Premium Quality',
    text: 'Every drop is curated for design-led living and trusted performance.',
  },
  {
    icon: Truck,
    title: 'Seamless Delivery',
    text: 'Time-sensitive dispatch, real tracking, and effortless doorstep delivery.',
  },
  {
    icon: HeartHandshake,
    title: 'Service That Stays With You',
    text: 'Friendly support and thoughtful aftercare for every shopping moment.',
  },
]

const testimonials = [
  {
    id: 1,
    quote: "Absolutely stunning collection – every piece feels like a work of art.",
    author: "Emma L.",
    role: "Interior Designer",
    rating: 5,
  },
  {
    id: 2,
    quote: "Delivery was lightning fast and packaging felt like unwrapping a gift.",
    author: "Marcus T.",
    role: "Loyal Customer",
    rating: 5,
  },
  {
    id: 3,
    quote: "Customer service went above and beyond. Rare to find this level of care.",
    author: "Sofia R.",
    role: "Frequent Shopper",
    rating: 5,
  },
]


const PRODUCTS_PER_CATEGORY = 5
const navCategories = [
  { id: 1, name: "All", value: "All" },
  { id: 2, name: "Same day delivery", value: "1" },
  { id: 3, name: "7 day delivery", value: "7" },
]
const getCategoryPath = (name) =>
  name === "All" ? "/" : `/category/${name.toLowerCase().replace(/\s+/g, "-")}`

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#16131f]">
      <div className="aspect-[5/5] w-full bg-gray-200 dark:bg-white/10" />
      <div className="space-y-3 border-t-2 border-transparent px-5 pb-5 pt-4">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  )
}

// ——— Main Page Component ———
const MainPage = ({ category = 'All' }) => {
  const prefersReducedMotion = useReducedMotion()
  const { products, loading, error } = useProducts()

  useEffect(() => {
    if (products) {
      console.log('Products fetched in MainPage:', products)
    }
  }, [products])

  const [showBackToTop, setShowBackToTop] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [deliveryFilter, setDeliveryFilter] = useState("All")
  const [activeCategory, setActiveCategory] = useState(category)
  const navRef = useRef(null)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        !category ||
        category === "All" ||
        product.category?.toLowerCase() === category.toLowerCase()

      if (!matchesCategory) return false

      if (deliveryFilter === "All") return true
      return String(product.deliveryTime || "1") === String(deliveryFilter)
    })
  }, [products, category, deliveryFilter])

  const categoryGroups = useMemo(
    () => groupProductsByCategory(filteredProducts),
    [filteredProducts],
  )

  const exploreCategories = useMemo(
    () =>
      groupProductsByCategory(products).map(({ category: categoryName, products: categoryProducts }) => ({
        id: categoryName,
        name: categoryName,
        image: categoryProducts[0]?.image || "/thumbnail.webp",
      })),
    [products],
  )

  const dealProduct = filteredProducts[0]


  const handleCategorySelect = useCallback((name) => {
    setActiveCategory(name)
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', getCategoryPath(name))
    }
  }, [])

  const handleViewAll = useCallback((name) => {
    handleCategorySelect(name)
    navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [handleCategorySelect])

  // Back-to-top visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Testimonial auto‑rotate
  useEffect(() => {
    if (prefersReducedMotion) return
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [prefersReducedMotion])

  return (
    <>
      <Hero />

      <div className='w-full sm:w-[95%] md:w-[85%] mx-auto'>

        <nav
          ref={navRef}
          className="mx-auto flex w-[95%] gap-2 overflow-x-auto py-5 scrollbar-hide md:w-[88%] md:justify-center"
        >
          {navCategories.map((cat) => {
            const isActive = deliveryFilter === cat.value
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDeliveryFilter(cat.value)}
                className={`relative cursor-pointer rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "text-(--theme-second)"
                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#16131f] dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeDeliveryPill"
                    className="absolute inset-0 rounded-full bg-(--theme)"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                {cat.name}
              </button>
            )
          })}
        </nav>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="relative w-full"
        >
          <div className="mx-auto w-full">
            <CategoryCarousel categories={exploreCategories} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} />
          </div>
        </motion.section>

        <div className="mt-10 overflow-hidden border-y border-gray-100 py-4">
          <div className="flex animate-marquee space-x-10 whitespace-nowrap px-4">
            {[
              { icon: ShieldCheck, label: '100% Secure Checkout' },
              { icon: RotateCcw, label: '30 Days Easy Return' },
              { icon: Lock, label: 'End‑to‑End Encryption' },
              { icon: Truck, label: 'Free Shipping Over $150' },
              { icon: ShieldCheck, label: '24/7 Customer Support' },
              { icon: RotateCcw, label: 'Easy Order Tracking' },
              { icon: Lock, label: 'Verified Returns Policy' },
              { icon: Truck, label: 'Secure Payment Guarantee' },
              { icon: ShieldCheck, label: 'Premium Packaging' },
              { icon: RotateCcw, label: 'Lifetime Product Support' },
              { icon: Lock, label: 'Instant Fraud Protection' },
              { icon: Truck, label: 'Fast Local Delivery' },
            ].map(({ icon: Icon, label }, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                <Icon size={16} className="text-(--theme)" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mx-auto mt-12 grid w-[95%] grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : error ? (
          <p className="mx-auto mt-12 w-[95%] text-sm text-red-500">{error}</p>
        ) : categoryGroups.length === 0 ? (
          <div className="mx-auto mt-12 w-[95%] rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-white/10">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
              No products available
            </p>
            <p className="mt-1 text-sm text-gray-400">
              There are currently no products matching{" "}
              <span className="font-semibold text-(--theme)">
                {navCategories.find((c) => c.value === deliveryFilter)?.name || "this option"}
              </span>
              .
            </p>
            {deliveryFilter !== "All" && (
              <button
                type="button"
                onClick={() => setDeliveryFilter("All")}
                className="mt-4 inline-flex cursor-pointer rounded-full bg-(--theme) px-5 py-2 text-xs font-bold text-(--theme-second) transition hover:opacity-90"
              >
                Show all products
              </button>
            )}
          </div>
        ) : (
          categoryGroups.map(({ category: categoryName, products: categoryProducts }) => (
            <section key={categoryName} className="relative mx-auto mt-12 w-full">
              <div className="mb-4 ml-5 flex items-end justify-between gap-4 pr-5">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {categoryName}
                </h2>
                <Link
                  href={`/category/${encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-(--theme) transition-all duration-300 hover:scale-105 hover:bg-(--theme)/10 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  <span>View all</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                className="mx-auto grid w-[95%] grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5"
              >
                {categoryProducts.slice(0, PRODUCTS_PER_CATEGORY).map((product) => (
                  <motion.div
                    key={product.id}
                    variants={fadeUp}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
                    className="rounded-2xl transition-shadow duration-300"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          ))
        )}

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="relative mx-auto mt-12 w-[95%] sm:w-[98%]"
        >
          {dealProduct ? (
            <DealOfTheDay
              productName={dealProduct.title}
              price={dealProduct.price}
              image={dealProduct.image}
            />
          ) : (
            <DealOfTheDay />
          )}
        </motion.section>

        {/* ───────── Testimonials Carousel ───────── */}
        <section className="mx-auto mt-16 w-full">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-gray-900">
            What Our Community Says
          </h2>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-amber-50 p-8 shadow-inner md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonials[testimonialIndex].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <Quote size={40} className="mx-auto mb-4 text-(--theme)/30" />
                <p className="mx-auto max-w-2xl text-lg italic text-gray-700 md:text-xl">
                  “{testimonials[testimonialIndex].quote}”
                </p>
                <div className="mt-4 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < testimonials[testimonialIndex].rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="mt-3 font-semibold text-gray-900">
                  {testimonials[testimonialIndex].author}
                </p>
                <p className="text-sm text-gray-500">{testimonials[testimonialIndex].role}</p>
              </motion.div>
            </AnimatePresence>
            {/* Manual dots */}
            <div className="mt-6 flex justify-center gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestimonialIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${idx === testimonialIndex ? 'w-6 bg-(--theme)' : 'bg-gray-300'
                    }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Newsletter Sign‑Up ───────── */}
        <section className="mx-auto mt-16 w-full">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-10 text-center text-white md:px-16">
            <h2 className="text-3xl font-bold tracking-tight">Unlock 10% Off Your First Order</h2>
            <p className="mt-3 text-gray-300">Be the first to know about new drops, exclusive offers, and style inspiration.</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-gray-600 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-400 outline-none backdrop-blur-sm transition focus:border-(--theme) "
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="rounded-full bg-(--theme) px-6 py-3 font-semibold text-[var(--theme-second)] transition-colors duration-300 hover:bg-[#280E89] cursor-pointer"
              >
                Subscribe
              </motion.button>
            </form>
            <p className="mt-3 text-xs text-gray-500">Unsubscribe anytime.</p>
          </div>
        </section>
      </div>

      {/* ───────── Back to Top Button ───────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-(--theme) text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#280E89] hover:text-[var(--theme-second)] cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ——— Global marquee animation + Swiper pagination polish ——— */}
      <style jsx global>{`
        :global(.swiper-pagination-bullet) {
          background: white;
          opacity: 0.6;
        }
        :global(.swiper-pagination-bullet-active) {
          background: var(--theme);
          opacity: 1;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}

export default MainPage