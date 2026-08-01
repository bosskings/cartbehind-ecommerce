"use client"

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { usePathname } from "next/navigation"
import Link from 'next/link'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import { ArrowRight, Sparkles, ShieldCheck, Truck, HeartHandshake } from 'lucide-react'

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
    image: '/hero-bg1.jpg',
    title: 'Discover Something',
    highlight: 'Extraordinary',
    subtitle: 'Curated collections from the world’s best brands. Premium quality, unbeatable prices.',
    cta: 'Shop Now',
  },
  {
    id: 2,
    image: '/hero-bg2.jpg',
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
      <section className="relative h-screen w-full overflow-hidden">
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
                <Image
                  src={slide.image}
                  fill
                  className="object-cover"
                  alt={slide.title}
                  priority
                />
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
                      <span className="text-(--theme)">{slide.highlight}</span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200 md:text-xl">
                      {slide.subtitle}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        onClick={() => console.log(`Navigate to: ${slide.cta}`)}
                        aria-label={slide.cta}
                        className="flex items-center gap-2 rounded-full bg-(--theme) px-7 py-3 font-semibold text-gray-900 transition-transform duration-300 hover:scale-[1.02]"
                      >
                        {slide.cta}
                        <ArrowRight size={16} />
                      </button>

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

      <nav className="mx-auto flex w-[95%] gap-2 overflow-x-auto py-5 scrollbar-hide md:w-[88%] md:justify-center">
        {categoryFilters.map((cat) => (
          <Link
            key={cat.id}
            href={getCategoryPath(cat.name)}
            className={`${pathname === getCategoryPath(cat.name)
              ? "bg-(--theme) text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100"
              } rounded-full px-5 py-2.5 text-xs font-medium transition-colors sm:px-4`}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
        className="relative w-full"
      >
        <div className="w-[95%] md:w-[90%] mx-auto">
          <CategoryCarousel />
        </div>
      </motion.section>

      <section className="mx-auto mt-10 w-[95%] md:w-[90%]">
        <div className="grid gap-4 md:grid-cols-3">
          {premiumPillars.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-3xl border border-gray-100 bg-linear-to-br from-white to-amber-50 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--theme)/18 text-(--theme)">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto mt-12 md:w-[90%]">
        <h2 className="mb-4 ml-5 text-2xl font-extrabold tracking-tight text-gray-900">
          Trending Now
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mx-auto grid w-[95%] grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={fadeUp}>
              <ProductCard />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={fadeUp}
        className="relative mx-auto mt-12 w-[95%] sm:w-[98%]"
      >
        <DealOfTheDay />
      </motion.section>

      <section className="relative mx-auto mt-12 md:w-[90%]">
        <h2 className="mb-4 ml-5 text-2xl font-extrabold tracking-tight text-gray-900">
          New Arrivals
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mx-auto grid w-[95%] grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-5"
        >
          {Array.from({ length: 8 }).map((_, i) => (
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