'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, ArrowRight, CheckSquare, Square, ShieldAlert, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ContactPreviewPane } from './ContactPreviewPane';

interface ContactTableProps {
  recipients: any[];
  previews: any[];
  resumeData?: any;
  onUpdateRecipient: (idx: number, updated: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  recipients,
  previews,
  resumeData,
  onUpdateRecipient,
  onBack,
  onNext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'contacted' | 'suppressed'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const blacklistedCount = recipients.filter((r) => r.isBlacklisted).length;
  const contactedCount = recipients.filter((r) => r.previouslyContacted && !r.isBlacklisted).length;
  const readyCount = recipients.filter((r) => !r.isBlacklisted && !r.previouslyContacted).length;

  const filtered = recipients
    .map((r, originalIdx) => ({ ...r, originalIdx }))
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        r.email.toLowerCase().includes(q) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.company && r.company.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterMode === 'ready') return !r.isBlacklisted && !r.previouslyContacted;
      if (filterMode === 'contacted') return r.previouslyContacted && !r.isBlacklisted;
      if (filterMode === 'suppressed') return r.isBlacklisted;
      return true;
    });

  const selectedRecipient = filtered[selectedIndex] || filtered[0] || null;
  const selectedPreview = selectedRecipient ? previews[selectedRecipient.originalIdx] : null;

  // Keyboard navigation: J (down), K (up), Space (toggle select)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === ' ' && selectedRecipient) {
        e.preventDefault();
        onUpdateRecipient(selectedRecipient.originalIdx, {
          ...selectedRecipient,
          selected: !selectedRecipient.selected,
        });
      }
    },
    [filtered, selectedRecipient, onUpdateRecipient]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const totalSelectedCount = recipients.filter((r) => r.selected).length;

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight">3. Review Contacts & Scheduling</h2>
          <p className="text-xs text-stone-500 mt-0.5 font-mono">
            {recipients.length} recipients · {readyCount} eligible · {Math.min(45, readyCount)} scheduled today
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-[6px]">
          <button
            onClick={() => { setFilterMode('all'); setSelectedIndex(0); }}
            className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All {recipients.length}
          </button>
          <button
            onClick={() => { setFilterMode('ready'); setSelectedIndex(0); }}
            className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
              filterMode === 'ready' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ready {readyCount}
          </button>
          {contactedCount > 0 && (
            <button
              onClick={() => { setFilterMode('contacted'); setSelectedIndex(0); }}
              className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                filterMode === 'contacted' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Contacted {contactedCount}
            </button>
          )}
          {blacklistedCount > 0 && (
            <button
              onClick={() => { setFilterMode('suppressed'); setSelectedIndex(0); }}
              className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                filterMode === 'suppressed' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Suppressed {blacklistedCount}
            </button>
          )}
        </div>
      </div>

      {/* Search & Keyboard Shortcuts Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-xs w-full">
          <Input
            placeholder="Filter by name, email, or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>
        <span className="text-[11px] text-stone-400 font-mono">
          J / K navigate · Space toggle
        </span>
      </div>

      {/* Split-Pane Workstation Container */}
      <div className="grid grid-cols-12 border border-stone-200 rounded-[8px] bg-white overflow-hidden h-[460px]">
        {/* Left Column: Contact List */}
        <div className="col-span-5 border-r border-stone-200 overflow-y-auto divide-y divide-stone-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No contacts match the current filter.
            </div>
          ) : (
            filtered.map((r, idx) => {
              const isCurrent = idx === selectedIndex;
              return (
                <div
                  key={r.email + idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3 text-xs flex items-center gap-3 cursor-pointer transition-colors ${
                    isCurrent ? 'bg-stone-100/90 text-stone-900' : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(r.selected)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateRecipient(r.originalIdx, { ...r, selected: e.target.checked });
                    }}
                    className="w-3.5 h-3.5 rounded-[3px] text-stone-900 border-stone-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">
                      {r.name || r.email}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono truncate">
                      {r.company ? `${r.company} · ` : ''}{r.email}
                    </p>
                  </div>
                  <div>
                    {r.isBlacklisted ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 block" title="Blacklisted (550)" />
                    ) : r.previouslyContacted ? (
                      <span className="w-2 h-2 rounded-full bg-sky-500 block" title="Contacted previously" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block" title="Ready to send" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Context & Preview Pane */}
        <div className="col-span-7 h-full">
          <ContactPreviewPane
            recipient={selectedRecipient}
            preview={selectedPreview}
            resumeData={resumeData}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" size="md" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={totalSelectedCount === 0}
          onClick={onNext}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Proceed to Preflight ({totalSelectedCount})
        </Button>
      </div>
    </div>
  );
};
