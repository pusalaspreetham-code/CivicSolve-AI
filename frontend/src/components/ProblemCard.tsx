import { Link } from "react-router-dom";
import { Users, MapPin, GraduationCap } from "lucide-react";
import { Problem } from "../types/problem";
import SeverityBadge from "./SeverityBadge";

interface Props {
  problem: Problem;
  onTake?: (id: number) => void;
  taking?: boolean;
  status?: string | null;
}

const ProblemCard = ({ problem, onTake, taking, status }: Props) => {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-mono font-semibold text-slate-400">ID #{problem.id}</p>
          <h3 className="font-semibold text-slate-900 leading-snug">{problem.problem_title}</h3>
        </div>
        <SeverityBadge severity={problem.severity} />
      </div>

      <p className="text-sm text-slate-500 line-clamp-2">{problem.problem_description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          <span className="text-slate-400">Domain: </span>
          {problem.domain}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap size={13} />
          {problem.responsible_fields?.join(", ")}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-700 pt-1">
        <span className="flex items-center gap-1.5">
          <Users size={15} className="text-brand-600" />
          Reported by <strong>{problem.report_count}</strong> citizens
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={15} className="text-brand-600" />
          <strong>{problem.location_count}</strong> location{problem.location_count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Link to={`/student/problems/${problem.id}`} className="btn-secondary flex-1">
          View Problem
        </Link>
        {onTake && (
          <button
            onClick={() => onTake(problem.id)}
            disabled={taking || !!status}
            className="btn-primary flex-1"
          >
            {status ? (status === "INTERESTED" ? "Taken" : status === "WORKING" ? "Working" : "Completed") : taking ? "Joining..." : "Take Problem"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;
