'use client';

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, X, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';

interface ImportSectionProps {
  sheetData: any;
  resumeData: any;
  onSheetUploaded: (data: any) => void;
  onClearSheet: () => void;
  onResumeUploaded: (data: any) => void;
  onClearResume: () => void;
  onNext: () => void;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  sheetData,
  resumeData,
  onSheetUploaded,
  onClearSheet,
  onResumeUploaded,
  onClearResume,
  onNext,
}) => {
  const [isUploadingSheet, setIsUploadingSheet] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSheet(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-sheet', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse spreadsheet');
      onSheetUploaded(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploadingSheet(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const recipients = sheetData?.recipients || [];
  const validCount = recipients.length;
  const duplicateCount = sheetData?.duplicateCount || 0;
  const invalidCount = sheetData?.invalidCount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-stone-900 tracking-tight">1. Import Contacts & Resume</h2>
        <p className="text-xs text-stone-500 mt-0.5">Upload your candidate spreadsheet (.xlsx, .csv) and optional PDF resume attachment.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-[6px] text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Spreadsheet Upload Box */}
      {!sheetData ? (
        <label className="block border border-dashed border-stone-300 rounded-[8px] p-8 text-center bg-white hover:bg-stone-50/50 hover:border-stone-400 transition-colors cursor-pointer group">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleSheetUpload}
            disabled={isUploadingSheet}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-stone-100 flex items-center justify-center text-stone-600 group-hover:text-stone-900 transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-900">
                {isUploadingSheet ? 'Parsing spreadsheet...' : 'Choose spreadsheet or drag and drop'}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Accepts .xlsx, .xls, and .csv files</p>
            </div>
          </div>
        </label>
      ) : (
        <div className="bg-white border border-stone-200 rounded-[8px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-900">Spreadsheet parsed successfully</p>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5 font-mono">
                  <span>{validCount} valid</span>
                  {duplicateCount > 0 && <span>· {duplicateCount} duplicates</span>}
                  {invalidCount > 0 && <span>· {invalidCount} invalid</span>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSheet}>
              Replace
            </Button>
          </div>

          {sheetData.detectedMapping && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-[11px] font-medium text-stone-700 mb-2">Detected Column Mappings</p>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {sheetData.detectedMapping.email && (
                  <span className="px-2 py-1 bg-stone-100 rounded-[4px] text-stone-800 text-[11px]">
                    Email: <span className="text-stone-900 font-semibold">{sheetData.detectedMapping.email}</span>
                  </span>
                )}
                {sheetData.detectedMapping.name && (
                  <span className="px-2 py-1 bg-stone-100 rounded-[4px] text-stone-800 text-[11px]">
                    Name: <span className="text-stone-900 font-semibold">{sheetData.detectedMapping.name}</span>
                  </span>
                )}
                {sheetData.detectedMapping.company && (
                  <span className="px-2 py-1 bg-stone-100 rounded-[4px] text-stone-800 text-[11px]">
                    Company: <span className="text-stone-900 font-semibold">{sheetData.detectedMapping.company}</span>
                  </span>
                )}
                {sheetData.detectedMapping.role && (
                  <span className="px-2 py-1 bg-stone-100 rounded-[4px] text-stone-800 text-[11px]">
                    Role: <span className="text-stone-900 font-semibold">{sheetData.detectedMapping.role}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Upload Box */}
      <div className="bg-white border border-stone-200 rounded-[8px] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-stone-900">Attach Resume (Optional)</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Streamed directly into Nodemailer from cloud storage.</p>
          </div>
          {resumeData ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-800 bg-stone-100 px-2 py-1 rounded-[4px]">
                {resumeData.filename}
              </span>
              <Button variant="ghost" size="sm" onClick={onClearResume}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleResumeUpload}
                disabled={isUploadingResume}
                className="hidden"
              />
              <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-[6px] border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 cursor-pointer">
                {isUploadingResume ? 'Uploading...' : 'Attach PDF'}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4">
        <Button
          variant="primary"
          size="md"
          disabled={!sheetData || validCount === 0}
          onClick={onNext}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Continue to Compose
        </Button>
      </div>
    </div>
  );
};
