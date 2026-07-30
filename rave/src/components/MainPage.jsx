"use client"

import Image from 'next/image'
import CategoryCarousel from './Categorycarousel'
import ProductCard from './ProductCard'
import DealOfTheDay from './Dealoftheday'

const MainPage = ({ category = 'All' }) => {


  return (
    <>
      {/* <h1 className='text-2xl font-semibold'>{category}</h1> */}

      <section className='relative w-full min-h-screen flex items-center justify-center overflow-hidden'>



        {/* Hero */}
        <div className='absolute inset-0 opacity-5  contrast-125'>
          <Image
            src={'/hero-bg.jpeg'}
            fill
            className='object-cover'
            alt='Hero background'
          />

          {/* <div className="absolute inset-0 bg-white-to-b from-background via-background/70 to-background"></div>
          <div className="absolute inset-0 bg-white-to-r from-background via-transparent to-background/50"></div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white blur-[120px]"></div> */}
        </div>

        <div className='relative z-10 max-w-5xl mx-auto px-4 text-center pb-32 md:pb-40 flex flex-col gap-8 pt-20'>

          <h1 className="font-extrabold tracking-tight text-foreground leading-[1.06] text-[clamp(2.5rem,6vw,5.5rem)]  transform-none opacity-100">Discover Something <br />

            <span className="text-[var(--theme)] relative">
              Extraordinary

              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 8" preserveAspectRatio="none"><path d="M0 5 Q50 0 100 5 Q150 10 200 5" stroke="currentColor" strokeWidth="2" fill="none"></path></svg>
            </span>
          </h1>

          <p className='text-gray-500 text-lg'>Curated collections from the world&apos;s best brands. Premium quality, <br /> unbeatable prices, delivered to your door.</p>

          <div className='flex justify-center gap-10 pt-18'>

            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground'>10K+</h1>
              <p className='text-xs text-gray-500 mt-0.5 tracking-wider'>PRODUCTS</p>
            </div>

            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground'>50+</h1>
              <p className='text-xs text-gray-500 mt-0.5 tracking-wider'>BRANDS</p>
            </div>

            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground'>Free</h1>
              <p className='text-xs text-gray-500 mt-0.5 tracking-wider'>SHIPPING</p>
            </div>

            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground'>24/7</h1>
              <p className='text-xs text-gray-500 mt-0.5 tracking-wider'>SUPPORT</p>
            </div>

          </div>

        </div>




      </section>

      {/* EXPLORE CATEGORIES */}

      <section className='relative w-full'>

        <div className='w-[95%]'>

          <CategoryCarousel />

        </div>

      </section>


      {/* TRENDING CATEGORIY */}

      <section className='relative w-full p-4 mt-30'>

        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Trending Now
        </h2>
        <div className='w-[98%] mx-auto grid grid-cols-2 gap-5 md:grid-cols-5'>
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
        </div>

      </section>

      {/* DEAL SECTION */}

      <section className='relative w-full p-4 mt-30'>

        <DealOfTheDay />

      </section>

      {/* NEW ARRIVAL CATEGORIY */}

      <section className='relative w-full p-4 mt-30'>

        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          New Arrivals
        </h2>
        <div className='w-[98%] mx-auto grid grid-cols-2 gap-5 md:grid-cols-5'>
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
        </div>

      </section>

    </>
  )
}

export default MainPage


