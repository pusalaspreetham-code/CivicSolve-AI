import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const generateOtp = (): string => {
  // 6-digit numeric OTP, always zero-padded
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = (otp: string): Promise<string> => bcrypt.hash(otp, SALT_ROUNDS);

export const compareOtp = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
