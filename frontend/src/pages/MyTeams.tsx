import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare } from "lucide-react";
import * as teamService from "../services/teamService";
import { Team } from "../types/team";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import TeamSolutionEditor from "../components/TeamSolutionEditor";
import TeamIndustryMessagesModal from "../components/TeamIndustryMessagesModal";

const MyTeams = () => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesTeam, setMessagesTeam] = useState<Team | null>(null);
  const [unreadByTeam, setUnreadByTeam] = useState<Record<number, number>>({});

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

  useEffect(() => {
    if (teams.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        teams.map(async (team) => {
          try {
            const convos = await teamService.getTeamIndustryConversations(team.id);
            return [team.id, convos.reduce((sum, c) => sum + c.unread_count, 0)] as const;
          } catch {
            return [team.id, 0] as const;
          }
        })
      );
      setUnreadByTeam(Object.fromEntries(entries));
    })();
  }, [teams]);

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-brand-600" />
                  <h3 className="font-semibold text-slate-900">{team.name}</h3>
                </div>
                <button
                  onClick={() => setMessagesTeam(team)}
                  className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition"
                >
                  <MessageSquare size={13} /> Industry Messages
                  {unreadByTeam[team.id] > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-brand-600 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {unreadByTeam[team.id]}
                    </span>
                  )}
                </button>
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

              <TeamSolutionEditor
                team={team}
                isMember={true}
                onSaved={(patch) => setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...patch } : t)))}
              />
            </div>
          ))}
        </div>
      )}

      {messagesTeam && (
        <TeamIndustryMessagesModal
          teamId={messagesTeam.id}
          teamName={messagesTeam.name}
          onClose={() => setMessagesTeam(null)}
          onUnreadChange={(teamId, total) => setUnreadByTeam((prev) => ({ ...prev, [teamId]: total }))}
        />
      )}
    </div>
  );
};

export default MyTeams;
