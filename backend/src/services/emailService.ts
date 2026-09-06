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

// Small internal helper so every notification email shares one send/log path.
const dispatchMail = async (mailOptions: { to: string; subject: string; text: string; html: string }): Promise<void> => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(`[emailService] EMAIL_USER/EMAIL_PASSWORD not set. Skipped email to ${mailOptions.to}: ${mailOptions.subject}`);
    return;
  }
  await transporter.sendMail({ from: `"CivicSolve AI" <${process.env.EMAIL_USER}>`, ...mailOptions });
};

// ------------------------------------------------------------
// Team activity notifications
// Sent to every member of a team whenever something important
// happens: a member joins, or a solution/evidence is added or
// updated.
// ------------------------------------------------------------
export interface TeamActivityEmailParams {
  toEmail: string;
  teamName: string;
  problemTitle: string;
  actorName: string;
  actionSummary: string; // e.g. "added a new solution"
  detail?: string | null; // e.g. solution description snippet
  evidenceLink?: string | null;
  problemUrl?: string | null;
}

export const sendTeamActivityEmail = async (params: TeamActivityEmailParams): Promise<void> => {
  const { toEmail, teamName, problemTitle, actorName, actionSummary, detail, evidenceLink, problemUrl } = params;

  const detailHtml = detail
    ? `<p style="margin:12px 0 0;color:#334155;background:#f8fafc;border-left:3px solid #0f766e;padding:10px 12px;border-radius:4px;">${escapeHtml(
        detail
      )}</p>`
    : "";
  const evidenceHtml = evidenceLink
    ? `<p style="margin:10px 0 0;"><a href="${escapeAttr(evidenceLink)}" style="color:#0f766e;">View evidence / resource link</a></p>`
    : "";
  const problemLinkHtml = problemUrl
    ? `<p style="margin:16px 0 0;"><a href="${escapeAttr(problemUrl)}" style="color:#0f766e;">Open the problem page &rarr;</a></p>`
    : "";

  await dispatchMail({
    to: toEmail,
    subject: `[${teamName}] ${actorName} ${actionSummary}`,
    text: `Team: ${teamName}\nProblem: ${problemTitle}\n${actorName} ${actionSummary}.${detail ? `\n\n${detail}` : ""}${
      evidenceLink ? `\nEvidence: ${evidenceLink}` : ""
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#0f766e; margin-bottom:4px;">CivicSolve AI</h2>
        <p style="color:#64748b;margin-top:0;">Team activity update</p>
        <p style="margin:0;"><strong>Team:</strong> ${escapeHtml(teamName)}</p>
        <p style="margin:4px 0 0;"><strong>Problem:</strong> ${escapeHtml(problemTitle)}</p>
        <p style="margin:12px 0 0;"><strong>${escapeHtml(actorName)}</strong> ${escapeHtml(actionSummary)}.</p>
        ${detailHtml}
        ${evidenceHtml}
        ${problemLinkHtml}
      </div>
    `,
  });
};

// ------------------------------------------------------------
// Faculty guidance request — sent to the faculty member's email.
// Faculty accepts/denies purely by clicking one of these links;
// there is no faculty login or dashboard.
// ------------------------------------------------------------
export interface FacultyGuidanceRequestEmailParams {
  facultyEmail: string;
  facultyName: string;
  studentName: string;
  studentEmail: string;
  problemTitle: string;
  teamName?: string | null;
  message?: string | null;
  acceptUrl: string;
  denyUrl: string;
}

export const sendFacultyGuidanceRequestEmail = async (params: FacultyGuidanceRequestEmailParams): Promise<void> => {
  const { facultyEmail, facultyName, studentName, studentEmail, problemTitle, teamName, message, acceptUrl, denyUrl } = params;

  await dispatchMail({
    to: facultyEmail,
    subject: `Guidance request from ${studentName} — ${problemTitle}`,
    text: `Dear ${facultyName},\n\n${studentName} (${studentEmail}) has requested your guidance on the civic problem "${problemTitle}"${
      teamName ? ` as part of team "${teamName}"` : ""
    }.${message ? `\n\nMessage: ${message}` : ""}\n\nAccept: ${acceptUrl}\nDeny: ${denyUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#0f766e; margin-bottom:4px;">CivicSolve AI</h2>
        <p style="color:#64748b;margin-top:0;">Faculty guidance request</p>
        <p>Dear ${escapeHtml(facultyName)},</p>
        <p><strong>${escapeHtml(studentName)}</strong> (${escapeHtml(studentEmail)}) has requested your guidance on:</p>
        <p style="font-size:16px;font-weight:bold;color:#0f172a;">${escapeHtml(problemTitle)}</p>
        ${teamName ? `<p style="color:#334155;">Team: ${escapeHtml(teamName)}</p>` : ""}
        ${
          message
            ? `<p style="margin:12px 0;color:#334155;background:#f8fafc;border-left:3px solid #0f766e;padding:10px 12px;border-radius:4px;">${escapeHtml(
                message
              )}</p>`
            : ""
        }
        <div style="margin-top:20px;">
          <a href="${escapeAttr(acceptUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;margin-right:10px;">Accept</a>
          <a href="${escapeAttr(denyUrl)}" style="display:inline-block;background:#ffffff;color:#b91c1c;border:1px solid #b91c1c;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;">Deny</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">You can respond directly from this email — no account or login is needed.</p>
      </div>
    `,
  });
};

// ------------------------------------------------------------
// Faculty guidance response — sent back to the student once the
// faculty member accepts or denies via the email link.
// ------------------------------------------------------------
export const sendGuidanceResponseEmail = async (params: {
  studentEmail: string;
  facultyName: string;
  problemTitle: string;
  status: "ACCEPTED" | "DENIED";
}): Promise<void> => {
  const { studentEmail, facultyName, problemTitle, status } = params;
  const accepted = status === "ACCEPTED";

  await dispatchMail({
    to: studentEmail,
    subject: `${facultyName} ${accepted ? "accepted" : "declined"} your guidance request`,
    text: `${facultyName} has ${accepted ? "accepted" : "declined"} your guidance request for "${problemTitle}".`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#0f766e; margin-bottom:4px;">CivicSolve AI</h2>
        <p style="color:#64748b;margin-top:0;">Faculty guidance update</p>
        <p><strong>${escapeHtml(facultyName)}</strong> has
          <strong style="color:${accepted ? "#0f766e" : "#b91c1c"};">${accepted ? "accepted" : "declined"}</strong>
          your guidance request for:
        </p>
        <p style="font-size:16px;font-weight:bold;color:#0f172a;">${escapeHtml(problemTitle)}</p>
        ${accepted ? `<p style="color:#334155;">Reach out to your faculty guide directly over email to get started.</p>` : ""}
      </div>
    `,
  });
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}
