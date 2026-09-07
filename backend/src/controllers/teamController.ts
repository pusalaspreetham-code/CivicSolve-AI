import { Request, Response } from "express";
import crypto from "crypto";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { notifyTeam } from "../services/teamNotificationService";

const generateInviteCode = (): string => crypto.randomBytes(4).toString("hex").toUpperCase();

const TEAM_SELECT = `
  SELECT
    t.id, t.name, t.problem_id, t.invite_code, t.created_by, t.max_members, t.created_at,
    r.problem_title, r.domain, r.severity,
    (SELECT COUNT(*)::int FROM team_members tm WHERE tm.team_id = t.id) AS member_count,
    ts.solution_text, ts.evidence_link, ts.updated_at AS solution_updated_at, ts.updated_by AS solution_updated_by
  FROM teams t
  JOIN reports r ON r.id = t.problem_id
  LEFT JOIN team_solutions ts ON ts.team_id = t.id
`;

const isMemberOfTeam = async (teamId: number | string, studentId: number): Promise<boolean> => {
  const { rows } = await query(`SELECT id FROM team_members WHERE team_id = $1 AND student_id = $2`, [teamId, studentId]);
  return rows.length > 0;
};

const getTeamMembers = async (teamId: number) => {
  const { rows } = await query(
    `SELECT tm.id, tm.role, tm.joined_at, s.id AS student_id, s.name, s.college, s.branch, s.year_of_study
     FROM team_members tm
     JOIN students s ON s.id = tm.student_id
     WHERE tm.team_id = $1
     ORDER BY tm.role ASC, tm.joined_at ASC`,
    [teamId]
  );
  return rows;
};

// POST /api/teams  { name, problemId }
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, problemId } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Team name is required.", 400);
  }
  if (!problemId) {
    throw new AppError("problemId is required.", 400);
  }

  const { rows: problemRows } = await query(
    `SELECT id FROM reports
     WHERE id = $1
       AND gov_review_status = 'GOV_APPROVED'`,
    [problemId]
  );
  if (problemRows.length === 0) {
    throw new AppError("Problem not found.", 404);
  }

  const { rows: existingTeam } = await query(
    `SELECT t.id FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.problem_id = $1 AND tm.student_id = $2`,
    [problemId, req.studentId]
  );
  if (existingTeam.length > 0) {
    throw new AppError("You are already part of a team for this problem.", 409);
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { rows: clash } = await query(`SELECT id FROM teams WHERE invite_code = $1`, [inviteCode]);
    if (clash.length === 0) break;
    inviteCode = generateInviteCode();
  }

  const { rows } = await query(
    `INSERT INTO teams (name, problem_id, invite_code, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, problem_id, invite_code, created_by, max_members, created_at`,
    [name.trim(), problemId, inviteCode, req.studentId]
  );

  const team = rows[0];

  await query(
    `INSERT INTO team_members (team_id, student_id, role) VALUES ($1, $2, 'LEADER')`,
    [team.id, req.studentId]
  );

  return res.status(201).json({
    success: true,
    message: "Team created. Share the invite code with teammates.",
    team,
  });
});

// POST /api/teams/join  { inviteCode }
export const joinTeam = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  if (!inviteCode || typeof inviteCode !== "string" || !inviteCode.trim()) {
    throw new AppError("Invite code is required.", 400);
  }

  const { rows: teamRows } = await query(`${TEAM_SELECT} WHERE t.invite_code = $1`, [inviteCode.trim().toUpperCase()]);
  if (teamRows.length === 0) {
    throw new AppError("Invalid invite code.", 404);
  }
  const team = teamRows[0];

  if (team.member_count >= team.max_members) {
    throw new AppError("This team is already full.", 409);
  }

  const { rows: existing } = await query(
    `SELECT id FROM team_members WHERE team_id = $1 AND student_id = $2`,
    [team.id, req.studentId]
  );
  if (existing.length > 0) {
    return res.json({ success: true, alreadyMember: true, message: "You are already in this team.", team });
  }

  const { rows: existingOtherTeam } = await query(
    `SELECT t.id FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.problem_id = $1 AND tm.student_id = $2`,
    [team.problem_id, req.studentId]
  );
  if (existingOtherTeam.length > 0) {
    throw new AppError("You are already part of a different team for this problem.", 409);
  }

  await query(`INSERT INTO team_members (team_id, student_id, role) VALUES ($1, $2, 'MEMBER')`, [team.id, req.studentId]);

  await notifyTeam({
    teamId: team.id,
    actorStudentId: req.studentId as number,
    actionSummary: "joined the team",
  });

  return res.status(201).json({ success: true, alreadyMember: false, message: `You joined "${team.name}".`, team });
});

