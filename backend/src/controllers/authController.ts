import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { requestOtp, verifyOtp, consumeOtp } from "../services/otpService";
import { signToken } from "../utils/jwt";
import { VALID_BRANCHES, VALID_YEARS, PublicStudent } from "../types";

const toPublicStudent = (row: any): PublicStudent => {
  const { password_hash, ...rest } = row;
  return rest;
};

// POST /api/auth/send-otp
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required.", 400);
  }

  // Do not reveal whether the email is already registered.
  await requestOtp(email);

  return res.json({
    success: true,
    message: "If this email is valid, a verification code has been sent.",
  });
});

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    college,
    branch,
    year_of_study,
    phone,
    city,
    otp,
  } = req.body;

  const required = { name, email, password, confirmPassword, college, branch, year_of_study, phone, city, otp };
  for (const [key, value] of Object.entries(required)) {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new AppError(`${key} is required.`, 400);
    }
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  if (!VALID_BRANCHES.includes(branch)) {
    throw new AppError("Invalid branch selected.", 400);
  }

  if (!VALID_YEARS.includes(year_of_study)) {
    throw new AppError("Invalid year of study selected.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP first (throws AppError on failure)
  await verifyOtp(normalizedEmail, otp);

  const { rows: existing } = await query(`SELECT id FROM students WHERE email = $1`, [normalizedEmail]);
  if (existing.length > 0) {
    // Generic message — do not reveal existence details beyond this point either
    throw new AppError("Registration could not be completed. Please try logging in instead.", 409);
  }

  const passwordHash = await hashPassword(password);

  // If this student's email domain matches a registered university's
  // verified institutional domain, link them so that university's
  // dashboard reflects this student automatically.
  const emailDomain = normalizedEmail.split("@")[1] || "";
  const { rows: matchingUniversity } = await query(`SELECT id FROM universities WHERE domain = $1`, [emailDomain]);
  const universityId = matchingUniversity.length > 0 ? matchingUniversity[0].id : null;

  const { rows } = await query(
    `INSERT INTO students (name, email, password_hash, college, branch, year_of_study, phone, city, email_verified, university_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
     RETURNING id, name, email, college, branch, year_of_study, phone, city, email_verified, university_id, created_at, updated_at`,
    [name.trim(), normalizedEmail, passwordHash, college.trim(), branch, year_of_study, phone.trim(), city.trim(), universityId]
  );

  await consumeOtp(normalizedEmail);

  return res.status(201).json({
    success: true,
    message: "Account created successfully. You can now log in.",
    student: rows[0],
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(`SELECT * FROM students WHERE email = $1`, [normalizedEmail]);

  // Same generic error whether the email doesn't exist or the password is wrong
  if (rows.length === 0) {
    throw new AppError("Invalid email or password.", 401);
  }

  const student = rows[0];
  const isMatch = await comparePassword(password, student.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken({ studentId: student.id, email: student.email });

  return res.json({
    success: true,
    token,
    student: toPublicStudent(student),
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // JWTs are stateless — logout is handled client-side by discarding the token.
  return res.json({ success: true, message: "Logged out." });
});
