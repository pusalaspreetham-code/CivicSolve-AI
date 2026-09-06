import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// GET /api/university/faculty
export const getUniversityFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(
    `SELECT id, university_id, name, email, department, expertise, created_at, updated_at
     FROM faculties WHERE university_id = $1 ORDER BY created_at DESC`,
    [req.universityId]
  );
  return res.json({ success: true, faculty: rows });
});

// POST /api/university/faculty   { name, email, department, expertise }
export const addUniversityFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, department, expertise } = req.body;

  if (!name || !String(name).trim()) throw new AppError("Faculty name is required.", 400);
  if (!email || !isValidEmail(String(email).trim())) throw new AppError("A valid faculty email is required.", 400);
  if (!department || !String(department).trim()) throw new AppError("Department/field is required.", 400);
  if (!expertise || !String(expertise).trim()) throw new AppError("Area of expertise is required.", 400);

  const { rows: existing } = await query(
    `SELECT id FROM faculties WHERE university_id = $1 AND email = $2`,
    [req.universityId, String(email).trim().toLowerCase()]
  );
  if (existing.length > 0) throw new AppError("A faculty member with this email already exists.", 409);

  const { rows } = await query(
    `INSERT INTO faculties (university_id, name, email, department, expertise)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, university_id, name, email, department, expertise, created_at, updated_at`,
    [req.universityId, String(name).trim(), String(email).trim().toLowerCase(), String(department).trim(), String(expertise).trim()]
  );

  return res.status(201).json({ success: true, message: "Faculty member added.", faculty: rows[0] });
});

// PUT /api/university/faculty/:id   { name, department, expertise, email }
export const updateUniversityFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, department, expertise } = req.body;

  if (email && !isValidEmail(String(email).trim())) throw new AppError("A valid faculty email is required.", 400);

  const { rows } = await query(
    `UPDATE faculties
     SET name = COALESCE(NULLIF($1, ''), name),
         email = COALESCE(NULLIF($2, ''), email),
         department = COALESCE(NULLIF($3, ''), department),
         expertise = COALESCE(NULLIF($4, ''), expertise),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND university_id = $6
     RETURNING id, university_id, name, email, department, expertise, created_at, updated_at`,
    [name, email ? String(email).trim().toLowerCase() : "", department, expertise, id, req.universityId]
  );

  if (rows.length === 0) throw new AppError("Faculty member not found.", 404);
  return res.json({ success: true, faculty: rows[0] });
});

// DELETE /api/university/faculty/:id
export const deleteUniversityFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await query(`DELETE FROM faculties WHERE id = $1 AND university_id = $2 RETURNING id`, [
    req.params.id,
    req.universityId,
  ]);
  if (rows.length === 0) throw new AppError("Faculty member not found.", 404);
  return res.json({ success: true, message: "Faculty member removed." });
});
