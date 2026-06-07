// Email service stub — Phase 3 logs to console; replace with real provider in production.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n─── [EMAIL] ───────────────────────────────────");
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Body:\n${opts.text ?? opts.html}`);
    console.log("───────────────────────────────────────────────\n");
    return;
  }
  // TODO Phase 4+: integrate Resend / Nodemailer / Sendgrid
  throw new Error("Email sending not configured for production");
}

export function verificationEmail(to: string, verifyUrl: string): EmailOptions {
  return {
    to,
    subject: "Verify your 3REAL account",
    text: `Click the link below to verify your email address:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function passwordResetEmail(to: string, resetUrl: string): EmailOptions {
  return {
    to,
    subject: "Reset your 3REAL password",
    text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 2 hours.`,
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 2 hours.</p>`,
  };
}
