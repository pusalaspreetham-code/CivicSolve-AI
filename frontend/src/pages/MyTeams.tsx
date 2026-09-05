import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import * as teamService from "../services/teamService";
import { Team } from "../types/team";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const MyTeams = () => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setTeams(await teamService.getMyTeams());
      } catch (err: any) {
        showToast(err.message || "Could not load your teams.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading label="Loading your teams..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Teams</h1>
        <p className="text-slate-500 mt-1">Teams you've created or joined to collaborate on civic problems.</p>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="You're not part of a team yet"
          description="Open any problem's detail page to create a team or join one with an invite code."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-600" />
                <h3 className="font-semibold text-slate-900">{team.name}</h3>
              </div>
              <p className="text-sm text-slate-500">
                Working on{" "}
                <Link to={`/student/problems/${team.problem_id}`} className="text-brand-600 font-medium">
                  {team.problem_title}
                </Link>{" "}
                (ID #{team.problem_id})
              </p>
              <p className="text-xs text-slate-500">
                {team.member_count}/{team.max_members} members &middot; Invite code:{" "}
                <span className="font-mono font-semibold text-slate-700">{team.invite_code}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {team.members.map((m) => (
                  <span key={m.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {m.name}
                    {m.student_id === student?.id ? " (You)" : ""}
                    {m.role === "LEADER" ? " · Leader" : ""}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
