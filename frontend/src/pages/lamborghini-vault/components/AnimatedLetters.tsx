import { useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface AnimatedLettersProps {
  text: string;
  className?: string;
}

function LetterSpan({
  char,
  index,
  total,
  scrollYProgress,
}: {
  char: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const safeTotal = Math.max(total, 1);
  const start = (index / safeTotal) * 0.62;
  const end = Math.min(start + 0.28, 1);

  const opacity = useTransform(scrollYProgress, [0, start, end, 1], [0.2, 0.2, 1, 1]);

  return (
    <motion.span style={{ opacity }} className="inline-block">
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

export function AnimatedLetters({ text, className }: AnimatedLettersProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.88', 'end 0.32'],
  });

  const chars = text.split('');

  if (reduceMotion) {
    return (
      <p ref={containerRef} className={className}>
        {text}
      </p>
    );
  }

  return (
    <p ref={containerRef} className={className}>
      {chars.map((char, i) => (
        <LetterSpan
          key={`${i}-${char}`}
          char={char}
          index={i}
          total={chars.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </p>
  );
}
