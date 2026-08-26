'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Send, Check, Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';

interface TemplateEditorProps {
  template: { subject: string; body: string };
  onUpdateTemplate: (template: { subject: string; body: string }) => void;
  presets: any[];
  sender: any;
  resumeData?: any;
  onResumeUploaded?: (data: any) => void;
  onClearResume?: () => void;
  onUpdateSender: (field: string, val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onUpdateTemplate,
  presets,
  sender,
  resumeData,
  onResumeUploaded,
  onClearResume,
  onUpdateSender,
  onBack,
  onNext,
}) => {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const insertVariable = (token: string) => {
    onUpdateTemplate({
      ...template,
      body: template.body + ` {{${token}}}`,
    });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onResumeUploaded) return;

    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');
      onResumeUploaded(data);
    } catch (err: any) {
      alert('Error uploading document: ' + err.message);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestSuccess(null);
    try {
      const res = await fetch('/api/queue/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      setTestSuccess(data.message || 'Test email sent to your inbox.');
    } catch (err: any) {
      alert('Error sending test email: ' + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900 tracking-tight">2. Compose Template & Variables</h2>
          <p className="text-xs text-stone-500 mt-0.5">Customize your subject, message body, and attached document.</p>
        </div>

        {/* Preset Selector */}
        {presets && presets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Preset:</span>
            <select
              className="text-xs bg-white border border-stone-200 rounded-[6px] px-2.5 py-1 text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-stone-900"
              onChange={(e) => {
                const found = presets.find((p) => p.id === e.target.value);
                if (found) {
                  onUpdateTemplate({ subject: found.subject, body: found.body });
                }
              }}
              defaultValue="software_engineer_roles"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {testSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[6px] text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Editor Box */}
      <div className="bg-white border border-stone-200 rounded-[8px] p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Subject Line</label>
          <Input
            value={template.subject}
            onChange={(e) => onUpdateTemplate({ ...template, subject: e.target.value })}
            placeholder="Application for Software Engineer Roles — {{sender_name}}"
          />
        </div>

        {/* Document Attachment Bar in Composer */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-[6px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-medium text-stone-800">Email Attachment:</span>
            {resumeData ? (
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-emerald-600" />
                {resumeData.filename}
              </span>
            ) : (
              <span className="text-[11px] text-stone-400 font-mono">No document attached yet</span>
            )}
          </div>

          <div>
            {resumeData ? (
              <Button variant="ghost" size="sm" onClick={onClearResume}>
                <X className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleResumeUpload}
                  disabled={isUploadingResume}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-[4px] border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 cursor-pointer shadow-2xs">
                  <Paperclip className="w-3 h-3 text-stone-500" />
                  {isUploadingResume ? 'Uploading...' : 'Attach Resume / PDF'}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Quick Token Picker */}
        <div>
          <span className="text-[11px] text-stone-400 font-medium block mb-1.5">Click to insert variable:</span>
          <div className="flex flex-wrap gap-1.5">
            {['first_name', 'company', 'role', 'sender_name', 'sender_contact'].map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertVariable(token)}
                className="text-[11px] font-mono px-2 py-0.5 bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200 rounded-[4px] transition-colors cursor-pointer"
              >
                + &#123;&#123;{token}&#125;&#125;
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Email Body</label>
          <textarea
            rows={12}
            value={template.body}
            onChange={(e) => onUpdateTemplate({ ...template, body: e.target.value })}
            className="w-full text-xs font-mono leading-relaxed bg-white text-stone-900 border border-stone-200 rounded-[6px] p-3 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 resize-y"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSendTest}
            isLoading={isSendingTest}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send Test to Myself
          </Button>

          <span className="text-[11px] text-stone-400 font-mono">
            {template.body.length} characters
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" size="md" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back to Import
        </Button>
        <Button variant="primary" size="md" onClick={onNext} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
          Continue to Review
        </Button>
      </div>
    </div>
  );
};
