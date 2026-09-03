"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { usePathname } from "next/navigation"
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
const getCategoryPath = (name) =>
  name === "All" ? "/" : `/category/${name.toLowerCase().replace(/\s+/g, "-")}`

// ——— Main Page Component ———
const MainPage = ({ category = 'All' }) => {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const { products, loading, error } = useProducts()
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

  const filteredProducts =
    category === 'All'
      ? products
      : products.filter(
        (product) => product.category?.toLowerCase() === category.toLowerCase(),
      )

  const categoryGroups = useMemo(
    () => groupProductsByCategory(filteredProducts),
    [filteredProducts],
  )

  const navCategories = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return [
      { id: 1, name: "All" },
      ...unique.map((name, index) => ({ id: index + 2, name })),
    ]
  }, [products])

  const dealProduct = filteredProducts[0]

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
      {/* <section className="relative h-screen w-full overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={true}
          className="h-full w-full"
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.05 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  style={{ willChange: 'transform' }}
                >
                  <Image
                    src={slide.image}
                    fill
                    className="object-cover object-top"
                    alt={slide.title}
                    priority
                  />
                </motion.div>

                <div className="absolute inset-0 bg-black/55" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,169,37,0.34),transparent_32%),linear-gradient(to_top,rgba(0,0,0,0.8),rgba(0,0,0,0.2))]" />

                <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 pt-20 md:px-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-3xl text-white"
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/90 backdrop-blur-md">
                      <Sparkles size={14} className="text-(--theme)" />
                      curated luxury
                    </span>

                    <h1 className="mt-6 font-extrabold leading-[1.05] tracking-tight text-[clamp(2.6rem,6vw,5.8rem)]">
                      {slide.title} <br />
                      <span className="text-(--theme-second)">{slide.highlight}</span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200 md:text-xl">
                      {slide.subtitle}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(var(--theme-rgb),0.4)",
                            "0 0 35px rgba(var(--theme-rgb),0.1)",
                            "0 0 20px rgba(var(--theme-rgb),0.4)",
                          ],
                        }}
                        transition={{
                          boxShadow: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                        }}
                        aria-label={slide.cta}
                        className="flex items-center gap-2 rounded-full bg-(--theme) px-7 py-3 font-semibold text-[var(--theme-second)] transition-colors duration-300 hover:bg-[#280E89] cursor-pointer"
                      >
                        {slide.cta}
                        <ArrowRight size={16} />
                      </motion.button>

                      <button className="rounded-full border border-white/35 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                        Explore drop
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

      </section> */}

      <Hero />

      <div className='w-full sm:w-[95%] md:w-[85%] mx-auto'>

        <nav className="mx-auto flex w-[95%] gap-2 overflow-x-auto py-5 scrollbar-hide md:w-[88%] md:justify-center">
          {navCategories.map((cat) => {
            const isActive = pathname === getCategoryPath(cat.name)
            return (
              <Link
                key={cat.id}
                href={getCategoryPath(cat.name)}
                className={`relative rounded-full px-5 py-2.5 text-xs font-medium transition-colors ${isActive ? "text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 rounded-full bg-(--theme)"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                {cat.name}
              </Link>
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
            <CategoryCarousel />
          </div>
        </motion.section>

        {/* <section className="mx-auto mt-10 w-full">
        <div className="grid gap-8 md:grid-cols-3">
          {premiumPillars.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="group rounded-3xl shadow-lg p-[1px]"
            >
              <div className="h-full rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <motion.div
                  initial={prefersReducedMotion ? false : { scale: 0, rotate: -15 }}
                  whileInView={
                    prefersReducedMotion ? {} : { scale: 1, rotate: 0 }
                  }
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--theme)/18 text-(--theme)"
                >
                  <Icon size={20} />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section> */}

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
          <p className="mx-auto mt-12 w-[95%] text-sm text-gray-500 dark:text-gray-400">
            Loading products...
          </p>
        ) : error ? (
          <p className="mx-auto mt-12 w-[95%] text-sm text-red-500">{error}</p>
        ) : categoryGroups.length === 0 ? (
          <p className="mx-auto mt-12 w-[95%] text-sm text-gray-500 dark:text-gray-400">
            No products available yet.
          </p>
        ) : (
          categoryGroups.map(({ category: categoryName, products: categoryProducts }) => (
            <section key={categoryName} className="relative mx-auto mt-12 w-full">
              <div className="mb-4 ml-5 flex items-end justify-between gap-4 pr-5">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {categoryName}
                </h2>
                <Link
                  href={getCategoryPath(categoryName)}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 transition-colors hover:text-(--theme) dark:text-gray-400"
                >
                  View all
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