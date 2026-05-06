import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export interface WordsPullUpSegment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: WordsPullUpSegment[];
  className?: string;
}

export function WordsPullUpMultiStyle({ segments, className }: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();

  const words: { word: string; className: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(/\s+/).filter(Boolean).forEach((word) => {
      words.push({ word, className: seg.className ?? '' });
    });
  });

  const flatText = segments.map((s) => s.text).join(' ');

  return (
    <div ref={ref} className={className}>
      <span className="sr-only">{flatText}</span>
      <span aria-hidden className="flex flex-wrap justify-center gap-x-[0.35em] gap-y-1">
        {words.map((item, i) => (
          <motion.span
            key={`${item.word}-${i}`}
            className={`inline-block overflow-hidden ${item.className}`}
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
            <span className="inline-block">{item.word}</span>
          </motion.span>
        ))}
      </span>
    </div>
  );
}
