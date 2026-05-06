import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { WordsPullUp } from './WordsPullUp';

const NAV = [
  { label: 'Models', href: '#vault-features' },
  { label: 'Performance', href: '#vault-about' },
  { label: 'Garage', href: '#vault-features' },
  { label: 'Experience', href: '#vault-features' },
  { label: 'Contact', href: '#vault-contact' },
];

/** Cinematic night drive — Mixkit (free for commercial use). */
const HERO_VIDEO_SRC =
  'https://assets.mixkit.co/videos/preview/mixkit-sports-car-speeding-on-a-highway-at-night-40349-large.mp4';

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="h-screen p-4 md:p-6">
      <div className="relative h-full overflow-hidden rounded-2xl md:rounded-[2rem] bg-black">
        <video
          className="absolute inset-0 size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>

        <div className="noise-overlay absolute inset-0 z-[1] opacity-[0.7] mix-blend-overlay" />

        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        <nav
          className="absolute left-0 right-0 top-0 z-30 flex justify-center px-3 pt-3 md:px-6 md:pt-4"
          aria-label="Primary"
        >
          <div className="flex max-w-full items-center justify-center gap-1.5 overflow-x-auto rounded-b-2xl bg-black px-3 py-2 sm:gap-3 sm:px-4 md:gap-6 md:rounded-b-3xl md:px-8 md:py-2.5">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="shrink-0 text-[10px] font-medium tracking-wide text-[rgba(245,245,245,0.75)] transition-colors hover:text-white sm:text-xs md:text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-8 md:p-10 md:pb-12 lg:p-12 lg:pb-16">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex items-start gap-1 lg:col-span-8">
              <div className="min-w-0 flex-1">
                <WordsPullUp
                  text="Lamborghini"
                  className="text-[26vw] font-medium leading-[0.85] tracking-[-0.06em] text-[#F5F5F5] sm:text-[22vw] lg:text-[19vw]"
                />
              </div>
              <sup className="mt-1 shrink-0 text-[5vw] font-light leading-none text-vault-primary/50 sm:text-[4vw] lg:mt-2 lg:text-[2.25vw]">
                *
              </sup>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <motion.p
                className="max-w-md text-sm leading-relaxed text-vault-primary/80 sm:text-base"
                initial={{ opacity: reduceMotion ? 1 : 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: reduceMotion ? 0 : 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                Unleashing raw power, precision engineering, and unmistakable design. Explore the world of
                Lamborghini — where speed meets art and every machine tells a story.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: reduceMotion ? 1 : 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: reduceMotion ? 0 : 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <a
                  href="#vault-features"
                  className="group inline-flex items-center gap-0 overflow-hidden rounded-full bg-vault-primary font-medium text-black"
                >
                  <span className="px-6 py-3.5 text-sm sm:px-8 sm:text-base">Enter the vault</span>
                  <motion.span
                    className="flex size-12 items-center justify-center rounded-full bg-black sm:size-14"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  >
                    <ArrowRight className="size-5 text-vault-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                  </motion.span>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
