import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { WEB_CONTENT } from '../constants/content';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1 + i * 0.05,
    },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function PMUSpotlightSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const { pmu } = WEB_CONTENT;
  // Záměrně vybraná fotka (meziřasová linka + obočí, 23. 10. 2026), ne „nejnovější z adminu“
  const imageSrc = pmu.spotlightImage;

  return (
    <section
      ref={ref}
      className="py-20 px-5 bg-[#FAFAFA]"
      aria-labelledby="pmu-spotlight-heading"
    >
      <div className="max-w-[1280px] mx-auto">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Mobile: image first; desktop: image left (50/50) */}
          <motion.div
            className="order-1 md:order-1 aspect-[4/5] overflow-hidden rounded-sm"
            variants={itemVariants}
          >
            <Link
              to="/pmu#pmu"
              className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#222] focus-visible:ring-offset-2 rounded-sm"
              aria-hidden
            >
              <img
                src={imageSrc}
                alt={WEB_CONTENT.imageAlts.pmuSpotlight}
                className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </Link>
          </motion.div>

          <motion.div
            className="order-2 md:order-2 flex flex-col justify-center text-center md:text-left"
            variants={containerVariants}
          >
            <motion.p
              className="text-xs font-sans uppercase tracking-[0.2em] text-[#4A4A4A] mb-3"
              variants={itemVariants}
            >
              {pmu.spotlightLabel}
            </motion.p>
            <motion.h2
              id="pmu-spotlight-heading"
              className="font-display font-light text-3xl md:text-4xl lg:text-5xl text-[#222] tracking-[0.05em] mb-4"
              style={{ letterSpacing: '0.05em' }}
              variants={itemVariants}
            >
              {pmu.headline}{' '}
              <span className="italic text-[#8C6A2E]">{pmu.headlineItalic}</span>
            </motion.h2>
            <motion.p
              className="font-sans text-[#4A4A4A] mb-8 max-w-lg mx-auto md:mx-0"
              style={{ lineHeight: 1.6 }}
              variants={itemVariants}
            >
              {pmu.body}
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link
                to="/pmu#pmu"
                className="inline-flex items-center gap-2 pb-1 border-b border-[#B08D55] text-stone-800 font-sans text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-300 hover:text-[#B08D55] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D55] focus-visible:ring-offset-4"
                aria-label={pmu.cta}
              >
                {pmu.cta}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
