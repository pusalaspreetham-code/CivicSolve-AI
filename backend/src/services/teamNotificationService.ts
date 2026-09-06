import { query } from "../config/database";
import { sendTeamActivityEmail } from "./emailService";

interface NotifyTeamParams {
  teamId: number;
  actorStudentId: number;
  actionSummary: string; // e.g. "joined the team", "added a new solution"
  detail?: string | null;
  evidenceLink?: string | null;
}

// Emails every member of a team about an important activity.
// Never throws — a failed/misconfigured email service must not
// break the underlying action (join team, save solution, etc.).
export const notifyTeam = async ({ teamId, actorStudentId, actionSummary, detail, evidenceLink }: NotifyTeamParams): Promise<void> => {
  try {
    const { rows: teamRows } = await query(
      `SELECT t.id, t.name AS team_name, t.problem_id, r.problem_title
       FROM teams t
       JOIN reports r ON r.id = t.problem_id
       WHERE t.id = $1`,
      [teamId]
    );
    if (teamRows.length === 0) return;
    const { team_name, problem_id, problem_title } = teamRows[0];

    const { rows: actorRows } = await query(`SELECT name FROM students WHERE id = $1`, [actorStudentId]);
    const actorName = actorRows[0]?.name || "A team member";

    const { rows: memberRows } = await query(
      `SELECT s.email FROM team_members tm JOIN students s ON s.id = tm.student_id WHERE tm.team_id = $1`,
      [teamId]
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const problemUrl = `${clientUrl}/student/problems/${problem_id}`;

    await Promise.all(
      memberRows.map((m: { email: string }) =>
        sendTeamActivityEmail({
          toEmail: m.email,
          teamName: team_name,
          problemTitle: problem_title,
          actorName,
          actionSummary,
          detail: detail || null,
          evidenceLink: evidenceLink || null,
          problemUrl,
        }).catch((err) => console.error(`[teamNotificationService] Failed to email ${m.email}:`, err))
      )
    );
  } catch (err) {
    console.error("[teamNotificationService] notifyTeam failed:", err);
  }
};
