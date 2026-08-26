'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import { Send, Settings, Layers } from 'lucide-react';

interface HeaderProps {
  quotaUsed?: number;
  quotaMax?: number;
}

export const Header: React.FC<HeaderProps> = ({ quotaUsed = 0, quotaMax = 45 }) => {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const isNearLimit = quotaUsed >= quotaMax;

  return (
    <header className="h-12 border-b border-stone-200 bg-white sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Nav */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer select-none">
          <span className="w-5 h-5 bg-stone-900 text-white rounded-[4px] flex items-center justify-center text-xs font-semibold">
            S
          </span>
          <span className="text-sm font-semibold text-stone-900 tracking-tight group-hover:text-stone-700 transition-colors">
            Snowfall
          </span>
        </Link>

        {isSignedIn && (
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`text-xs font-medium px-2.5 py-1 rounded-[6px] transition-colors ${
                pathname === '/'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Compose
            </Link>
            <Link
              href="/campaigns"
              className={`text-xs font-medium px-2.5 py-1 rounded-[6px] transition-colors ${
                pathname.startsWith('/campaigns')
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className={`text-xs font-medium px-2.5 py-1 rounded-[6px] transition-colors ${
                pathname === '/settings'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Settings
            </Link>
          </nav>
        )}
      </div>

      {/* Right Quota & User */}
      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <span className={isNearLimit ? 'text-rose-600 font-medium' : 'text-stone-700'}>
                {quotaUsed} / {quotaMax}
              </span>
              <span className="text-stone-400">sent · 24h</span>
            </div>
            <div className="w-[1px] h-4 bg-stone-200" />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-6 h-6 rounded-[6px]',
                },
              }}
            />
          </>
        ) : (
          <SignInButton mode="modal">
            <button className="text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-[6px] hover:bg-stone-800 transition-colors cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </header>
  );
};
