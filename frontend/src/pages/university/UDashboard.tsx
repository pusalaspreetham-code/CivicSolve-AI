import { useEffect, useState } from "react";
import { Users, Building2, Network, ShieldCheck, GraduationCap } from "lucide-react";
import * as universityService from "../../services/universityService";
import { useUniversityAuth } from "../../context/UniversityAuthContext";
import { useToast } from "../../context/ToastContext";
import StatCard from "../../components/StatCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { ProblemWorked, RecentStudent, UniversityDashboardStats } from "../../types/university";

const UDashboard = () => {
  const { university } = useUniversityAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UniversityDashboardStats | null>(null);
  const [problemsWorked, setProblemsWorked] = useState<ProblemWorked[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await universityService.getDashboard();
        setStats(data.stats);
        setProblemsWorked(data.problemsWorked);
        setRecentStudents(data.recentStudents);
      } catch (err: any) {
        showToast(err.message || "Could not load dashboard.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading label="Loading your university dashboard..." />;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{university?.name}</h1>
        <p className="text-slate-500 mt-1">
          Verified institutional domain: <span className="font-mono font-medium text-slate-700">@{university?.domain}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Students registered from your university" value={stats.studentsRegistered} icon={GraduationCap} accent="text-violet-600 bg-violet-50" />
        <StatCard label="Universities on the CivicSolve network" value={stats.universitiesOnPlatform} icon={Building2} accent="text-blue-600 bg-blue-50" />
        <StatCard label="Universities actively working problems" value={stats.universitiesActivelyWorking} icon={Network} accent="text-emerald-600 bg-emerald-50" />
        <StatCard label="Teams formed by your students" value={stats.teamsFromThisUniversity} icon={Users} accent="text-amber-600 bg-amber-50" />
      </div>

      {stats.statusBreakdown.length > 0 && (
        <section className="card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-900">Your students' progress</h2>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {stats.statusBreakdown.map((s) => (
              <div key={s.status} className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-2xl font-semibold text-slate-900">{s.count}</p>
                <p className="text-xs text-slate-500 mt-1">{s.status}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Problems your students are working on</h2>
        {problemsWorked.length === 0 ? (
          <EmptyState title="No problems taken yet" description="Once your students take up a civic problem, it will show up here." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Problem</th>
                  <th className="px-4 py-2 font-medium">Domain</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium text-right">Your students</th>
                  <th className="px-4 py-2 font-medium text-right">Universities working on it</th>
                </tr>
              </thead>
              <tbody>
                {problemsWorked.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">{p.problem_title}</p>
                      <p className="text-xs text-slate-400 font-mono">ID #{p.id}</p>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.domain}</td>
                    <td className="px-4 py-2 text-slate-600">{p.severity}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">{p.our_students}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{p.universities_working}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recently registered students</h2>
        {recentStudents.length === 0 ? (
          <EmptyState title="No students yet" description="Students who register with your institutional email domain appear here automatically." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {recentStudents.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
                <p className="text-xs text-slate-500">{s.branch} &middot; {s.year_of_study}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UDashboard;
