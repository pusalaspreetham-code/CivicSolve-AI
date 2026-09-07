import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  Briefcase,
  Layers,
  MapPin,
} from "lucide-react";
import * as industryService from "../../services/industryService";
import { useToast } from "../../context/ToastContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import SeverityBadge from "../../components/SeverityBadge";
import { IndustryProblemSummary } from "../../types/industry";
import { DOMAIN_OPTIONS as CANONICAL_DOMAINS } from "../../citizen/constants/domains";

// BUGFIX: this list previously hardcoded its own partial copy of the domain
// taxonomy and was missing "Public Facilities", "Housing", and
// "Communication" — problems in those domains could never be found with
// the filter. Per the project-wide rule (see citizen/constants/domains.ts),
// there must be exactly ONE domain list, mirrored from the AI pipeline's
// ALLOWED_DOMAINS. We reuse it here instead of duplicating it.
const DOMAIN_OPTIONS = ["ALL", ...CANONICAL_DOMAINS];

const SEVERITY_OPTIONS = ["ALL", "Critical", "High", "Medium", "Low"];

const IProblems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [problems, setProblems] = useState<IndustryProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from query params
  const currentDomain = searchParams.get("domain") || "ALL";
  const currentSeverity = searchParams.get("severity") || "ALL";
  const currentHasSolutions = searchParams.get("hasSolutions") === "true";
  const currentSearch = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    fetchProblems();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await industryService.getProblems({
        domain: currentDomain,
        severity: currentSeverity,
        hasSolutions: currentHasSolutions,
        search: currentSearch,
      });
      setProblems(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load civic problems.", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newParams: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === "" || v === "ALL") {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim() || null });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Explore Civic Problems</h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover vetted community challenges categorized by AI, review student innovations, and identify high-impact adoption targets
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3 bg-white">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10 pr-20 w-full"
              placeholder="Search by problem title, keywords, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-md transition"
            >
              Search
            </button>
          </form>

          {/* Domain Dropdown */}
          <div className="w-full md:w-56">
            <select
              className="input text-sm"
              value={currentDomain}
              onChange={(e) => updateFilters({ domain: e.target.value })}
            >
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d === "ALL" ? "All Domains" : d}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="w-full md:w-44">
            <select
              className="input text-sm"
              value={currentSeverity}
              onChange={(e) => updateFilters({ severity: e.target.value })}
            >
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Severities" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle & Filter Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={currentHasSolutions}
              onChange={(e) => updateFilters({ hasSolutions: e.target.checked ? "true" : null })}
              className="h-4 w-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
            />
            <Award size={15} className="text-amber-600" />
            <span>Show only problems with student solutions submitted</span>
          </label>

          {(currentDomain !== "ALL" || currentSeverity !== "ALL" || currentHasSolutions || currentSearch) && (
            <button
              onClick={clearAllFilters}
              className="text-amber-700 hover:text-amber-900 font-semibold underline text-xs"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Found {problems.length} civic problems</span>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <Loading label="Filtering and loading civic problems..." />
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems found"
          description="Try broadening your search term, selecting 'All Domains', or toggling off the solutions filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((p) => (
            <div
              key={p.id}
              className={`card p-5 hover:shadow-lg transition-all flex flex-col justify-between border ${
                p.adopted_by_me ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-200" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* Badges row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      #{p.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {p.domain}
                    </span>
                    {p.adopted_by_me && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                        <CheckCircle2 size={11} /> Adopted by You
                      </span>
                    )}
                  </div>
                  <SeverityBadge severity={p.severity} />
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{p.problem_title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">{p.problem_description}</p>
                </div>

                {/* AI Responsible Fields */}
                {p.responsible_fields && p.responsible_fields.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.responsible_fields.map((rf) => (
                      <span
                        key={rf}
                        className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 font-medium"
                      >
                        {rf}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Meta & Action */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <p className="font-bold text-slate-900">{p.report_count}</p>
                    <p className="text-[10px] text-slate-500">Citizen Reports</p>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <p className="font-bold text-slate-900">{p.working_students}</p>
                    <p className="text-[10px] text-slate-500">Students Active</p>
                  </div>
                  <div className={`p-1.5 rounded border ${p.solution_count > 0 ? "bg-emerald-50 text-emerald-900 border-emerald-200 font-bold" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                    <p className="font-bold">{p.solution_count}</p>
                    <p className="text-[10px]">Solutions Ready</p>
                  </div>
                </div>

                <Link
                  to={`/industry/problems/${p.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition duration-150"
                >
                  View Details & Student Solutions <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IProblems;
