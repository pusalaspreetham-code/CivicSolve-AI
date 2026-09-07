import { Request, Response } from "express";
import { query } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/password";
import {
  requestIndustryOtp,
  verifyIndustryOtp,
  consumeIndustryOtp,
} from "../services/industryOtpService";
import { signIndustryToken } from "../utils/jwt";
import { PublicIndustry, VALID_INDUSTRY_SECTORS } from "../types/industry";

const toPublicIndustry = (row: any): PublicIndustry => {
  const { password_hash, ...rest } = row;
  return rest;
};

const domainFromEmail = (email: string): string => {
  const normalized = email.toLowerCase().trim();
  return normalized.split("@")[1] || "";
};

// POST /api/industry/auth/send-otp
export const sendIndustryOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new AppError("A valid corporate email address is required.", 400);
  }

  await requestIndustryOtp(email);

  return res.json({
    success: true,
    message: "If this email is valid, a verification code has been sent.",
  });
});

// POST /api/industry/auth/register
export const registerIndustry = asyncHandler(async (req: Request, res: Response) => {
  const {
    companyName,
    email,
    password,
    confirmPassword,
    contactPerson,
    designation,
    phone,
    sector,
    city,
    state,
    website,
    otp,
  } = req.body;

  const required = {
    companyName,
    email,
    password,
    confirmPassword,
    contactPerson,
    designation,
    phone,
    sector,
    city,
    state,
    otp,
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

  if (!VALID_INDUSTRY_SECTORS.includes(sector)) {
    throw new AppError("Invalid industry sector selected.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const domain = domainFromEmail(normalizedEmail);
  if (!domain) {
    throw new AppError("Could not determine your corporate email domain.", 400);
  }

  await verifyIndustryOtp(normalizedEmail, otp);

  const { rows: existingEmail } = await query(`SELECT id FROM industries WHERE email = $1`, [normalizedEmail]);
  if (existingEmail.length > 0) {
    throw new AppError("An industry account with this email already exists. Please log in instead.", 409);
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await query(
    `INSERT INTO industries (
       company_name, email, domain, password_hash, contact_person,
       designation, phone, sector, city, state, website, email_verified
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
     RETURNING id, company_name, email, domain, contact_person, designation, phone, sector, city, state, website, email_verified, created_at, updated_at`,
    [
      companyName.trim(),
      normalizedEmail,
      domain,
      passwordHash,
      contactPerson.trim(),
      designation.trim(),
      phone.trim(),
      sector,
      city.trim(),
      state.trim(),
      website && typeof website === "string" ? website.trim() : null,
    ]
  );

  await consumeIndustryOtp(normalizedEmail);

  return res.status(201).json({
    success: true,
    message: "Industry account created successfully. You can now log in.",
    industry: rows[0],
  });
});

// POST /api/industry/auth/login
export const loginIndustry = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(`SELECT * FROM industries WHERE email = $1`, [normalizedEmail]);

  if (rows.length === 0) {
    throw new AppError("Invalid email or password.", 401);
  }

  const industry = rows[0];
  const isMatch = await comparePassword(password, industry.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signIndustryToken({ industryId: industry.id, email: industry.email, role: "industry" });

  return res.json({
    success: true,
    token,
    industry: toPublicIndustry(industry),
  });
});

// POST /api/industry/auth/logout
export const logoutIndustry = asyncHandler(async (_req: Request, res: Response) => {
  return res.json({ success: true, message: "Logged out." });
});