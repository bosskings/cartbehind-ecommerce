import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const slides = [
  {
    id: 1,
    eyebrow: "New season 2026",
    title: "Elevate your",
    highlight: "lifestyle",
    subtitle:
      "The intersection of high-performance design and essential luxury. Curated for those who demand excellence in every detail.",
    cta: "Shop collection",
    image: "/hero.jpg",
    alt: "Model wearing curated streetwear against a violet backdrop",
  },
  {
    id: 2,
    eyebrow: "Editor's picks",
    title: "Objects built to",
    highlight: "outlast trends",
    subtitle:
      "Beauty, fragrance, furniture and tech — selected by our editors and stress-tested before it ever reaches your cart.",
    cta: "Explore Now",
    image: "/hero-1.jpg",
    alt: "Premium curated products arranged on a violet surface",
  },
  {
    id: 3,
    eyebrow: "Limited drop",
    title: "Today only, up to",
    highlight: "40% off",
    subtitle:
      "A rotating daily drop of our most-wanted pieces, priced for a single sunrise. When it's gone, it's gone.",
    cta: "See the deal",
    image: "/deal.jpg",
    alt: "Featured deal of the day product on a dark violet set",
  },
];



const DURATION = 6000;

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % slides.length), DURATION);
    return () => clearInterval(id);
  }, []);

  const slide = slides[index];

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-primary">
      {/* Backdrop stack */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={s.image}
            alt={s.alt}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_45%)]" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-36 text-center lg:px-10">
        <span
          key={`e-${slide.id}`}
          className="rise relative z-20 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md"
        >
          <Sparkles size={13} className="text-[var(--theme-second)]" />
          {slide.eyebrow}
        </span>

        <h1
          key={`h-${slide.id}`}
          className="rise mt-8 max-w-5xl font-display text-5xl font-bold uppercase leading-[0.88] tracking-tight text-white md:text-7xl lg:text-8xl"
        >
          {slide.title} <span className="text-[var(--accent)]">{slide.highlight}</span>
        </h1>

        <p
          key={`p-${slide.id}`}
          className="rise mt-8 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg"
        >
          {slide.subtitle}
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <a
            href="#trending"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--theme)] px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_0_36px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
          >
            {slide.cta}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#editorial"
            className="inline-flex items-center justify-center rounded-full bg-[var(--theme-second)] px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--theme)] transition-colors hover:bg-white"
          >
            View lookbook
          </a>
        </div>
      </div>

      {/* Slide progress */}
      <div className="absolute bottom-8 right-6 z-20 flex items-center gap-5 lg:right-12">
        {/* <span className="font-display text-sm font-bold text-accent">
          {String(index + 1).padStart(2, "0")}
        </span> */}
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-[2px] w-10 transition-colors ${
                i === index ? "bg-[var(--theme-second)]" : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        {/* <span className="font-display text-sm font-bold text-primary-foreground/40">
          {String(slides.length).padStart(2, "0")}
        </span> */}
      </div>
    </section>
  );
}
