import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/shell/Header';
import { Hero } from '@/components/home/Hero';
import { ProductPreview } from '@/components/home/ProductPreview';
import { CapabilityGrid } from '@/components/home/CapabilityGrid';
import { HomeCTA } from '@/components/home/HomeCTA';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Header />

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 py-10 space-y-10">
        <Hero />
        <ProductPreview />
        <CapabilityGrid />
        <HomeCTA />
      </main>

      <footer className="border-t border-stone-200 py-6 px-6 text-xs text-stone-400 font-mono">
        <div className="max-w-[1140px] mx-auto flex items-center justify-between">
          <span>Snowfall · 2026</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/uv3704"
              target="_blank"
              rel="noreferrer"
              className="hover:text-stone-700 transition-colors"
            >
              GitHub
            </a>
            <Link href="/settings" className="hover:text-stone-700 transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
