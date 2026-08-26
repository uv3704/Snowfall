'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, AlertCircle, RefreshCw, Layers, Calendar, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';

interface DispatchTerminalProps {
  campaignId?: string;
  campaignName: string;
  onViewLedger: () => void;
}

export const DispatchTerminal: React.FC<DispatchTerminalProps> = ({
  campaignId,
  campaignName,
  onViewLedger,
}) => {
  const [status, setStatus] = useState<'running' | 'paused' | 'completed' | 'scheduled' | 'idle'>('running');
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    suppressed: 0,
    pending: 0,
    active: 0,
    rolling24hUsed: 0,
    dailyQuotaMax: 45,
    quotaRemaining: 45,
    todayDispatched: 0,
    todayTarget: 45,
  });
  const [recipients, setRecipients] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number>(45);

  // Authoritative Postgres status polling
  const fetchStatus = async () => {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/queue/status?campaignId=${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus(data.status || 'idle');
          if (data.stats) setStats(data.stats);
          if (data.recipients) setRecipients(data.recipients);
        }
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3-second authoritative revalidation
    return () => clearInterval(interval);
  }, [campaignId]);

  // Local display countdown between polls
  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handlePause = async () => {
    try {
      await fetch('/api/queue/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      setStatus('paused');
      await fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      await fetch('/api/queue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, isExistingCampaign: true }),
      });
      setStatus('running');
      await fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  // Activity stream logs
  const activityLogs = recipients.filter((r) => r.status === 'sent' || r.status === 'failed' || r.status === 'suppressed' || r.status === 'sending');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight">5. Dispatch Terminal & Schedule</h2>
          <p className="text-xs text-stone-500 mt-0.5 font-mono">
            Campaign: {campaignName || 'Outreach Campaign'} · Durable Background Execution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status === 'running' && (
            <Button variant="secondary" size="sm" onClick={handlePause} leftIcon={<Pause className="w-3.5 h-3.5" />}>
              Pause Dispatch
            </Button>
          )}
          {(status === 'paused' || status === 'scheduled') && (
            <Button variant="primary" size="sm" onClick={handleResume} leftIcon={<Play className="w-3.5 h-3.5" />}>
              Resume Dispatch
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onViewLedger} leftIcon={<Layers className="w-3.5 h-3.5" />}>
            Campaigns Ledger
          </Button>
        </div>
      </div>

      {/* Main Terminal Box */}
      <div className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-stone-400 font-mono block">EXECUTION STATUS</span>
            <div className="flex items-center gap-2.5">
              {status === 'running' && <Badge variant="running">Executing Batch</Badge>}
              {status === 'scheduled' && <Badge variant="neutral">Scheduled (Waiting for 24h Quota)</Badge>}
              {status === 'paused' && <Badge variant="neutral">Manually Paused</Badge>}
              {status === 'completed' && <Badge variant="ready">Campaign Completed</Badge>}
              {status === 'idle' && <Badge variant="neutral">Idle</Badge>}

              {status === 'running' && (
                <span className="text-xs text-stone-500 font-mono">
                  Pacing cooldown: {countdown}s
                </span>
              )}
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-stone-400 text-[11px] block">24-HOUR QUOTA</span>
            <span className="text-stone-900 font-semibold">{stats.rolling24hUsed} / {stats.dailyQuotaMax} used</span>
            <span className="text-stone-400 text-[10px] block">({stats.quotaRemaining} available today)</span>
          </div>
        </div>

        <Separator />

        {/* Dual Progress Metrics: Today vs Overall */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Batch */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-[6px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-500 font-medium">TODAY&apos;S DISPATCH</span>
              <span className="text-emerald-700 font-semibold">{stats.todayDispatched} / {stats.todayTarget}</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.todayTarget > 0 ? (stats.todayDispatched / stats.todayTarget) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500">
              {Math.max(0, stats.todayTarget - stats.todayDispatched)} recipients remaining in today&apos;s daily quota.
            </p>
          </div>

          {/* Overall Campaign */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-[6px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-500 font-medium">OVERALL CAMPAIGN</span>
              <span className="text-stone-900 font-semibold">{stats.sent + stats.suppressed} / {stats.total}</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-stone-800 h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.total > 0 ? ((stats.sent + stats.suppressed) / stats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500">
              {stats.pending} remaining across subsequent daily batches.
            </p>
          </div>
        </div>

        {/* Aggregate Counters */}
        <div className="grid grid-cols-4 gap-3 text-center font-mono py-2 bg-stone-50 border border-stone-200 rounded-[6px] text-xs">
          <div>
            <span className="text-[10px] text-stone-400 block">TOTAL STORED</span>
            <span className="text-sm font-semibold text-stone-900">{stats.total}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block">SUCCESSFULLY SENT</span>
            <span className="text-sm font-semibold text-emerald-700">{stats.sent}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block">SUPPRESSED (550)</span>
            <span className="text-sm font-semibold text-stone-700">{stats.suppressed}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-600 block">FAILED</span>
            <span className="text-sm font-semibold text-rose-700">{stats.failed}</span>
          </div>
        </div>

        {/* Real-time Recipient Activity Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-stone-900 tracking-wider uppercase">
              Recipient Dispatch Log
            </h3>
            <span className="text-[11px] text-stone-400 font-mono">
              Auto-updating via PostgreSQL authoritative state
            </span>
          </div>

          <div className="border border-stone-200 rounded-[6px] divide-y divide-stone-100 max-h-72 overflow-y-auto text-xs font-mono">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-[11px]">
                Waiting for worker dispatch stream...
              </div>
            ) : (
              activityLogs.map((log: any) => {
                let badge = <Badge variant="neutral">Pending</Badge>;
                if (log.status === 'sent') badge = <Badge variant="ready">Sent</Badge>;
                if (log.status === 'sending') badge = <Badge variant="running">Sending...</Badge>;
                if (log.status === 'suppressed') badge = <Badge variant="neutral">Suppressed</Badge>;
                if (log.status === 'failed') badge = <Badge variant="failed">Failed</Badge>;

                return (
                  <div key={log.id} className="p-3 flex items-center justify-between hover:bg-stone-50">
                    <div className="flex items-center gap-3">
                      {badge}
                      <div>
                        <span className="text-stone-900 font-medium block">{log.email}</span>
                        <span className="text-[10px] text-stone-500">
                          {log.name || 'Recipient'} {log.company ? `· ${log.company}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-stone-400">
                      {log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : (log.lastAttemptAt ? new Date(log.lastAttemptAt).toLocaleTimeString() : 'In Progress')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
