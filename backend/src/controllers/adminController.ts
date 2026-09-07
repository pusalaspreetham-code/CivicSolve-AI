import { Request, Response } from "express";
import { query } from "../config/database";
import { comparePassword } from "../utils/password";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendAdminEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(
      `[adminController] EMAIL not configured. Skipped email to ${to}: ${subject}`
    );
    return;
  }

  await transporter.sendMail({
    from: `"CivicSolve AI" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// POST /api/admin/auth/login
export const loginAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { rows } = await query(
      "SELECT * FROM admin_users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      throw new AppError("Invalid credentials", 401);
    }

    const admin = rows[0];

    const isMatch = await comparePassword(
      password,
      admin.password_hash
    );

    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const ADMIN_SECRET =
      process.env.ADMIN_JWT_SECRET ||
      process.env.JWT_SECRET ||
      "";

    if (!ADMIN_SECRET) {
      throw new AppError("Admin authentication is not configured", 500);
    }

    const jwt = require("jsonwebtoken");

    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
      },
      ADMIN_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  }
);

// GET /api/admin/government-users
export const listGovUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.query;

    let queryStr = `
      SELECT
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
        reviewed_by,
        reviewed_at,
        rejection_reason,
        created_at,
        updated_at
      FROM government_users
    `;

    const params: any[] = [];

    if (status) {
      queryStr += " WHERE account_status = $1";
      params.push(status);
    }

    queryStr += " ORDER BY created_at DESC";

    const { rows } = await query(queryStr, params);

    return res.json({
      success: true,
      users: rows,
    });
  }
);

// GET /api/admin/government-users/:id
export const getGovUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const { rows } = await query(
      `
      SELECT
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
        reviewed_by,
        reviewed_at,
        rejection_reason,
        created_at,
        updated_at
      FROM government_users
      WHERE id = $1
      `,
      [id]
    );

    if (rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    return res.json({
      success: true,
      user: rows[0],
    });
  }
);

// POST /api/admin/government-users/:id/approve
export const approveGovUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.adminId;

    const { rows } = await query(
      `
      UPDATE government_users
      SET
        account_status = 'APPROVED',
        reviewed_by = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        name,
        email
      `,
      [adminId, id]
    );

    if (rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    const user = rows[0];

    await sendAdminEmail(
      user.email,
      "CivicSolve AI Account Approved",
      `
        <p>Hello ${user.name},</p>
        <p>Your government account for CivicSolve AI has been approved.</p>
        <p>You can now log in to the Government Portal.</p>
      `
    );

    return res.json({
      success: true,
      message: "Account approved.",
    });
  }
);

// POST /api/admin/government-users/:id/reject
export const rejectGovUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.adminId;

    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      throw new AppError(
        "Rejection reason is required and must be at least 10 characters long",
        400
      );
    }

    const { rows } = await query(
      `
      UPDATE government_users
      SET
        account_status = 'REJECTED',
        reviewed_by = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        name,
        email
      `,
      [adminId, reason.trim(), id]
    );

    if (rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    const user = rows[0];

    await sendAdminEmail(
      user.email,
      "CivicSolve AI Account Rejected",
      `
        <p>Hello ${user.name},</p>
        <p>Your government account registration for CivicSolve AI has been rejected.</p>
        <p><strong>Reason:</strong> ${reason.trim()}</p>
      `
    );

    return res.json({
      success: true,
      message: "Account rejected.",
    });
  }
);

// POST /api/admin/government-users/:id/suspend
export const suspendGovUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.adminId;

    const { rows } = await query(
      `
      UPDATE government_users
      SET
        account_status = 'SUSPENDED',
        reviewed_by = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        name,
        email
      `,
      [adminId, reason?.trim() || null, id]
    );

    if (rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    return res.json({
      success: true,
      message: "Account suspended.",
    });
  }
);