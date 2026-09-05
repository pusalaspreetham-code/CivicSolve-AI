import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as problemService from "../services/problemService";
import { Problem, MyProblem } from "../types/problem";
import ProblemCard from "../components/ProblemCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const AllProblems = () => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [myProblems, setMyProblems] = useState<MyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<number | null>(null);
  const [domainFilter, setDomainFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState<"all" | "mine" | "other">("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [all, mine] = await Promise.all([
          problemService.getAllProblems(),
          problemService.getMyProblems(),
        ]);
        setProblems(all.problems);
        setMyProblems(mine);
      } catch (err: any) {
        showToast(err.message || "Could not load problems.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTake = async (id: number) => {
    setTakingId(id);
    try {
      const res = await problemService.joinProblem(id);
      showToast(res.message, res.alreadyJoined ? "info" : "success");
      const mine = await problemService.getMyProblems();
      setMyProblems(mine);
    } catch (err: any) {
      showToast(err.message || "Could not take problem.", "error");
    } finally {
      setTakingId(null);
    }
  };

  const statusFor = (problemId: number) => myProblems.find((mp) => mp.problem_id === problemId)?.status || null;

  const domains = useMemo(() => Array.from(new Set(problems.map((p) => p.domain).filter(Boolean))), [problems]);

  const isOwnBranch = (p: Problem) => !!student?.branch && p.responsible_fields?.includes(student.branch);

  const filtered = problems.filter((p) => {
    if (domainFilter && p.domain !== domainFilter) return false;
    if (severityFilter && (p.severity || "").toLowerCase() !== severityFilter.toLowerCase()) return false;
    if (branchFilter === "mine" && !isOwnBranch(p)) return false;
    if (branchFilter === "other" && isOwnBranch(p)) return false;
    return true;
  });

  if (loading) return <Loading label="Loading all problems..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">All Problems</h1>
        <p className="text-slate-500 mt-1">
          Every civic problem on CivicSolve AI, across all branches — not just {student?.branch}. Pick up anything
          that interests you.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          className="input w-auto"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value as "all" | "mine" | "other")}
        >
          <option value="all">All branches</option>
          <option value="mine">My branch ({student?.branch})</option>
          <option value="other">Other branches</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No problems match your filters"
          description="Try clearing filters, or check back later as new civic reports come in."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="relative">
              {!isOwnBranch(p) && (
                <span className="absolute -top-2 left-4 z-10 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-white shadow">
                  Outside your branch
                </span>
              )}
              <ProblemCard problem={p} onTake={handleTake} taking={takingId === p.id} status={statusFor(p.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProblems;