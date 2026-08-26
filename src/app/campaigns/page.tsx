'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/shell/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  ArrowRight,
  Send,
  Calendar,
  ShieldAlert,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function CampaignsDashboardPage() {
  const { isSignedIn, isLoaded } = useUser();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'recipients'>('campaigns');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'sent' | 'scheduled' | 'suppressed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRecipients: 0,
    totalDelivered: 0,
    totalScheduled: 0,
    totalSuppressed: 0,
    totalFailed: 0,
    rolling24h: 0,
    deliverabilityRate: '100.0',
    totalCampaigns: 0,
    recipients: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [campRes, analyticsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/analytics'),
      ]);

      const campData = await campRes.json();
      const analyticsData = await analyticsRes.json();

      if (campData.success && Array.isArray(campData.campaigns)) {
        setCampaigns(campData.campaigns);
      }
      if (analyticsData.success && analyticsData.stats) {
        setStats(analyticsData.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const allRecipients = stats.recipients || [];

  const filteredRecipients = allRecipients.filter((r: any) => {
    const matchesFilter =
      recipientFilter === 'all'
        ? true
        : recipientFilter === 'sent'
        ? r.status === 'sent'
        : recipientFilter === 'scheduled'
        ? r.status === 'pending' || r.status === 'scheduled' || r.status === 'claimed' || r.status === 'sending'
        : recipientFilter === 'suppressed'
        ? r.status === 'suppressed'
        : recipientFilter === 'failed'
        ? r.status === 'failed'
        : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.email && r.email.toLowerCase().includes(query)) ||
      (r.company && r.company.toLowerCase().includes(query)) ||
      (r.role && r.role.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Header quotaUsed={stats.rolling24h || 0} quotaMax={45} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900 tracking-tight">Outreach Dashboard & Ledger</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live delivery metrics, scheduling queue, and recipient audit history.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Start New Campaign
            </Button>
          </Link>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-4 gap-3">
          {/* Card 1: Delivered */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered Emails
              </span>
              <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-[4px]">
                {stats.deliverabilityRate}% rate
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {stats.totalDelivered || 0}
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Successfully sent via Gmail SMTP
            </div>
          </div>

          {/* Card 2: Scheduled */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium flex items-center gap-1.5 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-500" /> Scheduled Queue
              </span>
              <span className="font-mono text-[11px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-[4px]">
                45/day cadence
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {stats.totalScheduled || 0}
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Awaiting next 24h daily batches
            </div>
          </div>

          {/* Card 3: Suppressed */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium flex items-center gap-1.5 text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Suppressed (550)
              </span>
              <span className="font-mono text-[11px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-[4px]">
                Protected
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {stats.totalSuppressed || 0}
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Hard bounces auto-blocked
            </div>
          </div>

          {/* Card 4: Failed */}
          <div className="bg-white border border-stone-200 rounded-[8px] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-medium flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Failed Sends
              </span>
              <span className="font-mono text-[11px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-[4px]">
                Retryable
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {stats.totalFailed || 0}
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              Network timeouts / 4xx errors
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`text-xs font-medium px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Campaigns ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`text-xs font-medium px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                activeTab === 'recipients'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              All Contact Dispatches ({allRecipients.length})
            </button>
          </div>

          {activeTab === 'recipients' && (
            <div className="flex items-center gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-[6px]">
                {(['all', 'sent', 'scheduled', 'suppressed', 'failed'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRecipientFilter(mode)}
                    className={`text-[11px] capitalize px-2 py-0.5 rounded-[4px] font-medium transition-colors cursor-pointer ${
                      recipientFilter === mode
                        ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {mode === 'sent' ? 'Delivered' : mode}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                <Input
                  type="text"
                  placeholder="Search recipient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-7"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Campaigns Table */}
        {activeTab === 'campaigns' && (
          <div className="bg-white border border-stone-200 rounded-[8px] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-stone-400 font-mono">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs font-medium text-stone-700">No campaigns created yet</p>
                <p className="text-[11px] text-stone-400">
                  Import a spreadsheet to start your first 45/day automated outreach run.
                </p>
                <div className="pt-3">
                  <Link href="/campaigns/new">
                    <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Create Campaign
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Campaign Name</th>
                    <th className="py-2.5 px-4 font-normal">Status</th>
                    <th className="py-2.5 px-4 font-normal text-right">Delivered / Total</th>
                    <th className="py-2.5 px-4 font-normal text-right">Suppressed</th>
                    <th className="py-2.5 px-4 font-normal text-right">Failed</th>
                    <th className="py-2.5 px-4 font-normal">Created</th>
                    <th className="py-2.5 px-4 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-stone-900">
                        <Link href={`/campaigns/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {c.status === 'completed' ? (
                          <Badge variant="ready">Completed</Badge>
                        ) : c.status === 'running' ? (
                          <Badge variant="running">Running (45/day)</Badge>
                        ) : c.status === 'scheduled' ? (
                          <Badge variant="neutral">Scheduled</Badge>
                        ) : c.status === 'paused' ? (
                          <Badge variant="neutral">Paused</Badge>
                        ) : (
                          <Badge variant="neutral">{c.status}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-900 font-semibold">
                        {c.sentCount || 0} / {c.totalCount || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-700">
                        {c.suppressedCount || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700">
                        {c.failedCount || 0}
                      </td>
                      <td className="py-3 px-4 text-stone-400 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <Link href={`/campaigns/${c.id}`}>
                          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                            View Timeline
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Global Recipient Ledger */}
        {activeTab === 'recipients' && (
          <div className="bg-white border border-stone-200 rounded-[8px] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-stone-400 font-mono">Loading contact history...</div>
            ) : filteredRecipients.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400 font-mono">
                {searchQuery ? 'No contacts match your search query.' : 'No recipient records found for this status.'}
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 font-mono border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Contact / Recipient</th>
                    <th className="py-2.5 px-4 font-normal">Company & Role</th>
                    <th className="py-2.5 px-4 font-normal">Campaign</th>
                    <th className="py-2.5 px-4 font-normal">Delivery Status</th>
                    <th className="py-2.5 px-4 font-normal">Attempts</th>
                    <th className="py-2.5 px-4 font-normal">Last Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {filteredRecipients.map((r: any) => (
                    <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-sans font-medium text-stone-900">{r.name || 'Unnamed Recipient'}</div>
                        <div className="text-[11px] text-stone-500">{r.email}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-700">
                        <div>{r.company || '—'}</div>
                        <div className="text-[11px] text-stone-400">{r.role || '—'}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-600">
                        <Link href={`/campaigns/${r.campaignId}`} className="hover:underline flex items-center gap-1 text-[11px]">
                          {r.campaignName} <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {r.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        ) : r.status === 'suppressed' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px] text-[11px] font-medium" title={r.suppressionReason || '550 Hard Bounce'}>
                            <ShieldAlert className="w-3 h-3" /> Suppressed (550)
                          </span>
                        ) : r.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-[4px] text-[11px] font-medium" title={r.errorCode || 'SMTP Delivery Failure'}>
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-[4px] text-[11px] font-medium">
                            <Clock className="w-3 h-3" /> Scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 text-center">
                        {r.attemptCount || (r.status === 'sent' ? 1 : 0)}
                      </td>
                      <td className="py-3 px-4 text-stone-400 text-[11px]">
                        {r.lastAttemptAt ? new Date(r.lastAttemptAt).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
