import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import {
  requestUniversityOtp,
  verifyUniversityOtp,
  consumeUniversityOtp,
} from "../services/universityOtpService";
import { signUniversityToken } from "../utils/jwt";
import { PublicUniversity } from "../types";

// Official Indian university/college institutional email suffix.
const REQUIRED_EMAIL_SUFFIX = ".edu.in";

const toPublicUniversity = (row: any): PublicUniversity => {
  const { password_hash, ...rest } = row;
  return rest;
};

const assertEduInEmail = (email: string) => {
  const normalized = email.toLowerCase().trim();
  if (!normalized.endsWith(REQUIRED_EMAIL_SUFFIX)) {
    throw new AppError(
      `University email must be an official institutional address ending in "${REQUIRED_EMAIL_SUFFIX}".`,
      400
    );
  }
};

const domainFromEmail = (email: string): string => {
  const normalized = email.toLowerCase().trim();
  return normalized.split("@")[1] || "";
};

// POST /api/university/auth/send-otp
export const sendUniversityOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required.", 400);
  }

  assertEduInEmail(email);

  await requestUniversityOtp(email);

  return res.json({
    success: true,
    message: "If this email is valid, a verification code has been sent.",
  });
});

// POST /api/university/auth/register
export const registerUniversity = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, contactPerson, phone, city, state, otp } = req.body;

  const required = { name, email, password, confirmPassword, contactPerson, phone, city, state, otp };
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

  const normalizedEmail = email.toLowerCase().trim();
  assertEduInEmail(normalizedEmail);

  const domain = domainFromEmail(normalizedEmail);
  if (!domain) {
    throw new AppError("Could not determine your institutional email domain.", 400);
  }

  await verifyUniversityOtp(normalizedEmail, otp);

  const { rows: existingEmail } = await query(`SELECT id FROM universities WHERE email = $1`, [normalizedEmail]);
  if (existingEmail.length > 0) {
    throw new AppError("Registration could not be completed. Please try logging in instead.", 409);
  }

  const { rows: existingDomain } = await query(`SELECT id FROM universities WHERE domain = $1`, [domain]);
  if (existingDomain.length > 0) {
    throw new AppError("A university portal for this institution's email domain already exists. Please log in instead.", 409);
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await query(
    `INSERT INTO universities (name, email, domain, password_hash, contact_person, phone, city, state, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     RETURNING id, name, email, domain, contact_person, phone, city, state, email_verified, created_at, updated_at`,
    [name.trim(), normalizedEmail, domain, passwordHash, contactPerson.trim(), phone.trim(), city.trim(), state.trim()]
  );

  await consumeUniversityOtp(normalizedEmail);

  // Retroactively link any already-registered students whose email domain
  // matches this university, so the dashboard count is accurate immediately.
  await query(
    `UPDATE students SET university_id = $1 WHERE university_id IS NULL AND email ILIKE '%@' || $2`,
    [rows[0].id, domain]
  );

  return res.status(201).json({
    success: true,
    message: "University portal created successfully. You can now log in.",
    university: rows[0],
  });
});

// POST /api/university/auth/login
export const loginUniversity = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(`SELECT * FROM universities WHERE email = $1`, [normalizedEmail]);

  if (rows.length === 0) {
    throw new AppError("Invalid email or password.", 401);
  }

  const university = rows[0];
  const isMatch = await comparePassword(password, university.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signUniversityToken({ universityId: university.id, email: university.email, role: "university" });

  return res.json({
    success: true,
    token,
    university: toPublicUniversity(university),
  });
});

// POST /api/university/auth/logout
export const logoutUniversity = asyncHandler(async (_req: Request, res: Response) => {
  return res.json({ success: true, message: "Logged out." });
});
