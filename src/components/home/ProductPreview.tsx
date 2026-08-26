'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Paperclip } from 'lucide-react';
import { MOCK_CONTACTS } from './mockContacts';

export const ProductPreview: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeContact = MOCK_CONTACTS[selectedIndex];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
          Review Workstation
        </span>
        <span className="text-[11px] font-mono text-stone-400">
          6 sample contacts · 4 selected
        </span>
      </div>

      <div className="border border-stone-200 rounded-[8px] bg-white overflow-hidden shadow-2xs">
        {/* Workstation Top Bar */}
        <div className="p-3.5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">Review contacts</span>
            <span className="text-stone-400 font-mono">· 6 total</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2.5 py-0.5 bg-white border border-stone-200 rounded-[4px] text-stone-800">
              ● Ready 4
            </span>
            <span className="px-2.5 py-0.5 bg-white border border-stone-200 rounded-[4px] text-stone-600">
              ● Contacted 1
            </span>
            <span className="px-2.5 py-0.5 bg-white border border-stone-200 rounded-[4px] text-stone-600">
              ● Suppressed 1
            </span>
          </div>
        </div>

        {/* Split-Pane Workstation */}
        <div className="grid grid-cols-12 min-h-[480px]">
          {/* Left Column: Contact List */}
          <div className="col-span-5 border-r border-stone-200 overflow-y-auto divide-y divide-stone-100">
            {MOCK_CONTACTS.map((c, idx) => {
              const isCurrent = idx === selectedIndex;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3 text-xs flex items-center gap-3 cursor-pointer transition-colors ${
                    isCurrent ? 'bg-stone-100/90 text-stone-900 font-medium' : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={c.selected}
                    readOnly
                    className="w-3.5 h-3.5 rounded-[3px] text-stone-900 border-stone-300 pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{c.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
                      {c.role ? `${c.role} · ` : ''}{c.company}
                    </p>
                  </div>
                  <div>
                    {c.status === 'ready' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block" title="Ready to send" />
                    )}
                    {c.status === 'contacted' && (
                      <span className="w-2 h-2 rounded-full bg-sky-500 block" title="Contacted previously" />
                    )}
                    {c.status === 'suppressed' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 block" title="Suppressed (hard bounce)" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Context & Preview Pane */}
          <div className="col-span-7 flex flex-col bg-white overflow-y-auto text-xs">
            {/* Context Header */}
            <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between font-sans">
              <div>
                <h3 className="text-xs font-semibold text-stone-900">{activeContact.name}</h3>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  {activeContact.role} · {activeContact.company} ({activeContact.location})
                </p>
              </div>
              {activeContact.status === 'ready' && <Badge variant="ready">Ready to Send</Badge>}
              {activeContact.status === 'contacted' && <Badge variant="contacted">Previously Contacted (Aug 12)</Badge>}
              {activeContact.status === 'suppressed' && <Badge variant="suppressed">Suppressed (Hard Bounce)</Badge>}
            </div>

            {/* Email Content */}
            <div className="p-5 space-y-3.5 flex-1 font-mono">
              <div>
                <span className="text-[11px] text-stone-400 block font-mono">TO:</span>
                <p className="text-xs text-stone-900 select-all font-sans font-medium">{activeContact.email}</p>
              </div>

              <Separator />

              <div>
                <span className="text-[11px] text-stone-400 block font-mono">SUBJECT:</span>
                <p className="text-xs text-stone-900 font-medium font-sans">{activeContact.subject}</p>
              </div>

              <Separator />

              <div>
                <span className="text-[11px] text-stone-400 block font-mono mb-1.5">BODY:</span>
                <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed bg-stone-50/80 p-3.5 rounded-[6px] border border-stone-200/70 font-mono">
                  {activeContact.body}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-600 pt-1 font-sans">
                <Paperclip className="w-3.5 h-3.5 text-stone-400" />
                <span>Attachment: <span className="font-mono text-stone-900 font-medium">Yuvraj_Resume.pdf</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
