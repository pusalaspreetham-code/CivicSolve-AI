import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, GitCompareArrows, Info, Sparkles } from "lucide-react";
import type { AiPipelineResult } from "../types";
import { BRANCHES } from "../../types/auth";

interface AiReviewPanelProps {
  aiResult: AiPipelineResult;
  onChange: (next: AiPipelineResult) => void;
}

const severityOptions = ["Critical", "High", "Medium", "Low"];
const domainOptions = ["Road Infrastructure", "Waste Management", "Water and Drainage", "Public Health", "Public Safety", "Education", "Environment", "Transport", "Electricity", "Other"];

export function AiReviewPanel({ aiResult, onChange }: AiReviewPanelProps) {
  const confidenceLabel = useMemo(() => {
    const confidence = typeof aiResult.confidence === "number" ? aiResult.confidence : 0;
    return confidence >= 0.8 ? "High confidence" : confidence >= 0.55 ? "Review carefully" : "Needs your review";
  }, [aiResult.confidence]);
  const isDuplicateCandidate = aiResult.action === "merged_existing" || Boolean(aiResult.matchedExistingId);
  const percent = Math.round((aiResult.confidence || 0) * 100);

  const update = (field: keyof AiPipelineResult, value: string | number | string[]) => onChange({ ...aiResult, [field]: value });

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm" aria-labelledby="ai-review-heading">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-950 to-blue-900 p-4 text-white sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div><div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200"><Sparkles className="h-3.5 w-3.5 text-orange-300" /> AI-generated draft</div><h3 id="ai-review-heading" className="mt-1 text-lg font-extrabold">Review before it is saved</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-indigo-100">The assistant organized your report for the civic registry. Edit anything that is inaccurate. Your original words remain preserved below.</p></div>
          <div className="hidden shrink-0 rounded-xl bg-white/10 px-3 py-2 text-right sm:block"><p className="text-lg font-black">{percent}%</p><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">{confidenceLabel}</p></div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!aiResult.ok && <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-bold">Please verify this draft manually</p><p className="mt-0.5 leading-5">{aiResult.reason || "The AI service returned a limited draft. You can still correct every field before saving."}</p></div></div>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2"><span className="label">Problem title</span><input value={aiResult.problemTitle || ""} onChange={(event) => update("problemTitle", event.target.value)} className="input" placeholder="A concise problem title" /></label>
          <label className="block md:col-span-2"><span className="label">AI-generated problem statement</span><textarea value={aiResult.problemDescription || ""} onChange={(event) => update("problemDescription", event.target.value)} className="input min-h-28 resize-y" placeholder="Describe the problem clearly" /></label>
          <label className="block"><span className="label">Domain</span><select value={aiResult.domain || "Other"} onChange={(event) => update("domain", event.target.value)} className="input"><option value="">Select domain</option>{domainOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="label">Severity</span><select value={aiResult.severity || "Medium"} onChange={(event) => update("severity", event.target.value)} className="input"><option value="">Select severity</option>{severityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block md:col-span-2"><span className="label">Responsible academic branches</span><select multiple value={aiResult.responsibleFields || []} onChange={(event) => update("responsibleFields", Array.from(event.target.selectedOptions, (option) => option.value))} className="input min-h-32"><option value="" disabled>Select one or more branches</option>{BRANCHES.map((item) => <option key={item} value={item}>{item}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Hold Ctrl/Cmd to select multiple branches.</span></label>
        </div>

        <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${isDuplicateCandidate ? "border-orange-200 bg-orange-50 text-orange-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          {isDuplicateCandidate ? <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
          <div><p className="font-bold">{isDuplicateCandidate ? "A similar registry problem may exist" : "Duplicate check queued after confirmation"}</p><p className="mt-0.5 leading-5">{isDuplicateCandidate ? `Potential match #${aiResult.matchedExistingId || "—"}${aiResult.similarity ? ` · ${Math.round(aiResult.similarity * 100)}% similarity` : ""}. The final check will run again after your edits.` : "CivicSolve will compare this confirmed version with existing problem statements before creating a new record."}</p></div>
        </div>

        <div className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" /><span>Only the confirmed version is sent to the persistence and deduplication step. You can go back and change your report at any time.</span></div>
      </div>
    </section>
  );
}
