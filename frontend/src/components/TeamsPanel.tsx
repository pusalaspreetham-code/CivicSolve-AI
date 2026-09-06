import { useEffect, useState } from "react";
import { Users, Loader2, KeyRound, Plus } from "lucide-react";
import * as teamService from "../services/teamService";
import { Team } from "../types/team";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import TeamSolutionEditor from "./TeamSolutionEditor";

interface Props {
  problemId: number;
}

const TeamsPanel = ({ problemId }: Props) => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const load = async () => {
    try {
      const data = await teamService.getTeamsForProblem(problemId);
      setTeams(data);
    } catch (err: any) {
      showToast(err.message || "Could not load teams.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const myTeam = teams.find((t) => t.members.some((m) => m.student_id === student?.id));

  const handleCreate = async () => {
    if (!teamName.trim()) return showToast("Enter a team name.", "error");
    setCreating(true);
    try {
      await teamService.createTeam(teamName.trim(), problemId);
      showToast("Team created! Share the invite code with teammates.", "success");
      setTeamName("");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not create team.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return showToast("Enter an invite code.", "error");
    setJoining(true);
    try {
      const res = await teamService.joinTeam(inviteCode.trim());
      showToast(res.message, res.alreadyMember ? "info" : "success");
      setInviteCode("");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not join team.", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (teamId: number) => {
    try {
      await teamService.leaveTeam(teamId);
      showToast("Left team.", "success");
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not leave team.", "error");
    }
  };

  if (loading) return null;

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-brand-600" />
        <h2 className="text-lg font-semibold text-slate-900">Teams working on this problem</h2>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-slate-500">No team has formed for this problem yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{team.name}</p>
                  <p className="text-xs text-slate-500">
                    {team.member_count}/{team.max_members} members
                    {team.members.some((m) => m.student_id === student?.id) && (
                      <span className="ml-2 font-mono text-brand-600">Code: {team.invite_code}</span>
                    )}
                  </p>
                </div>
                {team.members.some((m) => m.student_id === student?.id) && (
                  <button onClick={() => handleLeave(team.id)} className="btn-secondary text-xs px-2 py-1">
                    Leave
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team.members.map((m) => (
                  <span key={m.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {m.name} {m.role === "LEADER" ? "(Leader)" : ""}
                  </span>
                ))}
              </div>

              <TeamSolutionEditor
                team={team}
                isMember={team.members.some((m) => m.student_id === student?.id)}
                onSaved={(patch) => setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...patch } : t)))}
              />
            </div>
          ))}
        </div>
      )}

      {!myTeam && (
        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="New team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <button onClick={handleCreate} disabled={creating} className="btn-primary shrink-0 px-3">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Have an invite code?"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
            <button onClick={handleJoin} disabled={joining} className="btn-secondary shrink-0 px-3">
              {joining ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default TeamsPanel;
