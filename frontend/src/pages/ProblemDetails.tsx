import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Users, MapPin, GraduationCap, Gauge } from "lucide-react";
import * as problemService from "../services/problemService";
import { Problem, ProblemStatus } from "../types/problem";
import { useToast } from "../context/ToastContext";
import SeverityBadge from "../components/SeverityBadge";
import ProblemMap from "../components/ProblemMap";
import TeamsPanel from "../components/TeamsPanel";
import Loading from "../components/Loading";

const ProblemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [myStatus, setMyStatus] = useState<ProblemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [untaking, setUntaking] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await problemService.getProblemById(id as string);
        setProblem(data.problem);
        setMyStatus(data.myStatus);
      } catch (err: any) {
        showToast(err.message || "Problem not found.", "error");
        navigate("/student/problems");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUntake = async () => {
    if (!problem) return;
    setUntaking(true);
    try { const mine = await problemService.getMyProblems(); const record = mine.find((item) => item.problem_id === problem.id); if (record) { await problemService.removeMyProblem(record.student_problem_id); setMyStatus(null); showToast("Problem removed from My Problems.", "success"); } } catch (err: any) { showToast(err.message || "Could not untake problem.", "error"); } finally { setUntaking(false); }
  };

  const handleTake = async () => {
    if (!problem) return;
    setTaking(true);
    try {
      const res = await problemService.joinProblem(problem.id);
      showToast(res.message, res.alreadyJoined ? "info" : "success");
      setMyStatus(res.studentProblem.status);
    } catch (err: any) {
      showToast(err.message || "Could not take problem.", "error");
    } finally {
      setTaking(false);
    }
  };

  if (loading) return <Loading label="Loading problem..." />;
  if (!problem) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono font-semibold text-brand-600 bg-brand-50 inline-block px-2 py-0.5 rounded mb-1">
              Problem ID #{problem.id}
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{problem.problem_title}</h1>
            <p className="text-xs text-slate-400 mt-1">Note this ID — use it to track this complaint from your dashboard.</p>
          </div>
          <SeverityBadge severity={problem.severity} />
        </div>

        <p className="text-slate-600">{problem.problem_description}</p>

        {problem.image_path && (
          <img
            src={problem.image_path}
            alt={problem.image_description || problem.problem_title}
            className="rounded-lg border border-slate-200 max-h-80 object-cover"
          />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Domain</p>
            <p className="text-sm font-medium text-slate-800">{problem.domain}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <GraduationCap size={12} /> Required Field
            </p>
            <p className="text-sm font-medium text-slate-800">{problem.responsible_fields?.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Gauge size={12} /> AI Confidence
            </p>
            <p className="text-sm font-medium text-slate-800">{Math.round((problem.confidence || 0) * 100)}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Users size={12} /> Reported by
            </p>
            <p className="text-sm font-medium text-slate-800">{problem.report_count} citizens</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin size={12} /> Locations
            </p>
            <p className="text-sm font-medium text-slate-800">{problem.location_count}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2"><button onClick={handleTake} disabled={taking || !!myStatus} className="btn-primary w-full sm:w-auto">
          {myStatus
            ? myStatus === "INTERESTED"
              ? "Problem Taken"
              : myStatus === "WORKING"
              ? "Working on Problem"
              : "Completed"
            : taking
            ? "Joining..."
            : "Take Problem"}
        </button>{myStatus && <button onClick={handleUntake} disabled={untaking} className="btn-secondary">{untaking ? "Removing..." : "Untake Problem"}</button>}</div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Reported Locations</h2>
        <ProblemMap
          markers={(problem.locations || []).map((loc) => ({
            location: loc,
            title: problem.problem_title,
            severity: problem.severity,
            reportCount: problem.report_count,
            locationCount: problem.location_count,
          }))}
          height="420px"
        />
        <p className="text-sm text-slate-500 mt-2">
          {problem.report_count} citizen report{problem.report_count === 1 ? "" : "s"} from {problem.location_count} location
          {problem.location_count === 1 ? "" : "s"}
        </p>
      </div>

      {(problem as any).solutions?.length > 0 && <section className="card p-5"><h2 className="text-lg font-semibold text-slate-900">Student solutions</h2><p className="text-sm text-slate-500 mt-1">{(problem as any).solutions.length} completed solution(s) shared for this problem.</p><div className="mt-4 space-y-3">{(problem as any).solutions.map((solution: any) => <article key={solution.student_problem_id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"><p className="font-semibold">{solution.student_name}</p><p className="mt-1">{solution.solution_text}</p></article>)}</div></section>}

      <TeamsPanel problemId={problem.id} />

      <Link to="/student/my-problems" className="text-sm text-brand-600 font-medium inline-block">
        Go to My Problems &rarr;
      </Link>
    </div>
  );
};

export default ProblemDetails;
