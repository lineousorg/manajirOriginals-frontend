"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 }, 
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function BrandStorySection() {
  return (
    <section className="relative bg-[#0e0e0e] text-white py-24 md:py-32 overflow-hidden z-999">
      {/* subtle background glow */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />

      <div className="container-fashion relative">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-14 items-center"
        >
          {/* LEFT TEXT */}
          <div>
            <motion.p
              variants={item}
              className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4"
            >
              Why we exist
            </motion.p>

            <motion.h2
              variants={item}
              className="text-3xl md:text-5xl font-serif leading-tight mb-6"
            >
              Clothing should feel like it belongs to your life — not your
              closet.
            </motion.h2>

            <motion.p
              variants={item}
              className="text-white/70 leading-relaxed mb-6"
            >
              We build timeless essentials designed for everyday wear,
              focusing on material integrity, clean silhouettes, and
              responsible production. Every piece is crafted to outlast
              trends — not chase them.
            </motion.p>

            <motion.p
              variants={item}
              className="text-white/60 leading-relaxed mb-10"
            >
              Our production partners follow small-batch manufacturing
              practices, prioritizing reduced waste, ethical labor, and
              long-term fabric durability.
            </motion.p>

            {/* stats */}
            <motion.div
              variants={container}
              className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6"
            >
              <motion.div variants={item}>
                <p className="text-2xl font-semibold">2019</p>
                <p className="text-xs text-white/60 mt-1">Founded</p>
              </motion.div>

              <motion.div variants={item}>
                <p className="text-2xl font-semibold">100%</p>
                <p className="text-xs text-white/60 mt-1">Ethical sourcing</p>
              </motion.div>

              <motion.div variants={item}>
                <p className="text-2xl font-semibold">48h</p>
                <p className="text-xs text-white/60 mt-1">Design cycle</p>
              </motion.div>
            </motion.div>

            {/* CTA */}
            <motion.a
              variants={item}
              href="/about"
              className="inline-flex items-center gap-2 mt-10 text-sm uppercase tracking-wider text-white hover:text-white/70 transition"
            >
              Our full story
              <ArrowUpRight size={16} />
            </motion.a>
          </div>

          {/* RIGHT IMAGE STACK */}
          <motion.div
            variants={container}
            className="relative h-[420px] md:h-[520px]"
          >
            <motion.div
              variants={item}
              className="absolute top-0 left-0 w-[70%] h-[75%] rounded-xl overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1521335629791-ce4aec67dd47"
                alt="Craftsmanship"
                fill
                className="object-cover"
              />
            </motion.div>

            <motion.div
              variants={item}
              className="absolute bottom-0 right-0 w-[70%] h-[75%] rounded-xl overflow-hidden shadow-2xl border border-white/10"
            >
              <Image
                src="https://images.unsplash.com/photo-1520975916090-3105956dac38"
                alt="Fabric detail"
                fill
                className="object-cover"
              />
            </motion.div>

            {/* floating label */}
            <div className="absolute -bottom-6 left-6 bg-white text-black px-4 py-2 text-xs tracking-wider uppercase">
              Crafted with intention
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}