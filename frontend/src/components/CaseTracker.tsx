import { FormEvent, useState } from "react";
import { Search, Loader2, CircleCheck, Clock3, AlertCircle } from "lucide-react";

const CaseTracker = () => {
  const [reference, setReference] = useState("");
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackCase = async (event: FormEvent) => {
    event.preventDefault();
    const value = reference.trim().toUpperCase();
    if (!value) return setError("Enter your case reference ID.");
    setLoading(true);
    setError("");
    setCaseData(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBase}/citizen/cases/${encodeURIComponent(value)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Case reference not found.");
      setCaseData(data.case);
    } catch (err: any) {
      setError(err.message || "Could not track this case.");
    } finally {
      setLoading(false);
    }
  };

  const isProcessing =
    caseData &&
    !["PROCESSED", "COMPLETED"].includes(
      String(caseData.status || "").toUpperCase()
    );
  return (
    <section className="mt-16 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="case-tracker-heading">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Citizen case tracker</p>
        <h2 id="case-tracker-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Track your submitted report</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter the case reference ID shown after you submit a report to see its current processing status and progress.</p>
      </div>
      <form onSubmit={trackCase} className="mt-5 flex flex-col gap-2 sm:flex-row sm:max-w-xl">
        <input value={reference} onChange={(event) => setReference(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm uppercase text-slate-900 outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100" placeholder="Example: CS-2026-123456" aria-label="Case reference ID" />
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Checking…</> : <><Search className="h-4 w-4" />Track case</>}</button>
      </form>
      {error && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4" />{error}</p>}
      {caseData && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Case reference</p><p className="font-mono font-bold text-blue-950">{caseData.case_reference}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">{isProcessing ? <Clock3 className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}{isProcessing ? "Processing" : "Processed"}</span></div>{isProcessing ? <p className="mt-3 text-sm text-slate-600">Your report is saved and AI processing is still in progress. Check again shortly.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Citizen reports</p><p className="text-xl font-black text-slate-950">{caseData.report_count}</p></div><div><p className="text-xs text-slate-500">Students solving</p><p className="text-xl font-black text-slate-950">{caseData.students_solving}</p></div><div><p className="text-xs text-slate-500">Students completed</p><p className="text-xl font-black text-slate-950">{caseData.students_completed}</p></div><div className="sm:col-span-3"><p className="text-xs text-slate-500">Problem</p><p className="font-semibold text-slate-900">{caseData.problem_title || "Report received"}</p></div></div>}</div>}
    </section>
  );
};
export default CaseTracker;
