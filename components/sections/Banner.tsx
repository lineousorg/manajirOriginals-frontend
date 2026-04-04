import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import banner1 from "../../public/Banner images/banner1.jpeg";
import banner2 from "../../public/Banner images/banner2.jpeg";
import banner3 from "../../public/Banner images/banner3.jpeg";
import Image from "next/image";

const slides = [
  {
    id: 1,
    image: banner1,
    alt: "Fashion Editorial 1",
  },
  {
    id: 2,
    image: banner2,
    alt: "Fashion Editorial 2",
  },
  {
    id: 3,
    image: banner3,
    alt: "Fashion Editorial 3",
  },
];

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovering]);

  return (
    <section className="lg:sticky lg:top-0 lg:z-40 min-h-[90dvh] w-full bg-linear-to-b from-[#631515] via-[#521414] to-[#240a0a] overflow-hidden flex items-center pt-0 lg:pt-10">
      {/* Animated Background Grid */}
      {/* <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div> */}

      {/* Gradient Orbs */}
      {/* <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-150 h-150 bg-linear-to-br from-purple-900/20 to-transparent rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 right-0 w-200 h-200 bg-linear-to-tl from-amber-900/10 to-transparent rounded-full blur-[120px]"
      /> */}

      <div className="w-full lg:w-305 mx-auto relative z-10 ">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen py-20">
          {/* LEFT: Text Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            {/* Premium Label */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-4 mb-2"
            >
              {/* <div className="h-px w-16 bg-linear-to-r from-white/60 to-transparent" /> */}
              <span className="text-[11px] tracking-[0.3em] text-white/60 uppercase font-medium">
                New Collection 2026
              </span>
            </motion.div>

            {/* Editorial Headline */}
            <div className="space-y-2 mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tighter leading-[0.9] text-left"
              >
                MANAJIR
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-baseline gap-4"
              >
                <span className="text-6xl md:text-7xl lg:text-8xl font-bold italic text-transparent bg-clip-text bg-linear-to-r from-white via-white/90 to-white/70 tracking-tighter leading-[0.9] pr-4 pb-8">
                  Originals
                </span>
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="text-white/30 text-4xl"
                >
                  ✦
                </motion.span>
              </motion.div>
            </div>

            {/* Description with Character Animation */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg text-white/50 max-w-md leading-relaxed font-light mb-10 -mt-10 text-left"
            >
              Where artisanal craftsmanship meets contemporary vision.
              <span className="text-white/80"> Curated essentials</span> for the
              discerning individual who values permanence over trends.
            </motion.p>

            {/* Interactive CTA Group */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center gap-6 mb-16"
            >
              <Link
                href="/products"
                className="group relative px-8 py-4 bg-white text-black text-sm font-medium tracking-wider overflow-hidden rounded-none hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500"
              >
                <span className="relative z-10 flex items-center gap-3">
                  EXPLORE COLLECTION
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </span>
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-gray-200 to-white"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </Link>

              {/* <button className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300">
                <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 transition-all duration-300">
                  <Play size={14} fill="currentColor" />
                </span>
                <span className="text-sm tracking-wider uppercase">Watch Film</span>
              </button> */}
            </motion.div>

            {/* Stats with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="flex gap-8"
            >
              {[
                { value: "02", label: "Collections", sublabel: "Per Season" },
                { value: "48", label: "Artisans", sublabel: "Worldwide" },
                { value: "∞", label: "Timeless", sublabel: "Design" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="relative group cursor-default"
                >
                  <div className="text-3xl md:text-4xl font-light text-white mb-1 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase leading-tight">
                    {stat.label}
                    <br />
                    <span className="text-white/20">{stat.sublabel}</span>
                  </div>
                  <div className="absolute -inset-4 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Image Slideshow */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2 relative h-[60dvh] lg:h-[70dvh] xl:h-[80dvh]"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Main Image Container */}
            <div className="relative w-full h-full overflow-hidden rounded-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {slides.map((image, index) => (
                    <Image
                      key={index}
                      src={slides[currentSlide].image}
                      alt={slides[currentSlide].alt}
                      fill
                      className="object-cover"
                    />
                  ))}
                  {/* Cinematic Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-linear-to-l from-transparent via-transparent to-black/20" />
                </motion.div>
              </AnimatePresence>

              {/* Floating Index */}
              <div className="absolute top-6 right-6 flex items-center gap-2 text-white/80">
                <span className="text-2xl font-light">0{currentSlide + 1}</span>
                <div className="w-8 h-px bg-white/40" />
                <span className="text-sm text-white/40">0{slides.length}</span>
              </div>

              {/* Glassmorphism Controls */}
              {/* <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1 transition-all duration-500 rounded-full ${
                        index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <ArrowRight size={16} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div> */}
            </div>

            {/* Decorative Frame */}
            <div className="absolute -inset-4 border border-white/10 rounded-sm pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-white/5 rounded-sm pointer-events-none" />

            {/* Progress Ring */}
            <svg
              className="absolute -bottom-12 -right-12 w-24 h-24 -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={
                  283 - (283 * (currentSlide + 1)) / slides.length
                }
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-8 flex items-center gap-4"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-linear-to-b from-white/60 to-transparent"
        />
        <span
          className="text-[10px] tracking-[0.3em] text-white/40 uppercase vertical-text"
          style={{ writingMode: "vertical-lr" }}
        >
          Scroll
        </span>
      </motion.div>

      {/* Corner Accent */}
      <div className="absolute top-8 right-8 flex items-center gap-2">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
        <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Live
        </span>
      </div>
    </section>
  );
};

export default Banner;
