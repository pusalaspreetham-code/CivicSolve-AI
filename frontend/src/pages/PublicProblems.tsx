import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Filter, Loader2, Search, Sparkles } from "lucide-react";
import type { Problem } from "../types/problem";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fallbackProblems: Problem[] = [
  { id: 1, problem_title: "Uncollected waste blocking the market drain", problem_description: "Household garbage and construction debris remain on the pedestrian path and drainage channel near the community health centre, causing water to back up during rain.", domain: "Waste Management", responsible_fields: ["Environmental Engineering"], severity: "High", confidence: 0.94, image_path: null, image_description: null, locations: [], report_count: 8, location_count: 2 },
  { id: 2, problem_title: "Unsafe pedestrian crossing near the school", problem_description: "Students and older residents have no marked crossing or traffic-calming support at the road junction outside the public school.", domain: "Road Infrastructure", responsible_fields: ["Civil Engineering"], severity: "Medium", confidence: 0.89, image_path: null, image_description: null, locations: [], report_count: 5, location_count: 1 },
  { id: 3, problem_title: "Streetlights not working on the bus route", problem_description: "Several streetlights along the evening bus route have stopped working, reducing visibility for commuters after sunset.", domain: "Public Lighting", responsible_fields: ["Electrical Engineering"], severity: "High", confidence: 0.91, image_path: null, image_description: null, locations: [], report_count: 11, location_count: 4 },
];

const severityStyles: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-100",
  high: "bg-orange-50 text-orange-700 border-orange-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function PublicProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [severity, setSeverity] = useState("all");

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/problems`);
        if (!response.ok) throw new Error("Public problem catalog unavailable");
        const data = await response.json();
        setProblems(Array.isArray(data?.problems) ? data.problems : []);
      } catch {
        setProblems(fallbackProblems);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };
    void loadProblems();
  }, []);

  const domains = useMemo(() => Array.from(new Set(problems.map((problem) => problem.domain).filter(Boolean))).sort(), [problems]);
  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return problems.filter((problem) => {
      const matchesQuery = !normalizedQuery || `${problem.problem_title} ${problem.problem_description} ${problem.domain}`.toLowerCase().includes(normalizedQuery);
      const matchesDomain = domain === "all" || problem.domain === domain;
      const matchesSeverity = severity === "all" || problem.severity.toLowerCase() === severity.toLowerCase();
      return matchesQuery && matchesDomain && matchesSeverity;
    });
  }, [domain, problems, query, severity]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 text-lg font-black text-white">C</span><span><span className="block text-lg font-extrabold tracking-tight">Civic<span className="text-blue-800">Solve</span></span><span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">Public problem statements</span></span></Link>
          <div className="flex items-center gap-2"><Link to="/" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:inline-flex">Home</Link><Link to="/citizen" className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-blue-900"><Sparkles className="h-4 w-4 text-orange-400" /><span className="hidden sm:inline">Report a problem</span><span className="sm:hidden">Report</span></Link></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="rounded-3xl border border-blue-100 bg-blue-950 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100"><BookOpen className="h-3.5 w-3.5 text-orange-300" /> Open registry · no login required</div><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Find a problem worth solving.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Browse clear civic problem statements from the public registry. You only need to sign in when you decide to work on one.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl font-black">{problems.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Statements</p></div><div className="rounded-2xl bg-white/10 p-3"><p className="text-2xl font-black">{domains.length || "—"}</p><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Domains</p></div><div className="col-span-2 rounded-2xl bg-white/10 p-3 sm:col-span-1"><p className="text-2xl font-black">0</p><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Login to browse</p></div></div></div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative block flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Search problem statements</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-9" placeholder="Search problem statements" /></label><div className="flex flex-col gap-3 sm:flex-row"><label className="relative"><span className="sr-only">Filter by domain</span><select value={domain} onChange={(event) => setDomain(event.target.value)} className="input min-w-[190px] appearance-none pr-9"><option value="all">All domains</option>{domains.map((item) => <option key={item} value={item}>{item}</option>)}</select><Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></label><label><span className="sr-only">Filter by severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="input min-w-[160px]"><option value="all">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div></div></section>

        {usingFallback && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">The public API is not connected in this environment, so sample problem statements are shown for preview. The deployed catalog will load live registry data.</div>}
        <section className="mt-7"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Problem statements</p><h2 className="mt-1 text-xl font-black text-slate-950">{loading ? "Loading the registry" : `${filteredProblems.length} ${filteredProblems.length === 1 ? "statement" : "statements"} found`}</h2></div><span className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:inline-flex"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Read-only public view</span></div>
          {loading ? <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-blue-800" /></div> : filteredProblems.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Search className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-3 text-base font-bold text-slate-900">No matching problem statements</h3><p className="mt-1 text-sm text-slate-500">Try a different keyword or clear one of the filters.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{filteredProblems.map((problem) => <article key={problem.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">{problem.domain || "Civic issue"}</p><h3 className="mt-2 text-lg font-extrabold leading-6 text-slate-950">{problem.problem_title}</h3></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${severityStyles[problem.severity.toLowerCase()] || severityStyles.low}`}>{problem.severity}</span></div><p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{problem.problem_description}</p><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-1.5">{(problem.responsible_fields || []).slice(0, 2).map((field) => <span key={field} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{field}</span>)}</div><Link to={`/student/login?problem=${problem.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 transition hover:bg-blue-100">Want to work on this? <ArrowRight className="h-3.5 w-3.5" /></Link></div></article>)}</div>}
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>No login required to read civic problem statements.</span><Link to="/student/login" className="font-bold text-blue-900 hover:underline">Student portal login</Link></div></footer>
    </div>
  );
}
