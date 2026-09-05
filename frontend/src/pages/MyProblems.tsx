import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as problemService from "../services/problemService";
import { MyProblem, ProblemStatus } from "../types/problem";
import { useToast } from "../context/ToastContext";
import SeverityBadge from "../components/SeverityBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
const STATUS_FLOW: Record<ProblemStatus, ProblemStatus | null> = { INTERESTED: "WORKING", WORKING: "COMPLETED", COMPLETED: null };
const MyProblems = () => {
  const [items, setItems] = useState<MyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [solutions, setSolutions] = useState<Record<number, string>>({});
  const { showToast } = useToast();
  const load = async () => { setLoading(true); try { setItems(await problemService.getMyProblems()); } catch (err: any) { showToast(err.message || "Could not load your problems.", "error"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const updateStatus = async (item: MyProblem) => {
    const next = STATUS_FLOW[item.status]; if (!next) return;
    const solution = solutions[item.student_problem_id]?.trim();
    if (next === "COMPLETED" && (!solution || solution.length < 10)) { showToast("Describe how you solved the problem in at least 10 characters.", "error"); return; }
    setUpdatingId(item.student_problem_id);
    try { await problemService.updateMyProblemStatus(item.student_problem_id, next, solution); showToast(next === "COMPLETED" ? "Solution submitted and problem completed." : "Problem marked as working.", "success"); await load(); } catch (err: any) { showToast(err.message || "Could not update status.", "error"); } finally { setUpdatingId(null); }
  };
  const untake = async (item: MyProblem) => { setUpdatingId(item.student_problem_id); try { await problemService.removeMyProblem(item.student_problem_id); showToast("Problem removed from My Problems.", "success"); await load(); } catch (err: any) { showToast(err.message || "Could not remove problem.", "error"); } finally { setUpdatingId(null); } };
  if (loading) return <Loading label="Loading your problems..." />;
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-slate-900">My Problems</h1><p className="text-slate-500 mt-1">Problems you've taken up to solve</p></div>{items.length === 0 ? <EmptyState title="You haven't taken any problems yet" description="Browse relevant problems and click Take Problem to start working on one." action={<Link to="/student/problems" className="btn-primary">Browse Problems</Link>} /> : <div className="space-y-3">{items.map((item) => <div key={item.student_problem_id} className="card p-5 space-y-4"><div className="flex flex-col sm:flex-row sm:items-center gap-4"><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-slate-900">{item.problem_title}</h3><SeverityBadge severity={item.severity} /></div><p className="text-sm text-slate-500 mt-1">{item.domain} · Joined {new Date(item.joined_at).toLocaleDateString()}</p><p className="text-xs text-slate-400 mt-1">{item.report_count} citizen reports · {item.location_count} locations</p></div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{item.status}</span><Link to={`/student/problems/${item.problem_id}`} className="btn-secondary">View</Link><button onClick={() => untake(item)} disabled={updatingId === item.student_problem_id} className="btn-secondary">Untake</button>{STATUS_FLOW[item.status] && <button onClick={() => updateStatus(item)} disabled={updatingId === item.student_problem_id} className="btn-primary">{updatingId === item.student_problem_id ? "Updating..." : item.status === "INTERESTED" ? "Start Working" : "Submit Solution & Finish"}</button>}</div></div>{item.status === "WORKING" && <div><label className="label">How did you solve this problem?</label><textarea className="input min-h-24" value={solutions[item.student_problem_id] ?? item.solution_text ?? ""} onChange={(e) => setSolutions((prev) => ({ ...prev, [item.student_problem_id]: e.target.value }))} placeholder="Describe the work, outcome, and any evidence of the solution." /></div>}{item.status === "COMPLETED" && item.solution_text && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900"><strong>Submitted solution:</strong> {item.solution_text}</div>}</div>)}</div>}</div>;
};
export default MyProblems;
