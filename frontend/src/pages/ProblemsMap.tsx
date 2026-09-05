import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as problemService from "../services/problemService";
import { Problem } from "../types/problem";
import { useToast } from "../context/ToastContext";
import ProblemMap from "../components/ProblemMap";
import Loading from "../components/Loading";

const ProblemsMap = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadProblems = async (filters: { domain?: string; severity?: string }) => {
    setLoading(true);
    try {
      const data = await problemService.getProblemsForMap(filters);
      setProblems(data.problems);
    } catch (err: any) {
      showToast(err.message || "Could not load map data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems({ domain: domainFilter || undefined, severity: severityFilter || undefined });
  }, [domainFilter, severityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const domains = useMemo(() => Array.from(new Set(problems.map((p) => p.domain).filter(Boolean))), [problems]);

  const markers = problems.flatMap((p) =>
    (p.locations || []).map((loc) => ({
      location: loc,
      title: p.problem_title,
      severity: p.severity,
      reportCount: p.report_count,
      locationCount: p.location_count,
      problemId: p.id,
      onView: (id: number) => navigate(`/student/problems/${id}`),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Problem Map</h1>
        <p className="text-slate-500 mt-1">Relevant civic problems plotted by reported location</p>
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

      {loading ? <Loading label="Loading map..." /> : <ProblemMap markers={markers} height="560px" />}
    </div>
  );
};

export default ProblemsMap;
