import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Swiper core styles (required)
import "swiper/css";
import "swiper/css/navigation";

// ---- Data: swap image URLs for your own assets ----
const categories = [
  { name: "Beauty", image: "/cat.jpeg" },
  { name: "Fragrances", image: "/cat.jpeg" },
  { name: "Furniture", image: "/cat.jpeg" },
  { name: "Groceries", image: "/cat.jpeg" },
  { name: "Home Decoration", image: "/cat.jpeg" },
  { name: "Kitchen Accessories", image: "/cat.jpeg" },
  { name: "Laptops", image: "/cat.jpeg" },
  { name: "Mens Shirts", image: "/cat.jpeg" },
];

export default function CategoryCarousel() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="w-full px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Explore Categories
        </h2>

        <div className="flex items-center gap-3">
          <button
            ref={prevRef}
            aria-label="Previous categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-[var(--theme)] cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            ref={nextRef}
            aria-label="Next categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-[var(--theme)] cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <Swiper
        modules={[Navigation]}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        spaceBetween={20}
        slidesPerView={2.5}
        breakpoints={{
          480: { slidesPerView: 3.5 },
          640: { slidesPerView: 4.5 },
          768: { slidesPerView: 5.5 },
          1024: { slidesPerView: 6.5 },
          1280: { slidesPerView: 8 },
        }}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.name}>
            <button className="group flex w-full flex-col items-center gap-3 focus:outline-none">
              <span className="h-24 w-24 overflow-hidden rounded-full border border-gray-100 shadow-sm transition group-hover:shadow-md sm:h-28 sm:w-28">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </span>
              <span className="text-center text-sm font-medium text-gray-600 group-hover:text-gray-900">
                {category.name}
              </span>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}