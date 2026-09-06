import { useState } from "react";
import { FileText, Link2, Pencil, Loader2, ExternalLink } from "lucide-react";
import * as teamService from "../services/teamService";
import { Team } from "../types/team";
import { useToast } from "../context/ToastContext";

interface Props {
  team: Team;
  isMember: boolean;
  onSaved: (updatedTeam: Partial<Team>) => void;
}

const TeamSolutionEditor = ({ team, isMember, onSaved }: Props) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [solutionText, setSolutionText] = useState(team.solution_text || "");
  const [evidenceLink, setEvidenceLink] = useState(team.evidence_link || "");

  const hasSolution = !!team.solution_text;

  const handleSave = async () => {
    if (solutionText.trim().length < 10) {
      showToast("Describe the solution in at least 10 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await teamService.saveTeamSolution(team.id, solutionText.trim(), evidenceLink.trim());
      showToast(res.message || "Solution saved.", "success");
      setEditing(false);
      onSaved({
        solution_text: res.solution.solution_text,
        evidence_link: res.solution.evidence_link,
        solution_updated_at: res.solution.updated_at,
      });
    } catch (err: any) {
      showToast(err.message || "Could not save solution.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <FileText size={14} className="text-brand-600" />
          Solution &amp; Evidence
        </div>
        {isMember && !editing && (
          <button
            onClick={() => {
              setSolutionText(team.solution_text || "");
              setEvidenceLink(team.evidence_link || "");
              setEditing(true);
            }}
            className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:underline"
          >
            <Pencil size={12} />
            {hasSolution ? "Update" : "Add solution"}
          </button>
        )}
      </div>

      {!editing && hasSolution && (
        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-950">
          <p className="whitespace-pre-wrap">{team.solution_text}</p>
          {team.evidence_link && (
            <a
              href={team.evidence_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
            >
              <ExternalLink size={12} /> View evidence / resource
            </a>
          )}
          {team.solution_updated_at && (
            <p className="text-xs text-emerald-700/70 mt-1.5">
              Last updated {new Date(team.solution_updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {!editing && !hasSolution && (
        <p className="mt-2 text-sm text-slate-500">
          {isMember ? "No solution submitted yet — add one above." : "No solution submitted yet."}
        </p>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <div>
            <label className="label text-xs">Solution / Problem Description</label>
            <textarea
              className="input min-h-[90px]"
              placeholder="Describe how your team is solving this problem..."
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-xs flex items-center gap-1">
              <Link2 size={12} /> Evidence / Resource Link (optional)
            </label>
            <input
              className="input"
              placeholder="Google Drive, GitHub, demo link, PDF, video, etc."
              value={evidenceLink}
              onChange={(e) => setEvidenceLink(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
            </button>
            <button onClick={() => setEditing(false)} disabled={saving} className="btn-secondary text-xs px-3 py-1.5">
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Every teammate will get an email whenever the solution or evidence link is added or updated.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamSolutionEditor;
