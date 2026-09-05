import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: `"CivicSolve AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your CivicSolve AI verification code",
    text: `Your OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f766e;">CivicSolve AI</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  // In development, if email credentials aren't configured, log the OTP
  // instead of failing the whole request.
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(`[emailService] EMAIL_USER/EMAIL_PASSWORD not set. OTP for ${toEmail}: ${otp}`);
    return;
  }

  await transporter.sendMail(mailOptions);
};

export const sendUniversityOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: `"CivicSolve AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your CivicSolve AI university verification code",
    text: `Your OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f766e;">CivicSolve AI — University Portal</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(`[emailService] EMAIL_USER/EMAIL_PASSWORD not set. University OTP for ${toEmail}: ${otp}`);
    return;
  }

  await transporter.sendMail(mailOptions);
};
