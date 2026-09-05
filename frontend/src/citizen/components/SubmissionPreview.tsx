import React from 'react';
import { 
  CheckCircle, 
  Edit3, 
  Send, 
  MapPin, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { AiPipelineResult, EvidenceItem, ProblemLocation } from '../types';
import { AiReviewPanel } from './AiReviewPanel';
import { useLanguage } from '../context/LanguageContext';

interface SubmissionPreviewProps {
  originalDescription: string;
  englishTranslation: string;
  sourceLanguageCode: string;
  location: ProblemLocation;
  evidence: EvidenceItem[];
  isSubmitting: boolean;
  translationStatus?: {
    success: boolean;
    service?: string;
    notes?: string;
    error?: string;
  };
  aiResult: AiPipelineResult;
  onAiResultChange: (next: AiPipelineResult) => void;
  onEdit: () => void;
  onConfirmSubmit: () => void;
}

export const SubmissionPreview: React.FC<SubmissionPreviewProps> = ({
  originalDescription,
  englishTranslation,
  sourceLanguageCode,
  location,
  evidence,
  isSubmitting,
  translationStatus,
  aiResult,
  onAiResultChange,
  onEdit,
  onConfirmSubmit,
}) => {
  const { currentLanguage, languages, t } = useLanguage();

  const selectedLangObj = languages.find((l) => l.code === sourceLanguageCode) || currentLanguage;
  const isEnglishOnly = sourceLanguageCode.toLowerCase() === 'en';

  return (
    <div className="space-y-6" id="submission-preview-screen">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-orange-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 2: {t('previewTitle')}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              {t('previewTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
              {t('previewSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-xs">
            <Globe className="w-4 h-4 text-orange-300" />
            <div>
              <span className="text-blue-200 block text-[10px] uppercase font-semibold">
                {t('selectedLangLabel')}
              </span>
              <span className="font-bold text-white">
                {selectedLangObj.nativeName} ({selectedLangObj.name})
              </span>
            </div>
          </div>
        </div>
      </div>

      <AiReviewPanel aiResult={aiResult} onChange={onAiResultChange} />

      {/* Primary Comparison Card: Original Citizen Voice vs English AI Translation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Original Description */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <h4 className="text-sm font-bold text-slate-900">
                  {t('originalDescriptionLabel')}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedLangObj.nativeName}
              </span>
            </div>

            <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {originalDescription}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Character count: {originalDescription.length}</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Preserved verbatim for civic records
            </span>
          </div>
        </div>

        {/* English Translation */}
        <div className="p-4 sm:p-5 bg-white border border-indigo-200/80 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="text-sm font-bold text-indigo-950">
                  {t('englishTranslationLabel')}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                English (Normalized)
              </span>
            </div>

            <div className="mt-3.5 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {englishTranslation || originalDescription}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-slate-500">
            {isEnglishOnly ? (
              <span className="text-slate-500 font-medium">Original was composed directly in English.</span>
            ) : translationStatus?.success ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                {t('translationSuccess')}
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {translationStatus?.error || t('translationFailedNotice')}
              </span>
            )}
            <span className="text-indigo-900 font-semibold text-[11px] bg-indigo-100/70 px-2 py-0.5 rounded">
              AI Handoff Ready
            </span>
          </div>
        </div>
      </div>

      {/* Location & Evidence Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Location Summary */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <h4 className="text-sm font-bold text-slate-900">
              {t('locationSummaryLabel')}
            </h4>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-800 font-medium">
              {location.address}
            </p>
            {location.latitude !== null && location.longitude !== null && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                <span>Lat: {location.latitude.toFixed(6)}°</span>
                <span>•</span>
                <span>Lng: {location.longitude.toFixed(6)}°</span>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Summary */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-900 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">
                {t('evidenceSummaryLabel')}
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {evidence.length} {evidence.length === 1 ? t('fileAttached') : t('filesAttached')}
            </span>
          </div>

          <div className="mt-3">
            {evidence.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {t('noEvidenceAttached')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {evidence.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                  >
                    {item.type === 'image' && item.previewUrl ? (
                      <img 
                        src={item.previewUrl} 
                        alt={item.name} 
                        className="w-7 h-7 rounded object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : item.type === 'video' ? (
                      <div className="w-7 h-7 rounded bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <VideoIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center text-slate-700">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <span className="max-w-[120px] truncate font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Pipeline Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{t('aiHandoffNotice')}</p>
          <p className="text-blue-800 mt-0.5">
            Your original language text and the English version will both be handed off to the municipal intelligence agent.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          id="preview-back-to-edit-btn"
          onClick={onEdit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-300 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>{t('editProblemBtn')}</span>
        </button>

        <button
          type="button"
          id="preview-confirm-submit-btn"
          onClick={onConfirmSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              <span>{t('submittingBtn')}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-orange-400" />
              <span>Confirm & save report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
