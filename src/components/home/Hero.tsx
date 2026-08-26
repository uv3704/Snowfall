import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="text-center max-w-2xl mx-auto space-y-6 pt-4">
      <div className="space-y-3">
        <span className="text-[11px] font-mono text-stone-400 uppercase tracking-widest">
          Outreach Workspace
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight leading-tight">
          Send personalized outreach from your own inbox.
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
          Import your contacts, review every message, and dispatch campaigns from your own SMTP account with suppression and pacing built in.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link href="/campaigns/new">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Start New Campaign
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="secondary" size="lg">
            Configure Settings
          </Button>
        </Link>
      </div>
    </section>
  );
};
