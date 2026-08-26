'use client';

import React from 'react';
import { ArrowLeft, Check, AlertCircle, Paperclip, Send, Calendar, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';

interface PreflightScreenProps {
  campaignName: string;
  recipients: any[];
  template: { subject: string; body: string };
  sender: any;
  resumeData?: any;
  isConnected: boolean;
  userEmail?: string;
  dailyQuotaUsed: number;
  dailyQuotaMax: number;
  onOpenSettings: () => void;
  onBack: () => void;
  onStartDispatch: () => void;
  isStarting?: boolean;
}

export const PreflightScreen: React.FC<PreflightScreenProps> = ({
  campaignName,
  recipients,
  template,
  sender,
  resumeData,
  isConnected,
  userEmail,
  dailyQuotaUsed,
  dailyQuotaMax,
  onOpenSettings,
  onBack,
  onStartDispatch,
  isStarting = false,
}) => {
  const selectedRecipients = recipients.filter((r) => r.selected !== false);
  const totalCount = recipients.length;
  const eligibleCount = selectedRecipients.filter((r) => !r.isBlacklisted).length;
  const suppressedCount = recipients.filter((r) => r.isBlacklisted).length;

  const quotaRemainingToday = Math.max(0, dailyQuotaMax - dailyQuotaUsed);
  const todayBatchSize = Math.min(eligibleCount, quotaRemainingToday);
  const remainingAfterToday = Math.max(0, eligibleCount - todayBatchSize);
  const estimatedDays = Math.ceil(eligibleCount / (dailyQuotaMax || 45)) || 1;

  const isReady = isConnected && eligibleCount > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-base font-semibold text-stone-900 tracking-tight">4. Preflight & Campaign Schedule</h2>
        <p className="text-xs text-stone-500 mt-0.5">Review dispatch parameters and multi-day quota allocation before starting.</p>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-mono block">Campaign</span>
            <p className="text-sm font-semibold text-stone-900">{campaignName || 'Outreach Campaign'}</p>
          </div>
          {isReady ? (
            <Badge variant="ready">Schedule Ready</Badge>
          ) : (
            <Badge variant="failed">Action Required</Badge>
          )}
        </div>

        <Separator />

        {/* Multi-Day Schedule Breakdown */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-[6px] text-center font-mono">
          <div>
            <span className="text-[11px] text-stone-400 block">Total Stored</span>
            <span className="text-sm font-semibold text-stone-900">{totalCount}</span>
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">Today&apos;s Batch</span>
            <span className="text-sm font-semibold text-emerald-700">{todayBatchSize} emails</span>
          </div>
          <div>
            <span className="text-[11px] text-stone-400 block">Est. Duration</span>
            <span className="text-sm font-semibold text-stone-900">{estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2.5 text-xs">
          {/* Sender Connection */}
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Sender connection:</span>
            {isConnected ? (
              <span className="font-mono text-stone-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Connected ({userEmail || sender.email})
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Not connected
              </span>
            )}
          </div>

          {/* Resume Attachment */}
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Resume attachment:</span>
            {resumeData ? (
              <span className="font-mono text-stone-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                {resumeData.filename}
              </span>
            ) : (
              <span className="text-stone-400 font-mono">None attached</span>
            )}
          </div>

          {/* Eligible & Remaining */}
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Eligible recipients:</span>
            <span className="font-mono text-stone-900">{eligibleCount} of {totalCount}</span>
          </div>

          {suppressedCount > 0 && (
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600">Suppressed (Blacklist/550):</span>
              <span className="font-mono text-stone-500">{suppressedCount} excluded</span>
            </div>
          )}

          {/* Daily Pace & Interval */}
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">Pacing interval:</span>
            <span className="font-mono text-stone-900">45–90s randomized</span>
          </div>

          {/* 24-Hour Quota */}
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <span className="text-stone-600">24-hour quota status:</span>
            <span className="font-mono text-stone-900">
              {dailyQuotaUsed} / {dailyQuotaMax} used ({quotaRemainingToday} slots today)
            </span>
          </div>

          {/* Subsequent Batch */}
          {remainingAfterToday > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-stone-600">Remaining after today:</span>
              <span className="font-mono text-stone-600">
                {remainingAfterToday} queued for subsequent daily batches
              </span>
            </div>
          )}
        </div>

        {/* Warning Box */}
        {!isConnected && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-[6px] text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Gmail SMTP Connection Required</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Please configure your 16-character Google App Password in Settings before starting dispatch.
            </p>
            <Button variant="secondary" size="sm" onClick={onOpenSettings}>
              Configure in Settings
            </Button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" size="md" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back to Review
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!isReady}
          isLoading={isStarting}
          onClick={onStartDispatch}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Start Campaign Schedule
        </Button>
      </div>
    </div>
  );
};
