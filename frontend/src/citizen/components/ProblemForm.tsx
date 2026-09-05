import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Info, 
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  ProblemFormData, 
  FormErrors, 
  SubmissionStepState, 
  ProblemIntakeReceipt,
  CitizenProblemPayload,
  AiPipelineResult,
} from '../types';
import { LocationInput } from './LocationInput';
import { EvidenceUploader } from './EvidenceUploader';
import { VoiceInput } from './VoiceInput';
import { SubmissionPreview } from './SubmissionPreview';
import { AiReviewPanel } from './AiReviewPanel';
import { useLanguage } from '../context/LanguageContext';
import { translateToEnglish, TranslationResult } from '../services/translationService';

interface ProblemFormProps {
  onSuccess: (receipt: ProblemIntakeReceipt) => void;
}

export const ProblemForm: React.FC<ProblemFormProps> = ({ onSuccess }) => {
  const { currentLanguage, t } = useLanguage();

  const [stepState, setStepState] = useState<SubmissionStepState>('editing');
  const [formData, setFormData] = useState<ProblemFormData>({
    description: '',
    language: currentLanguage.code,
    location: {
      address: '',
      latitude: null,
      longitude: null,
    },
    evidence: [],
  });

  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [translationStatus, setTranslationStatus] = useState<TranslationResult | undefined>(undefined);
  const [aiResult, setAiResult] = useState<AiPipelineResult | null>(null);
  const [previewId, setPreviewId] = useState<string | undefined>(undefined);
  const [aiCompletionPrompt, setAiCompletionPrompt] = useState<AiPipelineResult | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<{
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      newErrors.description = t('descriptionRequiredError');
    } else if (trimmedDesc.length < 15) {
      newErrors.description = t('descriptionMinLengthError');
    }

    if (!formData.location.address.trim()) {
      newErrors.address = t('locationRequiredError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVoiceTranscriptUpdate = (transcribedText: string, mode: 'append' | 'replace') => {
    setFormData((prev) => {
      let updatedDescription = '';
      if (mode === 'replace' || !prev.description.trim()) {
        updatedDescription = transcribedText;
      } else {
        updatedDescription = `${prev.description.trim()} ${transcribedText}`.trim();
      }
      return {
        ...prev,
        description: updatedDescription,
        language: currentLanguage.code,
      };
    });

    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  /**
   * Transition from Form Editing to Preview
   * Automatically executes the clean translateToEnglish service before preview
   */
  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    const originalText = formData.description.trim();
    const fallbackDraft: AiPipelineResult = {
      ok: false,
      action: 'skipped',
      problemTitle: originalText.split(/[.!?]/)[0].split(/\s+/).slice(0, 10).join(' '),
      problemDescription: originalText,
      domain: 'Other',
      responsibleFields: ['Other'],
      severity: 'Medium',
      confidence: 0,
      reason: 'AI analysis is running. You can enter or edit the details manually.',
    };
    setEnglishTranslation(originalText);
    setAiResult(fallbackDraft);
    setAiCompletionPrompt(null);
    setStepState('preview');

    const runBackgroundProcessing = async () => {
      let translatedText = originalText;
      try {
        const result = await translateToEnglish(originalText, currentLanguage.code);
        setTranslationStatus(result);
        translatedText = result.englishText || originalText;
        setEnglishTranslation(translatedText);
      } catch (err) {
        console.warn('Background translation warning:', err);
        setTranslationStatus({ success: false, originalText, sourceLanguage: currentLanguage.code, englishText: originalText, error: 'Translation failed; original text will be forwarded.' });
      }
      const previewPayload: CitizenProblemPayload = {
        description: { original: originalText, language: currentLanguage.code, english: translatedText },
        location: { address: formData.location.address.trim(), latitude: formData.location.latitude, longitude: formData.location.longitude },
        evidence: formData.evidence.map((ev) => ({ type: ev.type, name: ev.name, url: ev.previewUrl || ev.url || '', size: ev.size, previewUrl: ev.previewUrl })),
        metadata: { submittedAt: new Date().toISOString(), source: 'citizen', clientLanguage: currentLanguage.code },
      };
      try {
        const configuredApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${configuredApiBase}/citizen/problems/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(previewPayload) });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.jobId) throw new Error(data?.message || 'AI preview could not be queued');
        setPreviewId(data.previewId);
        for (let attempt = 0; attempt < 60; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const statusResponse = await fetch(`${configuredApiBase}/citizen/problems/jobs/${encodeURIComponent(data.jobId)}`);
          const status = await statusResponse.json().catch(() => null);
          if (!statusResponse.ok) throw new Error(status?.message || 'Could not read AI preview status');
          if (status.state === 'completed' && status.result) { setAiCompletionPrompt(status.result as AiPipelineResult); return; }
          if (status.state === 'failed') throw new Error(status.error || 'AI preview failed');
        }
        throw new Error('AI preview is still running. You can continue manually.');
      } catch (err: any) {
        console.warn('Background AI preview warning:', err);
        setSubmitError({ title: 'AI preview notice', message: err?.message || 'AI preview is unavailable. You can continue manually.' });
      }
    };
    void runBackgroundProcessing();
  };

  /**
   * Reads a File as a base64 data URL. Used to give the AI pipeline
   * (server-side) actual image bytes to analyze, since blob: preview
   * URLs are only valid inside this browser tab.
   */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  /**
   * Final Submission to POST /api/citizen/problems
   */
  const handleConfirmSubmit = async () => {
    setStepState('submitting');
    setSubmitError(null);

    // Only the first image is sent for AI analysis, matching the
    // classification pipeline's single-image-per-report design.
    const firstImage = formData.evidence.find((ev) => ev.type === 'image' && ev.file);
    let firstImageBase64: string | undefined;
    if (firstImage?.file) {
      try {
        firstImageBase64 = await fileToBase64(firstImage.file);
      } catch (err) {
        console.warn('Could not read evidence image for AI analysis:', err);
      }
    }

    const payload: CitizenProblemPayload = {
      description: {
        original: formData.description.trim(),
        language: currentLanguage.code,
        english: (englishTranslation || formData.description).trim(),
      },
      location: {
        address: formData.location.address.trim(),
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
      },
      evidence: formData.evidence.map((ev) => ({
        type: ev.type,
        name: ev.name,
        url: ev.previewUrl || ev.url || '',
        size: ev.size,
        previewUrl: ev.previewUrl,
        base64: ev.type === 'image' && ev.id === firstImage?.id ? firstImageBase64 : undefined,
      })),
      metadata: {
        submittedAt: new Date().toISOString(),
        source: 'citizen',
        clientLanguage: currentLanguage.code,
        previewId,
        reviewedAiResult: aiResult || undefined,
      },
    };

    const configuredApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const primaryUrl = `${configuredApiBase}/citizen/problems/confirm`;

    let response: Response | null = null;
    let data: any = null;

    try {
      response = await fetch(primaryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 400) {
          setSubmitError({
            title: t('errorTitle'),
            message: data?.message || 'The server rejected the intake submission due to missing or invalid fields.',
            details: data?.errors,
          });
        } else {
          setSubmitError({
            title: `${t('errorTitle')} (${response.status})`,
            message: data?.message || 'The intake service encountered an unexpected error.',
          });
        }
        setStepState('preview');
        return;
      }

      // Success
      setStepState('success');
      const receipt: ProblemIntakeReceipt = {
        success: true,
        message: data?.message || 'Problem intake received successfully and queued for AI agent processing.',
        problemId: data?.problemId || data?.intakeId || '',
        intakeId: data?.intakeId || data?.problemId || '',
        status: 'RECEIVED',
        timestamp: data?.timestamp || new Date().toISOString(),
        payload: data?.payload || payload,
        aiResult: data?.aiResult || aiResult || undefined,
      };

      onSuccess(receipt);
    } catch (networkErr: any) {
      console.error('Submission fetch error:', networkErr);
      setSubmitError({
        title: 'Network Communication Error',
        message: 'Could not connect to the CivicSolve intake backend endpoint. Please ensure the server is active.',
        details: [networkErr?.message || 'Request failed or was rejected by network policy.'],
      });
      setStepState('preview');
    }
  };

  const handleFillSample = () => {
    setFormData({
      description:
        'Large accumulation of uncollected household garbage and broken construction debris obstructing the pedestrian sidewalk and drainage channel. During recent rains, the water is backing up into nearby shop entrances and creating a breeding ground for mosquitoes.',
      language: currentLanguage.code,
      location: {
        address: 'Ward 14, Main Market Road near Community Health Centre',
        latitude: null,
        longitude: null,
      },
      evidence: [],
    });
    setErrors({});
  };

  if (stepState === 'preview' && !aiResult) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-4"><XCircle className="mx-auto h-8 w-8 text-red-600" /><h3 className="font-bold text-red-900">AI preview unavailable</h3><p className="text-sm text-red-800">{submitError?.message || 'The AI service did not return a result.'}</p><div className="flex justify-center gap-3"><button type="button" className="btn-secondary" onClick={() => setStepState('editing')}>Edit report</button><button type="button" className="btn-primary" onClick={() => handleProceedToPreview({ preventDefault: () => undefined } as React.FormEvent)}>Retry AI preview</button></div></div>;
  }
  // If in Preview or Submitting state, render the citizen review and AI draft.
  if ((stepState === 'preview' || stepState === 'submitting') && aiResult) {
    return (
      <div className="space-y-6">
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-sm text-red-900">{submitError.title}</h5>
                <p className="mt-0.5 text-red-800">{submitError.message}</p>
                {submitError.details && submitError.details.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-0.5 font-mono text-[11px] text-red-700">
                    {submitError.details.map((det, idx) => (
                      <li key={idx}>{det}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              {t('errorDismiss')}
            </button>
          </div>
        )}

        {aiCompletionPrompt && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm" role="dialog" aria-live="polite">
            <h3 className="font-bold text-blue-950">AI analysis completed</h3>
            <p className="mt-1 text-sm text-blue-900">AI-generated details are ready. Would you like to use them in this report?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => { setAiResult(aiCompletionPrompt); setAiCompletionPrompt(null); }}>Yes, update details</button>
              <button type="button" className="btn-secondary" onClick={() => setAiCompletionPrompt(null)}>No, keep my manual details</button>
            </div>
          </div>
        )}
        <SubmissionPreview
          originalDescription={formData.description}
          englishTranslation={englishTranslation}
          sourceLanguageCode={currentLanguage.code}
          location={formData.location}
          evidence={formData.evidence}
          isSubmitting={stepState === 'submitting'}
          translationStatus={translationStatus}
          aiResult={aiResult}
          onAiResultChange={setAiResult}
          onEdit={() => setStepState('editing')}
          onConfirmSubmit={handleConfirmSubmit}
        />
      </div>
    );
  }

  // Translation and AI analysis transition state.
  if (stepState === 'translating' || stepState === 'analyzing') {
    return (
      <div className="py-16 px-4 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-900">
          <Loader2 className="w-7 h-7 animate-spin text-blue-900" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {stepState === 'analyzing' ? 'Generating a reviewable AI draft' : t('translatingNotice')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {stepState === 'analyzing' ? 'Classifying the problem and checking the public registry without saving anything yet.' : 'Preparing an English translation preview for the municipal AI system while preserving your original words verbatim.'}
          </p>
        </div>
      </div>
    );
  }

  // Editing state (Standard citizen form)
  return (
    <form onSubmit={handleProceedToPreview} className="space-y-8" id="citizen-problem-form" noValidate>
      {/* Sample fill shortcut for fast evaluation */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <span className="text-xs font-medium text-slate-500">
          {t('requiredFieldsNotice')}
        </span>
        <button
          type="button"
          onClick={handleFillSample}
          className="text-xs font-semibold text-blue-900 hover:text-blue-700 underline decoration-blue-300 underline-offset-2 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{t('fillSample')}</span>
        </button>
      </div>

      {/* Field 1: Problem Description (No Title, No Category) */}
      <div className="space-y-2" id="field-description">
        <div className="flex items-center justify-between">
          <label htmlFor="problem-description" className="block text-sm font-semibold text-slate-900">
            {t('descriptionLabel')} <span className="text-orange-600">*</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {formData.description.length} chars
          </span>
        </div>

        <p className="text-xs text-slate-500">
          {t('descriptionHint')}
        </p>

        <textarea
          id="problem-description"
          name="description"
          rows={5}
          value={formData.description}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, description: e.target.value }));
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          placeholder={t('descriptionPlaceholder')}
          className={`w-full px-3.5 py-3 text-sm text-slate-900 bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-2 transition-colors ${
            errors.description
              ? 'border-red-400 focus:ring-red-400/50 bg-red-50/20'
              : 'border-slate-300 focus:border-blue-900 focus:ring-blue-900/20'
          }`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />

        {errors.description && (
          <p id="description-error" className="text-xs font-medium text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.description}</span>
          </p>
        )}
      </div>

      {/* Field 2: Voice Description (Speech-to-Text Input) */}
      <VoiceInput
        currentDescription={formData.description}
        onTranscriptUpdate={handleVoiceTranscriptUpdate}
      />

      {/* Field 3: Problem Location */}
      <div id="field-address">
        <LocationInput
          address={formData.location.address}
          latitude={formData.location.latitude}
          longitude={formData.location.longitude}
          error={errors.address}
          onChange={(newAddress, lat, lng) => {
            setFormData((prev) => ({
              ...prev,
              location: {
                address: newAddress,
                latitude: lat,
                longitude: lng,
              },
            }));
            if (errors.address) {
              setErrors((prev) => ({ ...prev, address: undefined }));
            }
          }}
        />
      </div>

      {/* Field 4: Visual Evidence Upload */}
      <div>
        <EvidenceUploader
          evidence={formData.evidence}
          onChange={(newEvidence) => {
            setFormData((prev) => ({ ...prev, evidence: newEvidence }));
          }}
        />
      </div>

      {/* Action: Review & Preview Button */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-blue-900 shrink-0" />
          <span>
            You will review your original description and its English translation before final submission.
          </span>
        </div>

        <button
          type="submit"
          id="proceed-to-preview-btn"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <Eye className="w-4 h-4 text-orange-400" />
          <span>{t('reviewAndPreviewBtn')}</span>
        </button>
      </div>
    </form>
  );
};
