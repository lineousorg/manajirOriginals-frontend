
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import banner1 from "../../public/Banner images/banner1.jpeg";
import banner2 from "../../public/Banner images/banner2.jpeg";
import banner3 from "../../public/Banner images/banner3.jpeg";

const slides = [
  {
    id: 1,
    badge: "NEW COLLECTION",
    title: "MANAJIR",
    subtitle: "Originals",
    description:
      "Where artisanal craftsmanship meets contemporary vision. Curated essentials for those who value permanence over trends.",
    image: banner1,
  },
  {
    id: 2,
    badge: "LIMITED EDITION",
    title: "Modern",
    subtitle: "Elegance",
    description:
      "Refined silhouettes crafted for everyday luxury and effortless expression.",
    image: banner2,
  },
  {
    id: 3,
    badge: "SIGNATURE DROP",
    title: "Curated",
    subtitle: "Essentials",
    description:
      "Designed to transcend seasons and become part of your story.",
    image: banner3,
  },
];

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovering]);

  const active = slides[currentSlide];

  return (
    <section
      className="relative h-[100dvh] overflow-hidden bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0"
        >
          <Image
            src={active.image}
            alt={active.title}
            fill
            priority
            className="object-cover"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/20"
          />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-black/5"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + "-content"}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.12,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="max-w-2xl"
            >
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0 },
                }}
                className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white backdrop-blur-xl"
              >
                {active.badge}
              </motion.span>

              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 60 },
                  show: { opacity: 1, y: 0 },
                }}
                className="mt-8 text-6xl font-light leading-[0.9] tracking-tight text-white md:text-8xl"
              >
                {active.title}
              </motion.h1>

              <motion.h2
                variants={{
                  hidden: { opacity: 0, y: 60 },
                  show: { opacity: 1, y: 0 },
                }}
                className="text-6xl font-semibold italic leading-[0.9] tracking-tight text-white/90 md:text-8xl"
              >
                {active.subtitle}
              </motion.h2>

              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                className="mt-8 max-w-xl text-lg leading-8 text-white/75"
              >
                {active.description}
              </motion.p>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm uppercase tracking-[0.18em] text-white backdrop-blur-xl transition-all duration-500 hover:bg-white hover:text-black"
                >
                  Explore Collection
                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              currentSlide === index
                ? "w-16 bg-white"
                : "w-8 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-10 right-8 z-20 text-white/70">
        <span className="text-3xl font-light">
          0{currentSlide + 1}
        </span>
        <span className="mx-2 text-white/30">/</span>
        <span className="text-white/30">
          0{slides.length}
        </span>
      </div>
    </section>
  );
}
