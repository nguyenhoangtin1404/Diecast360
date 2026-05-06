import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface WordsPullUpProps {
  text: string;
  className?: string;
}

export function WordsPullUp({ text, className }: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-12%' });
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex flex-wrap items-end gap-[0.07em]">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden"
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 }}
            animate={
              reduceMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{
              delay: reduceMotion ? 0 : i * 0.08,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="inline-block">{word}</span>
          </motion.span>
        ))}
      </span>
    </div>
  );
}
