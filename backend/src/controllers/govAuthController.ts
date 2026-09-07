import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import { requestOtp, verifyOtp, consumeOtp } from "../services/otpService";
import { signToken } from "../utils/jwt";
import { VALID_DEPARTMENTS, PublicGovernmentUser } from "../types/government";

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
  await requestOtp(email, "government_otps");

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
    jurisdiction_city,
    jurisdiction_state,
    phone,
    otp,
    employee_id,
  } = req.body;

  const required = {
    name,
    email,
    password,
    confirmPassword,
    department,
    jurisdiction_city,
    jurisdiction_state,
    phone,
    otp,
    employee_id,
  };

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

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP first
  await verifyOtp(normalizedEmail, otp, "government_otps");

  const { rows: existing } = await query(
    `SELECT id FROM government_users WHERE email = $1`,
    [normalizedEmail]
  );

  if (existing.length > 0) {
    throw new AppError(
      "Registration could not be completed. Please try logging in instead.",
      409
    );
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await query(
    `INSERT INTO government_users (
      name,
      email,
      password_hash,
      department,
      jurisdiction_city,
      jurisdiction_state,
      phone,
      email_verified,
      account_status,
      employee_id
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      TRUE,
      'PENDING',
      $8
    )
    RETURNING
      id,
      name,
      email,
      department,
      jurisdiction_city,
      jurisdiction_state,
      phone,
      email_verified,
      account_status,
      employee_id,
      created_at,
      updated_at`,
    [
      name.trim(),
      normalizedEmail,
      passwordHash,
      department,
      jurisdiction_city.trim(),
      jurisdiction_state.trim(),
      phone.trim(),
      employee_id.trim(),
    ]
  );

  await consumeOtp(normalizedEmail, "government_otps");

  return res.status(201).json({
    success: true,
    message:
      "Your request has been submitted for review. You'll receive an email once an administrator approves your account.",
    status: "PENDING",
  });
});

// POST /api/gov/auth/login
export const loginGov = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(
    `SELECT * FROM government_users WHERE email = $1`,
    [normalizedEmail]
  );

  if (rows.length === 0) {
    throw new AppError("Invalid email or password.", 401);
  }

  const user = rows[0];

  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.account_status === "PENDING") {
    throw new AppError(
      "Your account is awaiting administrator approval.",
      403
    );
  }

  if (user.account_status === "REJECTED") {
    throw new AppError(
      `Your application was not approved. ${user.rejection_reason || ""}`,
      403
    );
  }

  if (user.account_status === "SUSPENDED") {
    throw new AppError(
      "This account has been suspended. Contact an administrator.",
      403
    );
  }

  const token = signToken({
    govId: user.id,
    email: user.email,
  });

  return res.json({
    success: true,
    token,
    user: toPublicGovUser(user),
  });
});

// POST /api/gov/auth/logout
export const logoutGov = asyncHandler(async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Logged out.",
  });
});

// POST /api/gov/auth/forgot-password
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      throw new AppError("Email is required.", 400);
    }

    await requestOtp(email, "government_otps");

    return res.json({
      success: true,
      message: "If this email is valid, a password reset code has been sent.",
    });
  }
);

// POST /api/gov/auth/reset-password
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, newPassword, confirmNewPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmNewPassword) {
      throw new AppError("All fields are required.", 400);
    }

    if (newPassword !== confirmNewPassword) {
      throw new AppError("Passwords do not match.", 400);
    }

    if (newPassword.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters long.",
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await verifyOtp(normalizedEmail, otp, "government_otps");

    const { rows } = await query(
      `SELECT id FROM government_users WHERE email = $1`,
      [normalizedEmail]
    );

    if (rows.length === 0) {
      throw new AppError("Invalid request.", 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await query(
      `UPDATE government_users
       SET password_hash = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE email = $2`,
      [passwordHash, normalizedEmail]
    );

    await consumeOtp(normalizedEmail, "government_otps");

    return res.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  }
);