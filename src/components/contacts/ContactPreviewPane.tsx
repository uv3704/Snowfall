'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Paperclip, ShieldAlert, History, CheckCircle2 } from 'lucide-react';

interface ContactPreviewPaneProps {
  recipient: any;
  preview: any;
  resumeData?: any;
}

export const ContactPreviewPane: React.FC<ContactPreviewPaneProps> = ({ recipient, preview, resumeData }) => {
  if (!recipient || !preview) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-stone-400 text-xs">
        Select a contact on the left to inspect live rendered email.
      </div>
    );
  }

  const isBlacklisted = recipient.isBlacklisted;
  const previouslyContacted = recipient.previouslyContacted;

  return (
    <div className="h-full flex flex-col bg-white border-l border-stone-200 text-xs">
      {/* Contact Context Header */}
      <div className="p-4 border-b border-stone-200 bg-stone-50/50 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-stone-900">{recipient.name || 'Recipient'}</h3>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
              {recipient.role ? `${recipient.role} · ` : ''}{recipient.company || 'Company'}
            </p>
          </div>
          {isBlacklisted ? (
            <Badge variant="suppressed">Suppressed (550 Dead)</Badge>
          ) : previouslyContacted ? (
            <Badge variant="contacted">Previously Contacted</Badge>
          ) : (
            <Badge variant="ready">Ready to Send</Badge>
          )}
        </div>

        {recipient.warning && (
          <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-[4px]">
            {recipient.warning}
          </p>
        )}
      </div>

      {/* Rendered Email Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 font-mono">
        <div>
          <span className="text-[11px] text-stone-400 block mb-1">To:</span>
          <p className="text-xs text-stone-900 select-all">{recipient.email}</p>
        </div>

        <Separator />

        <div>
          <span className="text-[11px] text-stone-400 block mb-1">Subject:</span>
          <p className="text-xs text-stone-900 font-medium">{preview.subject}</p>
        </div>

        <Separator />

        <div>
          <span className="text-[11px] text-stone-400 block mb-1">Rendered Message Body:</span>
          <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed bg-stone-50/70 p-3 rounded-[6px] border border-stone-200/70">
            {preview.body}
          </div>
        </div>

        {resumeData && (
          <div className="flex items-center gap-2 pt-2 text-[11px] text-stone-600">
            <Paperclip className="w-3.5 h-3.5 text-stone-400" />
            <span>Attachment: <span className="text-stone-900 font-medium">{resumeData.filename}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};
