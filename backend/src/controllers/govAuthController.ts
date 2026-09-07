import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { requestOtp, verifyOtp, consumeOtp } from "../services/otpService";
import { signToken } from "../utils/jwt";
import { VALID_DEPARTMENTS, VALID_DESIGNATIONS, PublicGovernmentUser } from "../types/government";

const toPublicGovUser = (row: any): PublicGovernmentUser => {
  const { password_hash, ...rest } = row;
  return rest;
};

// POST /api/gov/auth/send-otp
export const sendGovOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required.", 400);
  }

  // Do not reveal whether the email is already registered.
  await requestOtp(email, 'government_otps');

  return res.json({
    success: true,
    message: "If this email is valid, a verification code has been sent.",
  });
});

// POST /api/gov/auth/register
export const registerGov = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    department,
    designation,
    jurisdiction_city,
    jurisdiction_state,
    phone,
    otp,
  } = req.body;

  const required = { name, email, password, confirmPassword, department, designation, jurisdiction_city, jurisdiction_state, phone, otp };
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

  if (!VALID_DEPARTMENTS.includes(department)) {
    throw new AppError("Invalid department selected.", 400);
  }

  if (!VALID_DESIGNATIONS.includes(designation)) {
    throw new AppError("Invalid designation selected.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP first (throws AppError on failure)
  await verifyOtp(normalizedEmail, otp, 'government_otps');

  const { rows: existing } = await query(`SELECT id FROM government_users WHERE email = $1`, [normalizedEmail]);
  if (existing.length > 0) {
    throw new AppError("Registration could not be completed. Please try logging in instead.", 409);
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await query(
    `INSERT INTO government_users (name, email, password_hash, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     RETURNING id, name, email, department, designation, jurisdiction_city, jurisdiction_state, phone, email_verified, created_at, updated_at`,
    [name.trim(), normalizedEmail, passwordHash, department, designation, jurisdiction_city.trim(), jurisdiction_state.trim(), phone.trim()]
  );

  await consumeOtp(normalizedEmail, 'government_otps');

  return res.status(201).json({
    success: true,
    message: "Account created successfully. You can now log in.",
    user: rows[0],
  });
});

// POST /api/gov/auth/login
export const loginGov = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(`SELECT * FROM government_users WHERE email = $1`, [normalizedEmail]);

  if (rows.length === 0) {
    throw new AppError("Invalid email or password.", 401);
  }

  const user = rows[0];
  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken({ govId: user.id, email: user.email });

  return res.json({
    success: true,
    token,
    user: toPublicGovUser(user),
  });
});

// POST /api/gov/auth/logout
export const logoutGov = asyncHandler(async (_req: Request, res: Response) => {
  return res.json({ success: true, message: "Logged out." });
});
