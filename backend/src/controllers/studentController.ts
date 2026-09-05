import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { comparePassword, hashPassword } from "../utils/password";
import { VALID_YEARS } from "../types";

// GET /api/students/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, name, email, college, branch, year_of_study, phone, city, email_verified, university_id, created_at, updated_at
     FROM students WHERE id = $1`,
    [req.studentId]
  );

  if (rows.length === 0) {
    throw new AppError("Student not found.", 404);
  }

  return res.json({ success: true, student: rows[0] });
});

// PUT /api/students/me
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, college, year_of_study, phone, city } = req.body;

  if (year_of_study && !VALID_YEARS.includes(year_of_study)) {
    throw new AppError("Invalid year of study selected.", 400);
  }

  const { rows } = await query(
    `UPDATE students
     SET name = COALESCE(NULLIF($1, ''), name),
         college = COALESCE(NULLIF($2, ''), college),
         year_of_study = COALESCE(NULLIF($3, ''), year_of_study),
         phone = COALESCE(NULLIF($4, ''), phone),
         city = COALESCE(NULLIF($5, ''), city),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, name, email, college, branch, year_of_study, phone, city, email_verified, created_at, updated_at`,
    [name, college, year_of_study, phone, city, req.studentId]
  );

  if (rows.length === 0) {
    throw new AppError("Student not found.", 404);
  }

  return res.json({ success: true, student: rows[0] });
});

// PUT /api/students/change-password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError("All password fields are required.", 400);
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError("New passwords do not match.", 400);
  }

  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long.", 400);
  }

  const { rows } = await query(`SELECT password_hash FROM students WHERE id = $1`, [req.studentId]);
  if (rows.length === 0) {
    throw new AppError("Student not found.", 404);
  }

  const isMatch = await comparePassword(currentPassword, rows[0].password_hash);
  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 401);
  }

  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE students SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newHash, req.studentId]
  );

  return res.json({ success: true, message: "Password updated successfully." });
});
