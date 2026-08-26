import React from 'react';

export const CapabilityGrid: React.FC = () => {
  return (
    <section className="grid grid-cols-3 gap-8 pt-6 border-t border-stone-200 text-xs">
      <div className="space-y-1">
        <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] font-mono">
          Direct SMTP
        </h3>
        <p className="text-stone-500 leading-normal">
          Send through your own Gmail account with TLS encryption.
        </p>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] font-mono">
          Global Suppression List
        </h3>
        <p className="text-stone-500 leading-normal">
          Automatically suppress contacts that return hard-bounce responses.
        </p>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] font-mono">
          Durable Workers
        </h3>
        <p className="text-stone-500 leading-normal">
          Campaign execution continues independently of the browser.
        </p>
      </div>
    </section>
  );
};
