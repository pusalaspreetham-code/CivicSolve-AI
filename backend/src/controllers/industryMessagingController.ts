import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { sendIndustryTeamMessageEmail } from "../services/emailService";

// A conversation only exists once this industry has adopted the
// problem that the team is working on (teams can't message an
// industry that never adopted their problem, and vice versa).
const assertIndustryCanMessageTeam = async (industryId: number, teamId: string | number) => {
  const { rows } = await query(
    `SELECT t.id AS team_id, t.name AS team_name, t.problem_id, r.problem_title
     FROM teams t
     JOIN reports r ON r.id = t.problem_id
     WHERE t.id = $1`,
    [teamId]
  );
  if (rows.length === 0) throw new AppError("Team not found.", 404);
  const team = rows[0];

  const { rows: adoptionRows } = await query(
    `SELECT id FROM industry_problem_adoptions WHERE industry_id = $1 AND problem_id = $2`,
    [industryId, team.problem_id]
  );
  if (adoptionRows.length === 0) {
    throw new AppError("You can only message teams working on a problem your company has adopted.", 403);
  }

  return team;
};

// GET /api/industry/messages
// One row per team the industry has an open conversation "surface"
// with — i.e. every team working on a problem this industry has
// adopted — with the latest message preview and unread count.
export const listIndustryConversations = asyncHandler(async (req: Request, res: Response) => {
  const industryId = req.industryId as number;

  const { rows } = await query(
    `SELECT
       t.id AS team_id,
       t.name AS team_name,
       r.id AS problem_id,
       r.problem_title,
       COUNT(tm.id)::int AS member_count,
       lm.message AS last_message,
       lm.sender_type AS last_sender_type,
       lm.created_at AS last_message_at,
       COALESCE(unread.count, 0)::int AS unread_count
     FROM industry_problem_adoptions ipa
     JOIN reports r ON r.id = ipa.problem_id
     JOIN teams t ON t.problem_id = r.id
     LEFT JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN LATERAL (
       SELECT message, sender_type, created_at
       FROM industry_team_messages
       WHERE industry_id = ipa.industry_id AND team_id = t.id
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON TRUE
     LEFT JOIN (
       SELECT team_id, COUNT(*)::int AS count
       FROM industry_team_messages
       WHERE industry_id = $1 AND is_read_by_industry = FALSE AND sender_type = 'STUDENT'
       GROUP BY team_id
     ) unread ON unread.team_id = t.id
     WHERE ipa.industry_id = $1
     GROUP BY t.id, t.name, r.id, r.problem_title, lm.message, lm.sender_type, lm.created_at, unread.count
     ORDER BY lm.created_at DESC NULLS LAST, t.created_at DESC`,
    [industryId]
  );

  return res.json({ success: true, conversations: rows });
});

// GET /api/industry/messages/:teamId
export const getIndustryTeamMessages = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const industryId = req.industryId as number;

  const team = await assertIndustryCanMessageTeam(industryId, teamId);

  const { rows: messages } = await query(
    `SELECT m.id, m.sender_type, m.message, m.created_at, s.name AS sender_student_name
     FROM industry_team_messages m
     LEFT JOIN students s ON s.id = m.sender_student_id
     WHERE m.industry_id = $1 AND m.team_id = $2
     ORDER BY m.created_at ASC`,
    [industryId, teamId]
  );

  await query(
    `UPDATE industry_team_messages SET is_read_by_industry = TRUE
     WHERE industry_id = $1 AND team_id = $2 AND is_read_by_industry = FALSE`,
    [industryId, teamId]
  );

  return res.json({
    success: true,
    team: { id: team.team_id, name: team.team_name, problem_id: team.problem_id, problem_title: team.problem_title },
    messages,
  });
});

// POST /api/industry/messages/:teamId  { message }
export const sendIndustryTeamMessage = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const industryId = req.industryId as number;
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new AppError("Message cannot be empty.", 400);
  }
  if (message.trim().length > 2000) {
    throw new AppError("Message is too long (max 2000 characters).", 400);
  }

  const team = await assertIndustryCanMessageTeam(industryId, teamId);

  const { rows } = await query(
    `INSERT INTO industry_team_messages (industry_id, team_id, problem_id, sender_type, message, is_read_by_industry, is_read_by_team)
     VALUES ($1, $2, $3, 'INDUSTRY', $4, TRUE, FALSE)
     RETURNING id, sender_type, message, created_at`,
    [industryId, teamId, team.problem_id, message.trim()]
  );

  // Notify every team member by email — this is how students find
  // out about industry updates outside of actively checking the app.
  try {
    const { rows: indRows } = await query(`SELECT company_name FROM industries WHERE id = $1`, [industryId]);
    const { rows: memberRows } = await query(
      `SELECT s.email FROM team_members tm JOIN students s ON s.id = tm.student_id WHERE tm.team_id = $1`,
      [teamId]
    );
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const teamsUrl = `${clientUrl}/student/my-teams`;

    await Promise.all(
      memberRows.map((m: { email: string }) =>
        sendIndustryTeamMessageEmail({
          toEmail: m.email,
          companyName: indRows[0]?.company_name || "An industry partner",
          teamName: team.team_name,
          problemTitle: team.problem_title,
          message: message.trim(),
          teamsUrl,
        }).catch((err) => console.error("[industryMessagingController] Failed to email team member:", err))
      )
    );
  } catch (err) {
    console.error("[industryMessagingController] Notification dispatch failed:", err);
  }

  return res.status(201).json({ success: true, message: rows[0] });
});
