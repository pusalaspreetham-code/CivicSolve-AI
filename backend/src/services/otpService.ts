import { query } from "../config/database";
import { generateOtp, hashOtp, compareOtp } from "../utils/password";
import { sendOtpEmail } from "./emailService";
import { AppError } from "../utils/AppError";

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

// `tableName` is only ever passed as a hardcoded literal from call sites
// (e.g. "student_otps", "government_otps") — never from user input — so
// this interpolation is safe. Defaults to "student_otps" to stay
// backward-compatible with existing single-argument call sites.
export const requestOtp = async (email: string, tableName: string = "student_otps"): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Enforce resend cooldown
  const { rows: recent } = await query(
    `SELECT created_at FROM ${tableName} WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail]
  );

  if (recent.length > 0) {
    const last = new Date(recent[0].created_at).getTime();
    const secondsSince = (Date.now() - last) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince);
      throw new AppError(`Please wait ${wait}s before requesting another OTP.`, 429);
    }
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any previous OTPs for this email, then insert a fresh one
  await query(`DELETE FROM ${tableName} WHERE email = $1`, [normalizedEmail]);
  await query(
    `INSERT INTO ${tableName} (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [normalizedEmail, otpHash, expiresAt]
  );

  await sendOtpEmail(normalizedEmail, otp);
};

export const verifyOtp = async (email: string, otp: string, tableName: string = "student_otps"): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(
    `SELECT id, otp_hash, expires_at, attempts FROM ${tableName} WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail]
  );

  if (rows.length === 0) {
    throw new AppError("No OTP was requested for this email. Please request a new one.", 400);
  }

  const record = rows[0];

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new AppError("Too many incorrect attempts. Please request a new OTP.", 429);
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new AppError("This OTP has expired. Please request a new one.", 400);
  }

  const isMatch = await compareOtp(otp, record.otp_hash);

  if (!isMatch) {
    await query(`UPDATE ${tableName} SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
    throw new AppError("Incorrect OTP.", 400);
  }
};

export const consumeOtp = async (email: string, tableName: string = "student_otps"): Promise<void> => {
  await query(`DELETE FROM ${tableName} WHERE email = $1`, [email.toLowerCase().trim()]);
};
