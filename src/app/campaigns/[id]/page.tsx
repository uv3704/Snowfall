'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shell/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ArrowLeft, Download, RefreshCw, Trash2, Check, AlertCircle, Play, Pause } from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'scheduled' | 'failed' | 'suppressed'>('all');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load campaign');
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [campaignId]);

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/retry-failed`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to retry contacts');
      setRetryMessage(`Reset ${json.count} non-blacklisted failed contact(s) to pending.`);
      await fetchDetails();
    } catch (err: any) {
      alert('Error retrying failed contacts: ' + err.message);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/campaigns');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const campaign = data?.campaign;
  const recipients = data?.recipients || [];

  const sentCount = recipients.filter((r: any) => r.status === 'sent').length;
  const failedCount = recipients.filter((r: any) => r.status === 'failed').length;
  const suppressedCount = recipients.filter((r: any) => r.status === 'suppressed').length;
  const scheduledCount = recipients.filter((r: any) => r.status === 'pending' || r.status === 'scheduled' || r.status === 'claimed' || r.status === 'sending').length;

  const filteredRecipients = recipients.filter((r: any) => {
    if (filter === 'sent') return r.status === 'sent';
    if (filter === 'failed') return r.status === 'failed';
    if (filter === 'suppressed') return r.status === 'suppressed';
    if (filter === 'scheduled') return r.status === 'pending' || r.status === 'scheduled' || r.status === 'claimed' || r.status === 'sending';
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-6">
        {/* Top Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/campaigns">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Campaigns Ledger
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <a href={`/api/campaigns/${campaignId}/export`} download>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
            </a>
            {failedCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={isRetrying}
                onClick={handleRetryFailed}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Failed ({failedCount})
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={handleDeleteCampaign} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Delete
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-[6px] text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {retryMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[6px] text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white border border-stone-200 rounded-[8px] p-12 text-center text-xs text-stone-400 font-mono">
            Loading campaign details...
          </div>
        ) : campaign ? (
          <div className="space-y-6">
            {/* Campaign Summary Card */}
            <div className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-stone-900 tracking-tight">{campaign.name}</h1>
                  <p className="text-xs text-stone-500 mt-0.5 font-mono">
                    Subject: {campaign.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  {campaign.status === 'running' && <Badge variant="running">Running</Badge>}
                  {campaign.status === 'scheduled' && <Badge variant="neutral">Scheduled (Next Day)</Badge>}
                  {campaign.status === 'paused' && <Badge variant="neutral">Paused</Badge>}
                  {campaign.status === 'completed' && <Badge variant="ready">Completed</Badge>}
                  {campaign.status === 'draft' && <Badge variant="neutral">Draft</Badge>}
                </div>
              </div>

              <Separator />

              {/* Progress Counters */}
              <div className="grid grid-cols-5 gap-3 text-center font-mono py-2 bg-stone-50 border border-stone-200 rounded-[6px] text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block">TOTAL STORED</span>
                  <span className="text-sm font-semibold text-stone-900">{recipients.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block">SENT</span>
                  <span className="text-sm font-semibold text-emerald-700">{sentCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">QUEUED / SCHEDULED</span>
                  <span className="text-sm font-semibold text-stone-900">{scheduledCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">SUPPRESSED (550)</span>
                  <span className="text-sm font-semibold text-stone-700">{suppressedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 block">FAILED</span>
                  <span className="text-sm font-semibold text-rose-700">{failedCount}</span>
                </div>
              </div>
            </div>

            {/* Recipient Ledger Table */}
            <div className="bg-white border border-stone-200 rounded-[8px] overflow-hidden space-y-0">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-[6px]">
                  <button
                    onClick={() => setFilter('all')}
                    className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                      filter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({recipients.length})
                  </button>
                  <button
                    onClick={() => setFilter('sent')}
                    className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                      filter === 'sent' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Sent ({sentCount})
                  </button>
                  <button
                    onClick={() => setFilter('scheduled')}
                    className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                      filter === 'scheduled' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Scheduled ({scheduledCount})
                  </button>
                  {suppressedCount > 0 && (
                    <button
                      onClick={() => setFilter('suppressed')}
                      className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        filter === 'suppressed' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Suppressed ({suppressedCount})
                    </button>
                  )}
                  {failedCount > 0 && (
                    <button
                      onClick={() => setFilter('failed')}
                      className={`text-xs px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        filter === 'failed' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Failed ({failedCount})
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-stone-400 font-mono">
                  Showing {filteredRecipients.length} recipients
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Dispatch Time / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400 text-xs font-mono">
                          No recipients matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRecipients.map((r: any) => {
                        let statusBadge = <Badge variant="neutral">Pending</Badge>;
                        if (r.status === 'sent') statusBadge = <Badge variant="ready">Sent</Badge>;
                        if (r.status === 'sending') statusBadge = <Badge variant="running">Sending</Badge>;
                        if (r.status === 'claimed') statusBadge = <Badge variant="running">Claimed</Badge>;
                        if (r.status === 'scheduled') statusBadge = <Badge variant="neutral">Scheduled</Badge>;
                        if (r.status === 'suppressed') statusBadge = <Badge variant="neutral">Suppressed</Badge>;
                        if (r.status === 'failed') statusBadge = <Badge variant="failed">Failed</Badge>;

                        return (
                          <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-medium text-stone-900 block">{r.name || 'Recipient'}</span>
                              <span className="text-[11px] text-stone-500 font-mono">{r.email}</span>
                            </td>
                            <td className="py-3 px-4 text-stone-600">
                              {r.company || '—'}
                              {r.role ? ` · ${r.role}` : ''}
                            </td>
                            <td className="py-3 px-4">{statusBadge}</td>
                            <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                              {r.sentAt ? (
                                <span>{new Date(r.sentAt).toLocaleString()}</span>
                              ) : r.suppressionReason ? (
                                <span className="text-stone-600">{r.suppressionReason}</span>
                              ) : r.errorMessage ? (
                                <span className="text-rose-600">{r.errorMessage}</span>
                              ) : (
                                <span className="text-stone-400">Queued for daily dispatch</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
