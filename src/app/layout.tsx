import React from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Snowfall — High-Deliverability Cold Outreach Platform',
  description: 'Deliver personalized cold emails that actually reach the inbox with safe human pacing, bounce suppression, and deduplication.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className="min-h-screen bg-stone-50 text-stone-900 selection:bg-stone-900 selection:text-white font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
