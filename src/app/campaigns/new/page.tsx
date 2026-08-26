'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Header } from '@/components/shell/Header';
import { ImportSection } from '@/components/contacts/ImportSection';
import { TemplateEditor } from '@/components/composer/TemplateEditor';
import { ContactTable } from '@/components/contacts/ContactTable';
import { PreflightScreen } from '@/components/preflight/PreflightScreen';
import { DispatchTerminal } from '@/components/dispatch/DispatchTerminal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NewCampaignPage() {
  const { isSignedIn, isLoaded } = useUser();

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Import, 2: Compose, 3: Review, 4: Preflight, 5: Dispatch

  // Core State
  const [campaignName, setCampaignName] = useState('Outreach Campaign');
  const [sheetData, setSheetData] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [previews, setPreviews] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);

  // SMTP & Quota State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [dailyQuotaUsed, setDailyQuotaUsed] = useState<number>(0);
  const [activeCampaignId, setActiveCampaignId] = useState<string | undefined>(undefined);
  const [isStartingDispatch, setIsStartingDispatch] = useState<boolean>(false);

  const [template, setTemplate] = useState({
    subject: 'Application for Software Engineer Roles — {{sender_name}}',
    body: `Dear Hiring Team,

I am a final-year B.Tech CSE (AI) student seeking opportunities in Software Engineering, Backend Development, Full-Stack Development, or AI/ML.

I have hands-on experience building production-oriented applications using Java, JavaScript, MERN, Next.js, Python, FastAPI, and AI/LLM technologies. Additionally, I have completed internships in AI/ML and backend development, and have built several end-to-end projects.

My resume is attached for your consideration. I would welcome the opportunity to connect if there is a suitable opening that matches my profile.

Portfolio: https://www.yuviii.in/
GitHub: https://github.com/uv3704
LinkedIn: https://www.linkedin.com/in/uv3704/

Thank you for your time and consideration.

Best regards,

{{sender_name}}
Application for Software Engineer Roles`,
  });

  const [sender, setSender] = useState({
    name: 'Yuvraj Singh Rathore',
    title: 'Software Engineer',
    highlight: 'Java, Next.js, Python, FastAPI, MERN, and AI/LLM technologies',
    email: '',
    contact: 'https://www.yuviii.in/',
  });

  const syncSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setIsConnected(Boolean(data.hasCredentials));
        setSmtpUser(data.userEmail || '');
        setDailyQuotaUsed(data.rolling24hUsed || 0);
        if (data.senderProfile) {
          setSender(data.senderProfile);
        }
      }
    } catch (err) {
      console.error('Error syncing settings:', err);
    }
  };

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) setPresets(data.templates);
      })
      .catch(console.error);

    syncSettings();

    // Auto-resync when returning from /settings tab
    window.addEventListener('focus', syncSettings);
    return () => window.removeEventListener('focus', syncSettings);
  }, [isSignedIn]);

  // Re-sync settings whenever moving into Step 4 (Preflight)
  useEffect(() => {
    if (currentStep === 4) {
      syncSettings();
    }
  }, [currentStep]);

  // Generate previews for Review Workstation
  const handleGeneratePreviews = async () => {
    if (!sheetData || !sheetData.recipients) return;
    try {
      const res = await fetch('/api/render-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          sender,
          recipients: sheetData.recipients,
        }),
      });
      const data = await res.json();
      if (data.success && data.previews) {
        setPreviews(data.previews);
        if (data.recipients) {
          setSheetData((prev: any) => ({ ...prev, recipients: data.recipients }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartDispatch = async () => {
    setIsStartingDispatch(true);
    try {
      const selectedRecipients = (sheetData?.recipients || []).filter((r: any) => r.selected);
      const res = await fetch('/api/queue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          template,
          sender,
          recipients: selectedRecipients,
          attachment: resumeData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate dispatch');

      setActiveCampaignId(data.campaignId);
      setCurrentStep(5); // Move to Dispatch Terminal
    } catch (err: any) {
      alert('Error starting dispatch: ' + err.message);
    } finally {
      setIsStartingDispatch(false);
    }
  };

  const steps = [
    { num: 1, title: 'Import' },
    { num: 2, title: 'Compose' },
    { num: 3, title: 'Review' },
    { num: 4, title: 'Preflight' },
    { num: 5, title: 'Dispatch' },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
        <Header quotaUsed={0} quotaMax={20} />
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 text-center text-xs text-stone-400">
          Loading workspace...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Header quotaUsed={dailyQuotaUsed} quotaMax={20} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Step Progression Bar */}
          {currentStep < 5 && (
            <div className="max-w-xl mx-auto">
              <div className="grid grid-cols-4 gap-2 p-1 bg-stone-100 rounded-[6px] border border-stone-200">
                {steps.slice(0, 4).map((s) => {
                  const isCurrent = currentStep === s.num;
                  const isCompleted = currentStep > s.num;
                  const canClick = s.num <= currentStep;

                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (canClick) {
                          if (s.num === 3) handleGeneratePreviews();
                          setCurrentStep(s.num);
                        }
                      }}
                      disabled={!canClick}
                      className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                          : isCompleted
                          ? 'text-stone-700 hover:bg-stone-200/60'
                          : 'text-stone-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="font-mono text-[10px]">{s.num}.</span>
                      <span>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Import */}
          {currentStep === 1 && (
            <ImportSection
              sheetData={sheetData}
              resumeData={resumeData}
              onSheetUploaded={(data: any) => {
                setSheetData(data);
              }}
              onClearSheet={() => setSheetData(null)}
              onResumeUploaded={setResumeData}
              onClearResume={() => setResumeData(null)}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {/* Step 2: Compose */}
          {currentStep === 2 && (
            <TemplateEditor
              template={template}
              onUpdateTemplate={setTemplate}
              presets={presets}
              sender={sender}
              resumeData={resumeData}
              onResumeUploaded={setResumeData}
              onClearResume={() => setResumeData(null)}
              onUpdateSender={(field: string, val: string) => setSender((prev) => ({ ...prev, [field]: val }))}
              onBack={() => setCurrentStep(1)}
              onNext={() => {
                handleGeneratePreviews();
                setCurrentStep(3);
              }}
            />
          )}

          {/* Step 3: Review Workstation (Split-Pane) */}
          {currentStep === 3 && (
            <ContactTable
              recipients={sheetData?.recipients || []}
              previews={previews}
              resumeData={resumeData}
              onUpdateRecipient={(idx: number, updated: any) => {
                const newRecipients = [...(sheetData?.recipients || [])];
                newRecipients[idx] = updated;
                setSheetData({ ...sheetData, recipients: newRecipients });
              }}
              onBack={() => setCurrentStep(2)}
              onNext={() => setCurrentStep(4)}
            />
          )}

          {/* Step 4: Preflight Verification */}
          {currentStep === 4 && (
            <PreflightScreen
              campaignName={campaignName}
              recipients={sheetData?.recipients || []}
              template={template}
              sender={sender}
              resumeData={resumeData}
              isConnected={isConnected}
              userEmail={smtpUser}
              dailyQuotaUsed={dailyQuotaUsed}
              dailyQuotaMax={45}
              onOpenSettings={() => {
                window.location.href = '/settings';
              }}
              onBack={() => setCurrentStep(3)}
              onStartDispatch={handleStartDispatch}
              isStarting={isStartingDispatch}
            />
          )}

          {/* Step 5: Operational Dispatch Terminal */}
          {currentStep === 5 && (
            <DispatchTerminal
              campaignId={activeCampaignId}
              campaignName={campaignName}
              onViewLedger={() => {
                window.location.href = '/campaigns';
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
