import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  RotateCcw, 
  FileText, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Code2, 
  ChevronDown, 
  ChevronUp,
  Globe,
  Sparkles
} from 'lucide-react';
import { ProblemIntakeReceipt } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SubmissionSuccessProps {
  payload: ProblemIntakeReceipt | any;
  onReset: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  payload,
  onReset,
}) => {
  const { currentLanguage, languages, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showPayloadJson, setShowPayloadJson] = useState(false);

  const referenceId = payload.problemId || payload.intakeId || payload.submissionId || 'CS-REC-001';

  const handleCopyId = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe extraction of structured description
  const intakeData = payload.payload || payload;
  const rawDesc = intakeData.description || payload.description;

  let originalText = '';
  let englishText = '';
  let langCode = 'en';

  if (typeof rawDesc === 'object' && rawDesc !== null) {
    originalText = rawDesc.original || '';
    englishText = rawDesc.english || '';
    langCode = rawDesc.language || 'en';
  } else if (typeof rawDesc === 'string') {
    originalText = rawDesc;
    englishText = rawDesc;
  }

  const langObj = languages.find((l) => l.code === langCode) || currentLanguage;

  const locationAddress =
    intakeData.location?.address || payload.location?.address || 'Location specified';
  const latitude =
    intakeData.location?.latitude ?? payload.location?.latitude;
  const longitude =
    intakeData.location?.longitude ?? payload.location?.longitude;

  const evidenceCount =
    (intakeData.evidence && intakeData.evidence.length) ||
    (payload.evidence && payload.evidence.length) ||
    0;

  const aiResult = payload.aiResult;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8" id="submission-success-view">
      {/* Top Banner */}
      <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        <div className="space-y-1">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full">
            {t('successBadge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('successTitle')}
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto pt-1">
            {t('successSubtitle')}
          </p>
        </div>

        {/* Tracking ID Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 px-4 mt-2">
          <span className="text-xs font-medium text-slate-500">{t('trackingRefLabel')}</span>
          <span className="font-mono text-sm font-bold text-blue-950 tracking-wider">
            {referenceId}
          </span>
          <button
            type="button"
            id="copy-case-id-btn"
            onClick={handleCopyId}
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition-colors"
            title="Copy Reference ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Case Details Summary */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">{t('intakeOverview')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {t('statusReceived')}
            </span>
          </div>
        </div>

        {/* Original Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('originalDescriptionLabel')}
            </span>
            <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {langObj.nativeName} ({langObj.name})
            </span>
          </div>
          <p className="text-sm text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
            {originalText}
          </p>
        </div>

        {/* English Version (if different language) */}
        {englishText && englishText !== originalText && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {t('englishTranslationLabel')}
              </span>
              <span className="text-[11px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                English (Normalized)
              </span>
            </div>
            <p className="text-sm text-slate-800 bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-100 whitespace-pre-wrap leading-relaxed">
              {englishText}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {t('locationSummaryLabel')}
            </span>
            <p className="text-sm font-medium text-slate-800">
              {locationAddress}
            </p>
            {latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined && (
              <p className="text-xs font-mono text-slate-500">
                GPS: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Intake Timestamp
            </span>
            <p className="text-sm font-medium text-slate-800">
              {new Date(payload.timestamp || new Date()).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            <p className="text-xs text-slate-500">
              {t('evidenceSummaryLabel')}: {evidenceCount} {evidenceCount === 1 ? t('fileAttached') : t('filesAttached')}
            </p>
          </div>
        </div>
      </div>

      {/* AI Classification Result */}
      {aiResult && (
        <div
          className={`rounded-xl border p-5 space-y-3 ${
            aiResult.ok
              ? 'bg-indigo-50/50 border-indigo-200'
              : 'bg-amber-50/60 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${aiResult.ok ? 'text-indigo-600' : 'text-amber-600'}`} />
            <h3 className="text-sm font-bold text-slate-900">AI Classification</h3>
          </div>

          {aiResult.ok ? (
            <>
              <p className="text-xs text-slate-600">
                {aiResult.action === 'merged_existing'
                  ? `This matches an existing civic problem (#${aiResult.matchedExistingId}) and was merged in as a new report location.`
                  : 'This was classified as a new civic problem and added to the queue for student teams.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {aiResult.domain && (
                  <div>
                    <span className="block text-slate-500 font-medium">Domain</span>
                    <span className="font-semibold text-slate-900">{aiResult.domain}</span>
                  </div>
                )}
                {aiResult.severity && (
                  <div>
                    <span className="block text-slate-500 font-medium">Severity</span>
                    <span className="font-semibold text-slate-900">{aiResult.severity}</span>
                  </div>
                )}
                {aiResult.responsibleFields && aiResult.responsibleFields.length > 0 && (
                  <div className="col-span-2">
                    <span className="block text-slate-500 font-medium">Responsible field(s)</span>
                    <span className="font-semibold text-slate-900">{aiResult.responsibleFields.join(', ')}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-amber-700">
              AI classification hasn't run yet ({aiResult.error || 'service unavailable'}). Your report was still
              received and will be processed shortly.
            </p>
          )}
        </div>
      )}

      {/* Next Steps: AI Pipeline Integration */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          {t('nextStepsTitle')}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>{t('step1Title')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              {t('step1Desc')}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>{t('step2Title')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              {t('step2Desc')}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>{t('step3Title')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              {t('step3Desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Developer API Payload Inspector (AI Agent Handoff) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          id="toggle-payload-inspector"
          onClick={() => setShowPayloadJson(!showPayloadJson)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-900" />
            <span>{t('developerInspector')}</span>
          </div>
          {showPayloadJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showPayloadJson && (
          <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 mb-2 pb-1 border-b border-slate-800 flex justify-between items-center">
              <span>Structured Payload received at AI Integration Boundary:</span>
              <span className="text-[11px] text-emerald-400">Content-Type: application/json</span>
            </div>
            <pre className="text-emerald-300">
              {JSON.stringify(
                {
                  description: {
                    original: originalText,
                    language: langCode,
                    english: englishText || originalText,
                  },
                  location: {
                    latitude,
                    longitude,
                    address: locationAddress,
                  },
                  evidence: intakeData.evidence || payload.evidence || [],
                  metadata: {
                    submittedAt: payload.timestamp || new Date().toISOString(),
                    source: 'citizen',
                    intakeId: referenceId,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          id="submit-another-problem-btn"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-orange-400" />
          <span>{t('reportAnotherBtn')}</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t('printReceiptBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
