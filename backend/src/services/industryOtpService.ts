import { query } from "../config/database";
import { generateOtp, hashOtp, compareOtp } from "../utils/password";
import { sendIndustryOtpEmail } from "./emailService";
import { AppError } from "../utils/AppError";

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export const requestIndustryOtp = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  const { rows: recent } = await query(
    `SELECT created_at FROM industry_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
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

  await query(`DELETE FROM industry_otps WHERE email = $1`, [normalizedEmail]);
  await query(
    `INSERT INTO industry_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [normalizedEmail, otpHash, expiresAt]
  );

  await sendIndustryOtpEmail(normalizedEmail, otp);
};

export const verifyIndustryOtp = async (email: string, otp: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await query(
    `SELECT id, otp_hash, expires_at, attempts FROM industry_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
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
    await query(`UPDATE industry_otps SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
    throw new AppError("Incorrect OTP.", 400);
  }
};

export const consumeIndustryOtp = async (email: string): Promise<void> => {
  await query(`DELETE FROM industry_otps WHERE email = $1`, [email.toLowerCase().trim()]);
};
