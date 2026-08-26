import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export const HomeCTA: React.FC = () => {
  return (
    <section className="bg-white border border-stone-200 rounded-[8px] p-8 text-center space-y-4 shadow-2xs">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-stone-900">Start with a contact list.</h2>
        <p className="text-xs text-stone-500">
          Import a spreadsheet, review your messages, and send when you&apos;re ready.
        </p>
      </div>
      <Link href="/campaigns/new">
        <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
          Start New Campaign
        </Button>
      </Link>
    </section>
  );
};
