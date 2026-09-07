import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { sendTeamMessageToIndustryEmail } from "../services/emailService";

const assertTeamMembership = async (teamId: string | number, studentId: number) => {
  const { rows } = await query(
    `SELECT t.id AS team_id, t.name AS team_name, t.problem_id, r.problem_title
     FROM teams t
     JOIN reports r ON r.id = t.problem_id
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.id = $1 AND tm.student_id = $2`,
    [teamId, studentId]
  );
  if (rows.length === 0) {
    throw new AppError("You must be a member of this team to view or send its industry messages.", 403);
  }
  return rows[0];
};

const assertIndustryAdoptedProblem = async (industryId: string | number, problemId: number) => {
  const { rows } = await query(
    `SELECT ind.id, ind.company_name FROM industry_problem_adoptions ipa
     JOIN industries ind ON ind.id = ipa.industry_id
     WHERE ipa.industry_id = $1 AND ipa.problem_id = $2`,
    [industryId, problemId]
  );
  if (rows.length === 0) {
    throw new AppError("This company has not adopted your team's problem.", 404);
  }
  return rows[0];
};

// GET /api/teams/:teamId/industry-conversations
// Every industry that adopted this team's problem, with a message
// preview and unread count — this is the "who can I talk to" list.
export const listTeamIndustryConversations = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const studentId = req.studentId as number;

  const team = await assertTeamMembership(teamId, studentId);

  const { rows } = await query(
    `SELECT
       ind.id AS industry_id,
       ind.company_name,
       ind.sector,
       ipa.status AS adoption_status,
       lm.message AS last_message,
       lm.sender_type AS last_sender_type,
       lm.created_at AS last_message_at,
       COALESCE(unread.count, 0)::int AS unread_count
     FROM industry_problem_adoptions ipa
     JOIN industries ind ON ind.id = ipa.industry_id
     LEFT JOIN LATERAL (
       SELECT message, sender_type, created_at
       FROM industry_team_messages
       WHERE industry_id = ipa.industry_id AND team_id = $1
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON TRUE
     LEFT JOIN (
       SELECT industry_id, COUNT(*)::int AS count
       FROM industry_team_messages
       WHERE team_id = $1 AND is_read_by_team = FALSE AND sender_type = 'INDUSTRY'
       GROUP BY industry_id
     ) unread ON unread.industry_id = ind.id
     WHERE ipa.problem_id = $2
     ORDER BY lm.created_at DESC NULLS LAST, ind.company_name ASC`,
    [teamId, team.problem_id]
  );

  return res.json({ success: true, conversations: rows });
});

// GET /api/teams/:teamId/industry-conversations/:industryId
export const getTeamIndustryMessages = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, industryId } = req.params;
  const studentId = req.studentId as number;

  const team = await assertTeamMembership(teamId, studentId);
  const industry = await assertIndustryAdoptedProblem(industryId, team.problem_id);

  const { rows: messages } = await query(
    `SELECT m.id, m.sender_type, m.message, m.created_at, s.name AS sender_student_name
     FROM industry_team_messages m
     LEFT JOIN students s ON s.id = m.sender_student_id
     WHERE m.industry_id = $1 AND m.team_id = $2
     ORDER BY m.created_at ASC`,
    [industryId, teamId]
  );

  await query(
    `UPDATE industry_team_messages SET is_read_by_team = TRUE
     WHERE industry_id = $1 AND team_id = $2 AND is_read_by_team = FALSE`,
    [industryId, teamId]
  );

  return res.json({
    success: true,
    industry: { id: industry.id, company_name: industry.company_name },
    messages,
  });
});

// POST /api/teams/:teamId/industry-conversations/:industryId  { message }
export const sendTeamIndustryMessage = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, industryId } = req.params;
  const studentId = req.studentId as number;
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new AppError("Message cannot be empty.", 400);
  }
  if (message.trim().length > 2000) {
    throw new AppError("Message is too long (max 2000 characters).", 400);
  }

  const team = await assertTeamMembership(teamId, studentId);
  const industry = await assertIndustryAdoptedProblem(industryId, team.problem_id);

  const { rows } = await query(
    `INSERT INTO industry_team_messages (industry_id, team_id, problem_id, sender_type, sender_student_id, message, is_read_by_industry, is_read_by_team)
     VALUES ($1, $2, $3, 'STUDENT', $4, $5, FALSE, TRUE)
     RETURNING id, sender_type, message, created_at`,
    [industryId, teamId, team.problem_id, studentId, message.trim()]
  );

  try {
    const { rows: studentRows } = await query(`SELECT name FROM students WHERE id = $1`, [studentId]);
    const { rows: indRows } = await query(`SELECT email FROM industries WHERE id = $1`, [industryId]);
    if (indRows[0]?.email) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const industryUrl = `${clientUrl}/industry/problems/${team.problem_id}`;
      await sendTeamMessageToIndustryEmail({
        toEmail: indRows[0].email,
        studentName: studentRows[0]?.name || "A student",
        teamName: team.team_name,
        problemTitle: team.problem_title,
        message: message.trim(),
        industryUrl,
      }).catch((err) => console.error("[teamMessagingController] Failed to email industry:", err));
    }
  } catch (err) {
    console.error("[teamMessagingController] Notification dispatch failed:", err);
  }

  return res.status(201).json({ success: true, message: rows[0] });
});
