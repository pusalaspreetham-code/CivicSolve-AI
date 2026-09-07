import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload, UniversityJwtPayload } from "../types";
import { GovJwtPayload } from "../types/government";
import { IndustryJwtPayload } from "../types/industry";

const SECRET = process.env.JWT_SECRET || "";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET) {
  console.error("FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}

export const signToken = (payload: JwtPayload | GovJwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload & Partial<GovJwtPayload> => {
  return jwt.verify(token, SECRET) as JwtPayload & Partial<GovJwtPayload>;
};

export const signUniversityToken = (payload: UniversityJwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as SignOptions);
};

export const verifyUniversityToken = (token: string): UniversityJwtPayload => {
  const decoded = jwt.verify(token, SECRET) as UniversityJwtPayload;
  if (decoded.role !== "university") {
    throw new Error("Not a university token.");
  }
  return decoded;
};

export const signIndustryToken = (payload: IndustryJwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as SignOptions);
};

export const verifyIndustryToken = (token: string): IndustryJwtPayload => {
  const decoded = jwt.verify(token, SECRET) as IndustryJwtPayload;
  if (decoded.role !== "industry") {
    throw new Error("Not an industry token.");
  }
  return decoded;
};
