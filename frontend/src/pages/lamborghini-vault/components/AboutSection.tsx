import { WordsPullUpMultiStyle } from './WordsPullUpMultiStyle';
import { AnimatedLetters } from './AnimatedLetters';

const ABOUT_BODY =
  'For decades, Lamborghini has defined the edge of automotive performance. From V12 engines to futuristic aerodynamics, each model represents a relentless pursuit of excellence and a passion for pushing boundaries beyond limits.';

export function AboutSection() {
  return (
    <section id="vault-about" className="bg-black px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-6xl rounded-2xl bg-[#0A0A0A] px-6 py-16 md:px-12 md:py-24">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-vault-primary md:text-sm">
          Performance DNA
        </p>

        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <WordsPullUpMultiStyle
              className="text-2xl font-bold leading-tight text-[#F5F5F5] sm:text-3xl md:text-4xl lg:text-5xl"
              segments={[
                { text: 'Built for adrenaline,', className: 'text-[#F5F5F5]' },
                { text: 'designed to dominate.', className: 'font-serif italic text-[#F5F5F5]' },
              ]}
            />
            <WordsPullUpMultiStyle
              className="text-lg font-bold leading-snug text-gray-300 sm:text-xl md:text-2xl"
              segments={[
                {
                  text: 'Every Lamborghini is a fusion of speed, luxury, and cutting-edge innovation.',
                  className: 'text-gray-200',
                },
              ]}
            />
          </div>

          <AnimatedLetters
            className="max-w-3xl text-left text-base leading-relaxed text-gray-400 sm:text-lg md:text-center"
            text={ABOUT_BODY}
          />
        </div>
      </div>
    </section>
  );
}
