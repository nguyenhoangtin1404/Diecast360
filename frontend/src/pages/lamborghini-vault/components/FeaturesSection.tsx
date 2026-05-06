import type { ReactNode } from 'react';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { WordsPullUpMultiStyle } from './WordsPullUpMultiStyle';

const FEATURE_VIDEO =
  'https://assets.mixkit.co/videos/preview/mixkit-night-drive-through-a-tunnel-with-neon-lights-40668-large.mp4';

const cardWrap =
  'relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-vault-feature p-6 lg:min-h-0';

function FeatureCard({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.94 }}
      animate={reduceMotion || isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={{
        delay: reduceMotion ? 0 : 0.15 * index,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-3 text-sm text-gray-400">
      {items.map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <Check className="mt-0.5 size-4 shrink-0 text-vault-primary" aria-hidden />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeaturesSection() {
  return (
    <section id="vault-features" className="relative min-h-screen bg-black px-4 py-20 md:px-6 md:py-28">
      <div className="bg-noise pointer-events-none absolute inset-0 z-0 opacity-[0.15]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <header className="mb-14 flex flex-col items-center gap-4 text-center md:mb-20">
          <WordsPullUpMultiStyle
            className="max-w-4xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl"
            segments={[{ text: 'Engineered for extreme performance.', className: 'text-[#F5F5F5]' }]}
          />
          <WordsPullUpMultiStyle
            className="max-w-3xl text-lg sm:text-xl md:text-2xl"
            segments={[
              { text: 'Driven by innovation. Defined by power.', className: 'text-gray-500 font-medium' },
            ]}
          />
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 lg:h-[480px]">
          <FeatureCard index={0}>
            <div className={`${cardWrap} border-0 p-0`}>
              <video
                className="absolute inset-0 size-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
              >
                <source src={FEATURE_VIDEO} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <p className="relative z-[1] mt-auto py-6 text-center text-lg font-semibold text-[#F5F5F5]">
                Pure speed. Pure emotion.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard index={1}>
            <div className={cardWrap}>
              <span className="text-xs font-semibold text-gray-500">01</span>
              <h3 className="mt-2 text-xl font-bold text-[#F5F5F5]">Performance Specs.</h3>
              <Checklist
                items={[
                  'V10 / V12 engine power',
                  '0–100km/h acceleration',
                  'Advanced aerodynamics',
                  'Track-ready engineering',
                ]}
              />
              <a
                href="#vault-contact"
                className="group mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-vault-primary"
              >
                Learn more
                <ArrowRight className="size-4 -rotate-45 transition-transform group-hover:rotate-0" aria-hidden />
              </a>
            </div>
          </FeatureCard>

          <FeatureCard index={2}>
            <div className={cardWrap}>
              <span className="text-xs font-semibold text-gray-500">02</span>
              <h3 className="mt-2 text-xl font-bold text-[#F5F5F5]">Design Language.</h3>
              <Checklist
                items={[
                  'Sharp angular body lines',
                  'Signature Y-shaped lighting',
                  'Carbon fiber construction',
                  'Iconic scissor doors',
                ]}
              />
            </div>
          </FeatureCard>

          <FeatureCard index={3}>
            <div className={cardWrap}>
              <span className="text-xs font-semibold text-gray-500">03</span>
              <h3 className="mt-2 text-xl font-bold text-[#F5F5F5]">Driver Experience.</h3>
              <Checklist
                items={[
                  'Digital cockpit interface',
                  'Adaptive driving modes',
                  'Immersive sound profile',
                  'Precision handling systems',
                ]}
              />
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