// GET /api/teams/mine
export const getMyTeams = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `${TEAM_SELECT}
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.student_id = $1
     ORDER BY t.created_at DESC`,
    [req.studentId]
  );

  const teamsWithMembers = await Promise.all(
    rows.map(async (team: any) => ({ ...team, members: await getTeamMembers(team.id) }))
  );

  return res.json({ success: true, teams: teamsWithMembers });
});

// GET /api/teams/problem/:problemId
export const getTeamsForProblem = asyncHandler(async (req: Request, res: Response) => {
  const { problemId } = req.params;
  const { rows } = await query(
    `${TEAM_SELECT}
     WHERE t.problem_id = $1
       AND r.gov_review_status = 'GOV_APPROVED'
     ORDER BY t.created_at DESC`,
    [problemId]
  );

  const teamsWithMembers = await Promise.all(
    rows.map(async (team: any) => ({ ...team, members: await getTeamMembers(team.id) }))
  );

  return res.json({ success: true, teams: teamsWithMembers });
});

// DELETE /api/teams/:id/leave
export const leaveTeam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { rows: memberRow } = await query(
    `SELECT role FROM team_members WHERE team_id = $1 AND student_id = $2`,
    [id, req.studentId]
  );
  if (memberRow.length === 0) {
    throw new AppError("You are not a member of this team.", 404);
  }

  if (memberRow[0].role === "LEADER") {
    const { rows: memberCount } = await query(`SELECT COUNT(*)::int AS count FROM team_members WHERE team_id = $1`, [id]);
    if (memberCount[0].count > 1) {
      throw new AppError("Transfer leadership or ask remaining members to leave before deleting this team.", 409);
    }
    await query(`DELETE FROM teams WHERE id = $1`, [id]);
    return res.json({ success: true, message: "Team disbanded." });
  }

  await query(`DELETE FROM team_members WHERE team_id = $1 AND student_id = $2`, [id, req.studentId]);
  return res.json({ success: true, message: "You left the team." });
});

// ------------------------------------------------------------
// SOLUTION EVIDENCE
// One shared solution + evidence link per team. Any team member
// can create or update it — there is no review/approval step.
// ------------------------------------------------------------

const isValidLink = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// GET /api/teams/:id/solution
export const getTeamSolution = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT ts.*, s.name AS updated_by_name
     FROM team_solutions ts
     LEFT JOIN students s ON s.id = ts.updated_by
     WHERE ts.team_id = $1`,
    [id]
  );
  return res.json({ success: true, solution: rows[0] || null });
});

// PUT /api/teams/:id/solution   { solutionText, evidenceLink }
export const upsertTeamSolution = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { solutionText, evidenceLink } = req.body;
  const studentId = req.studentId as number;

  if (!(await isMemberOfTeam(id, studentId))) {
    throw new AppError("Only members of this team can submit its solution.", 403);
  }

  if (typeof solutionText !== "string" || solutionText.trim().length < 10) {
    throw new AppError("Please describe the solution in at least 10 characters.", 400);
  }

  const trimmedLink = typeof evidenceLink === "string" ? evidenceLink.trim() : "";
  if (trimmedLink && !isValidLink(trimmedLink)) {
    throw new AppError("Evidence link must be a valid http(s) URL.", 400);
  }

  const { rows: existingRows } = await query(`SELECT solution_text, evidence_link FROM team_solutions WHERE team_id = $1`, [id]);
  const existing = existingRows[0];

  let actionSummary: string;
  if (!existing) {
    actionSummary = "added a new solution";
  } else {
    const descChanged = existing.solution_text !== solutionText.trim();
    const evidenceChanged = (existing.evidence_link || "") !== trimmedLink;
    if (descChanged && evidenceChanged) actionSummary = "updated the solution and evidence link";
    else if (evidenceChanged) actionSummary = existing.evidence_link ? "updated the solution evidence link" : "added a solution evidence link";
    else actionSummary = "updated the solution";
  }

  const { rows } = await query(
    `INSERT INTO team_solutions (team_id, solution_text, evidence_link, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT (team_id) DO UPDATE
       SET solution_text = EXCLUDED.solution_text,
           evidence_link = EXCLUDED.evidence_link,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [id, solutionText.trim(), trimmedLink || null, studentId]
  );

  await notifyTeam({
    teamId: Number(id),
    actorStudentId: studentId,
    actionSummary,
    detail: solutionText.trim(),
    evidenceLink: trimmedLink || null,
  });

  return res.json({ success: true, message: "Solution saved and teammates notified by email.", solution: rows[0] });
});
