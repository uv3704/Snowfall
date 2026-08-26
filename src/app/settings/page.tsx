'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/shell/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { KeyRound, ExternalLink, Check, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { isSignedIn, isLoaded } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTestingSaved, setIsTestingSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings State
  const [isConnected, setIsConnected] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [fromName, setFromName] = useState('');
  const [dailyQuotaUsed, setDailyQuotaUsed] = useState(0);

  const [senderProfile, setSenderProfile] = useState({
    name: 'Yuvraj Singh Rathore',
    title: 'Software Engineer',
    highlight: 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
    contact: 'https://www.yuviii.in/',
    email: '',
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setIsConnected(Boolean(data.hasCredentials));
        setSmtpUser(data.userEmail || '');
        setFromName(data.fromName || '');
        setDailyQuotaUsed(data.rolling24hUsed || 0);
        if (data.senderProfile) {
          setSenderProfile(data.senderProfile);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSettings();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const handleVerifySmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpUser || !appPassword) {
      setErrorMsg('Gmail address and 16-character App Password are required');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: smtpUser.trim(),
          pass: appPassword.trim().replace(/\s+/g, ''),
          fromName: fromName || senderProfile.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SMTP verification failed');

      setSuccessMsg('Gmail SMTP successfully verified and saved with AES-256-GCM encryption.');
      setAppPassword('');
      setIsConnected(true);
      setSmtpUser(data.userEmail || smtpUser.trim());
      await fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectSmtp = async () => {
    if (!confirm('Disconnect your Gmail SMTP connection?')) return;
    try {
      const res = await fetch('/api/smtp/disconnect', { method: 'POST' });
      if (res.ok) {
        setIsConnected(false);
        setSmtpUser('');
        setAppPassword('');
        setSuccessMsg('Disconnected Gmail SMTP from your account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/settings/sender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderProfile }),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      setSuccessMsg('Sender identity preferences updated.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSignedIn && isLoaded) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
        <Header quotaUsed={0} quotaMax={45} />
        <main className="flex-1 max-w-xl mx-auto px-6 py-16 text-center">
          <h1 className="text-lg font-semibold text-stone-900 mb-2">Settings</h1>
          <p className="text-xs text-stone-500 mb-6">Please sign in to configure your Gmail SMTP connection and sender identity.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Header quotaUsed={dailyQuotaUsed} quotaMax={45} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-stone-900 tracking-tight">Settings & Credentials</h1>
          <p className="text-xs text-stone-500 mt-1">Configure your personal Gmail SMTP credentials and default sender identity.</p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[6px] text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-[6px] text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Gmail SMTP Connection */}
        <section className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-stone-600" />
                Gmail SMTP Connection
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Send directly through your Gmail account using an App Password.</p>
            </div>
            {isConnected ? (
              <Badge variant="ready">Connected ({smtpUser})</Badge>
            ) : (
              <Badge variant="neutral">Not connected</Badge>
            )}
          </div>

          <Separator />

          {isConnected ? (
            <div className="space-y-4">
              <div className="text-xs space-y-1.5 text-stone-600">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-medium">Encrypted with AES-256-GCM</span>
                </div>
                <p>Emails will be dispatched from <span className="font-mono text-stone-900">{smtpUser}</span> with sender name <span className="font-medium text-stone-900">{fromName || senderProfile.name}</span>.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchSettings}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Refresh Status
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDisconnectSmtp}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifySmtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Gmail Address</label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Display From Name</label>
                  <Input
                    type="text"
                    placeholder="Yuvraj Singh Rathore"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-700">16-Character Google App Password</label>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1"
                  >
                    Generate in Google Account <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="abcd efgh ijkl mnop"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isVerifying}
              >
                Verify TLS Connection & Save
              </Button>
            </form>
          )}
        </section>

        {/* Section 2: Default Sender Profile */}
        <section className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Default Sender Identity</h2>
            <p className="text-xs text-stone-500 mt-0.5">Used to resolve template variables like {'{{sender_name}}'} and portfolio links.</p>
          </div>

          <Separator />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
                <Input
                  value={senderProfile.name}
                  onChange={(e) => setSenderProfile({ ...senderProfile, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Title / Headline</label>
                <Input
                  value={senderProfile.title}
                  onChange={(e) => setSenderProfile({ ...senderProfile, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Portfolio or Website URL</label>
              <Input
                value={senderProfile.contact}
                onChange={(e) => setSenderProfile({ ...senderProfile, contact: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Highlight Skills (for template token)</label>
              <Input
                value={senderProfile.highlight}
                onChange={(e) => setSenderProfile({ ...senderProfile, highlight: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
            >
              Save Identity Preferences
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
