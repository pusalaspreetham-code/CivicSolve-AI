import { Request, Response } from "express";
import crypto from "crypto";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { sendFacultyGuidanceRequestEmail, sendGuidanceResponseEmail } from "../services/emailService";

const apiBaseUrl = (): string => process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// GET /api/students/faculty
// Faculty from the student's own university (or, if the student's
// email domain isn't linked to any university yet, every faculty
// member on the platform so the feature still works for them).
export const listFacultyForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { rows: studentRows } = await query(`SELECT university_id FROM students WHERE id = $1`, [req.studentId]);
  if (studentRows.length === 0) throw new AppError("Student not found.", 404);
  const universityId = studentRows[0].university_id;

  const { rows } = await query(
    `SELECT f.id, f.name, f.email, f.department, f.expertise, f.created_at, u.name AS university_name
     FROM faculties f
     JOIN universities u ON u.id = f.university_id
     WHERE $1::int IS NULL OR f.university_id = $1
     ORDER BY f.name ASC`,
    [universityId]
  );

  return res.json({ success: true, faculty: rows });
});

// POST /api/students/faculty/guidance-requests   { facultyId, problemId, message }
export const requestFacultyGuidance = asyncHandler(async (req: Request, res: Response) => {
  const { facultyId, problemId, message } = req.body;
  const studentId = req.studentId as number;

  if (!facultyId) throw new AppError("Please select a faculty member.", 400);
  if (!problemId) throw new AppError("Please select the problem you want guidance for.", 400);

  const { rows: facultyRows } = await query(`SELECT id, name, email FROM faculties WHERE id = $1`, [facultyId]);
  if (facultyRows.length === 0) throw new AppError("Faculty member not found.", 404);
  const faculty = facultyRows[0];

  const { rows: problemRows } = await query(`SELECT id, problem_title FROM reports WHERE id = $1`, [problemId]);
  if (problemRows.length === 0) throw new AppError("Problem not found.", 404);
  const problem = problemRows[0];

  const { rows: studentRows } = await query(`SELECT name, email FROM students WHERE id = $1`, [studentId]);
  const student = studentRows[0];

  const { rows: existing } = await query(
    `SELECT id FROM faculty_guidance_requests
     WHERE student_id = $1 AND faculty_id = $2 AND problem_id = $3 AND status IN ('PENDING', 'ACCEPTED')`,
    [studentId, facultyId, problemId]
  );
  if (existing.length > 0) {
    throw new AppError("You already have an active guidance request with this faculty member for this problem.", 409);
  }

  // Optional: link the student's team for this problem, if any, so the
  // faculty email shows team context.
  const { rows: teamRows } = await query(
    `SELECT t.id, t.name FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.problem_id = $1 AND tm.student_id = $2`,
    [problemId, studentId]
  );
  const team = teamRows[0] || null;

  const responseToken = crypto.randomBytes(24).toString("hex");

  const { rows } = await query(
    `INSERT INTO faculty_guidance_requests (student_id, faculty_id, problem_id, team_id, message, response_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, student_id, faculty_id, problem_id, team_id, message, status, requested_at, responded_at`,
    [studentId, facultyId, problemId, team?.id || null, typeof message === "string" ? message.trim() : null, responseToken]
  );

  const acceptUrl = `${apiBaseUrl()}/api/guidance/respond?token=${responseToken}&action=accept`;
  const denyUrl = `${apiBaseUrl()}/api/guidance/respond?token=${responseToken}&action=deny`;

  try {
    await sendFacultyGuidanceRequestEmail({
      facultyEmail: faculty.email,
      facultyName: faculty.name,
      studentName: student.name,
      studentEmail: student.email,
      problemTitle: problem.problem_title,
      teamName: team?.name || null,
      message: typeof message === "string" ? message.trim() : null,
      acceptUrl,
      denyUrl,
    });
  } catch (err) {
    console.error("[facultyGuidanceController] Failed to email faculty:", err);
  }

  return res.status(201).json({
    success: true,
    message: `Guidance request sent to ${faculty.name}. You'll be notified once they respond.`,
    request: rows[0],
  });
});

// GET /api/students/faculty/guidance-requests
export const getMyGuidanceRequests = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT
       g.id, g.status, g.message, g.requested_at, g.responded_at,
       f.id AS faculty_id, f.name AS faculty_name, f.email AS faculty_email, f.department, f.expertise,
       r.id AS problem_id, r.problem_title,
       t.id AS team_id, t.name AS team_name
     FROM faculty_guidance_requests g
     JOIN faculties f ON f.id = g.faculty_id
     JOIN reports r ON r.id = g.problem_id
     LEFT JOIN teams t ON t.id = g.team_id
     WHERE g.student_id = $1
     ORDER BY g.requested_at DESC`,
    [req.studentId]
  );
  return res.json({ success: true, requests: rows });
});

// GET /api/guidance/respond?token=...&action=accept|deny
// PUBLIC — no login. This is the link the faculty member clicks
// directly from their email.
export const respondToGuidanceRequest = asyncHandler(async (req: Request, res: Response) => {
  const { token, action } = req.query;

  const renderPage = (title: string, message: string, tone: "success" | "error" | "info") => {
    const color = tone === "success" ? "#0f766e" : tone === "error" ? "#b91c1c" : "#334155";
    res.status(tone === "error" ? 400 : 200).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><title>CivicSolve AI</title></head>
        <body style="font-family: Arial, sans-serif; background:#f8fafc; padding:48px 16px; text-align:center;">
          <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color:${color};margin-top:0;">${title}</h2>
            <p style="color:#475569;">${message}</p>
          </div>
        </body>
      </html>
    `);
  };

  if (typeof token !== "string" || (action !== "accept" && action !== "deny")) {
    return renderPage("Invalid link", "This guidance response link is invalid or incomplete.", "error");
  }

  const { rows } = await query(
    `SELECT g.id, g.status, g.student_id, g.problem_id, f.name AS faculty_name, r.problem_title, s.email AS student_email
     FROM faculty_guidance_requests g
     JOIN faculties f ON f.id = g.faculty_id
     JOIN reports r ON r.id = g.problem_id
     JOIN students s ON s.id = g.student_id
     WHERE g.response_token = $1`,
    [token]
  );

  if (rows.length === 0) {
    return renderPage("Link not found", "This guidance request could not be found. It may have been removed.", "error");
  }

  const reqRow = rows[0];

  if (reqRow.status !== "PENDING") {
    return renderPage(
      "Already responded",
      `This request was already marked as ${reqRow.status.toLowerCase()}. No further action is needed.`,
      "info"
    );
  }

  const newStatus = action === "accept" ? "ACCEPTED" : "DENIED";

  await query(`UPDATE faculty_guidance_requests SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2`, [
    newStatus,
    reqRow.id,
  ]);

  try {
    await sendGuidanceResponseEmail({
      studentEmail: reqRow.student_email,
      facultyName: reqRow.faculty_name,
      problemTitle: reqRow.problem_title,
      status: newStatus,
    });
  } catch (err) {
    console.error("[facultyGuidanceController] Failed to email student of response:", err);
  }

  return renderPage(
    newStatus === "ACCEPTED" ? "Request accepted" : "Request declined",
    newStatus === "ACCEPTED"
      ? `Thank you! The student has been notified that you accepted their guidance request for "${reqRow.problem_title}".`
      : `The student has been notified that you're unable to take on this request for "${reqRow.problem_title}".`,
    newStatus === "ACCEPTED" ? "success" : "info"
  );
});
