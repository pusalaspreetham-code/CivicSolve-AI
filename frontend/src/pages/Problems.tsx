import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as problemService from "../services/problemService";
import { Problem, MyProblem } from "../types/problem";
import ProblemCard from "../components/ProblemCard";
import ProblemNameSearch from "../components/ProblemNameSearch";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const Problems = () => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [myProblems, setMyProblems] = useState<MyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<number | null>(null);
  const [domainFilter, setDomainFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [relevant, mine] = await Promise.all([
          problemService.getRelevantProblems(),
          problemService.getMyProblems(),
        ]);
        setProblems(relevant.problems);
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

  const filtered = problems.filter((p) => {
    if (domainFilter && p.domain !== domainFilter) return false;
    if (severityFilter && (p.severity || "").toLowerCase() !== severityFilter.toLowerCase()) return false;
    return true;
  });

  if (loading) return <Loading label="Loading problems..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Problems</h1>
        <p className="text-slate-500 mt-1">Civic problems relevant to {student?.branch}</p>
      </div>

      <div className="max-w-md">
        <p className="label mb-1">Know the problem's name but not its ID? Search here</p>
        <ProblemNameSearch onSelect={(p) => navigate(`/student/problems/${p.id}`)} />
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No problems match your filters"
          description="Try clearing filters, or check back later as new civic reports come in."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProblemCard key={p.id} problem={p} onTake={handleTake} taking={takingId === p.id} status={statusFor(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Problems;
