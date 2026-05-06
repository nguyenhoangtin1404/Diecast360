import { useEffect } from 'react';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { FeaturesSection } from './components/FeaturesSection';

export function LamborghiniVaultPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Lamborghini Vault';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="lambo-vault-root min-h-screen bg-black text-[#F5F5F5] antialiased">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />

      <footer
        id="vault-contact"
        className="border-t border-white/10 bg-black px-4 py-16 md:px-6 md:py-24"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-vault-primary">Contact</p>
          <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F5] md:text-3xl">
            Enter the inner circle.
          </h2>
          <p className="max-w-lg text-sm text-gray-500 md:text-base">
            Concierge access for collectors and enthusiasts. Private viewings, specification consultations, and
            membership inquiries.
          </p>
          <a
            href="mailto:concierge@lamborghinivault.example"
            className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-[rgba(245,245,245,0.75)] transition-colors hover:border-white hover:text-white"
          >
            concierge@lamborghinivault.example
          </a>
        </div>
      </footer>
    </div>
  );
}
