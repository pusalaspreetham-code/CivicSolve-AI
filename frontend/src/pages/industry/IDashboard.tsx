import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Briefcase,
  Award,
  IndianRupee,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import * as industryService from "../../services/industryService";
import { useIndustryAuth } from "../../context/IndustryAuthContext";
import { useToast } from "../../context/ToastContext";
import StatCard from "../../components/StatCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import SeverityBadge from "../../components/SeverityBadge";
import { IndustryDashboardStats } from "../../types/industry";

const IDashboard = () => {
  const { industry } = useIndustryAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<IndustryDashboardStats | null>(null);
  const [recentAdoptions, setRecentAdoptions] = useState<any[]>([]);
  const [recentSolutions, setRecentSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await industryService.getDashboard();
        setStats(data.stats);
        setRecentAdoptions(data.recentAdoptions);
        setRecentSolutions(data.recentSolutions);
      } catch (err: any) {
        showToast(err.message || "Could not load industry dashboard.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading label="Loading industry control room..." />;
  if (!stats) return null;

  const statusIcons: Record<string, any> = {
    EVALUATING: Clock,
    ACTIVE: Sparkles,
    PILOT_DEPLOYED: Rocket,
    RESOLVED: CheckCircle2,
  };

  const statusColors: Record<string, string> = {
    EVALUATING: "bg-blue-50 text-blue-700 border-blue-200",
    ACTIVE: "bg-amber-50 text-amber-700 border-amber-200",
    PILOT_DEPLOYED: "bg-purple-50 text-purple-700 border-purple-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
            <ShieldCheck size={14} /> Official Industry Partner
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{industry?.company_name}</h1>
          <p className="text-slate-300 text-sm mt-1">
            Focus Sector: <span className="text-amber-400 font-semibold">{industry?.sector}</span> &middot; {industry?.city}, {industry?.state}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/industry/problems"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20"
          >
            <Compass size={16} /> Explore Civic Problems
          </Link>
          <Link
            to="/industry/adoptions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition border border-white/20"
          >
            <Briefcase size={16} /> Adopted Projects
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={`Problems in ${industry?.sector || "Sector"}`}
          value={stats.sectorProblems}
          icon={Layers}
          accent="text-amber-600 bg-amber-50"
        />
        <StatCard
          label="Student Solutions Ready for Review"
          value={stats.solutionsAvailable}
          icon={Award}
          accent="text-violet-600 bg-violet-50"
        />
        <StatCard
          label="Active Corporate Adoptions"
          value={stats.activeAdoptions}
          icon={Briefcase}
          accent="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Committed Grants / Funding"
          value={`₹${stats.totalGrants.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Adoption Status Breakdown */}
      {stats.adoptionsBreakdown && stats.adoptionsBreakdown.length > 0 && (
        <section className="card p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Rocket size={18} className="text-amber-600" />
            Your Problem Implementation Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.adoptionsBreakdown.map((item) => {
              const Icon = statusIcons[item.status] || Sparkles;
              return (
                <div
                  key={item.status}
                  className={`rounded-xl border p-4 text-center ${statusColors[item.status] || "bg-slate-50 border-slate-200"}`}
                >
                  <Icon size={20} className="mx-auto mb-1.5 opacity-80" />
                  <p className="text-2xl font-black">{item.count}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5">{item.status.replace("_", " ")}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Two-column layout: Recent Student Solutions & Active Adoptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Solutions for Review */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Solutions Ready for Review</h2>
              <p className="text-xs text-slate-500">Discover vetted technical proposals submitted by engineering students</p>
            </div>
            <Link
              to="/industry/problems?hasSolutions=true"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentSolutions.length === 0 ? (
            <EmptyState
              title="No student solutions yet"
              description="When students complete problem write-ups, they will appear here for your review and pilot vetting."
            />
          ) : (
            <div className="space-y-3">
              {recentSolutions.map((sol) => (
                <div
                  key={sol.student_problem_id}
                  className="card p-4 hover:shadow-md transition border-l-4 border-l-amber-500 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {sol.domain}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{sol.problem_title}</h3>
                    </div>
                    <SeverityBadge severity={sol.severity} />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                    "{sol.solution_text}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-800">{sol.student_name}</span> &middot; {sol.college} ({sol.branch})
                    </div>
                    <Link
                      to={`/industry/problems/${sol.problem_id}`}
                      className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                    >
                      Review & Pilot <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Your Corporate Adoptions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Adopted Civic Initiatives</h2>
              <p className="text-xs text-slate-500">Track mentorship and implementation commitments</p>
            </div>
            <Link
              to="/industry/adoptions"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Manage all <ArrowRight size={14} />
            </Link>
          </div>

          {recentAdoptions.length === 0 ? (
            <div className="card p-6 text-center space-y-3">
              <Compass size={32} className="mx-auto text-slate-400" />
              <h3 className="font-bold text-slate-900 text-sm">No civic problems adopted yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a civic challenge in your sector to provide mentorship, pilot funding, or hardware resources.
              </p>
              <Link
                to="/industry/problems"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition"
              >
                Browse Problems Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAdoptions.map((adp) => (
                <div key={adp.id} className="card p-4 hover:shadow-md transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-400">Problem #{adp.problem_id}</span>
                      <h3 className="font-bold text-slate-900 text-sm">{adp.problem_title}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusColors[adp.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                    >
                      {adp.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                      Support: <strong className="text-slate-800">{adp.commitment_type.replace("_", " ")}</strong>
                    </span>
                    {Number(adp.budget_estimate) > 0 && (
                      <span>
                        Grant: <strong className="text-emerald-700">₹{Number(adp.budget_estimate).toLocaleString("en-IN")}</strong>
                      </span>
                    )}
                    <Link
                      to={`/industry/problems/${adp.problem_id}`}
                      className="ml-auto text-xs font-bold text-amber-700 hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default IDashboard;
