import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = "3REAL <noreply@3real.no>";

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n─── [EMAIL] ───────────────────────────────────");
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Body:\n${opts.text ?? opts.html}`);
    console.log("───────────────────────────────────────────────\n");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export function verificationEmail(to: string, verifyUrl: string): EmailOptions {
  return {
    to,
    subject: "Verify your 3REAL account",
    text: `Click the link below to verify your email address:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
<h2 style="color:#f59e0b">Verify your 3REAL account</h2>
<p>Click the button below to verify your email address.</p>
<a href="${verifyUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Verify Email</a>
<p style="color:#888;font-size:13px">Or copy this link: ${verifyUrl}</p>
<p style="color:#888;font-size:13px">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
</body></html>`,
  };
}

export function passwordResetEmail(to: string, resetUrl: string): EmailOptions {
  return {
    to,
    subject: "Reset your 3REAL password",
    text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 2 hours.`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
<h2 style="color:#f59e0b">Reset your 3REAL password</h2>
<p>Click the button below to set a new password.</p>
<a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Reset Password</a>
<p style="color:#888;font-size:13px">Or copy this link: ${resetUrl}</p>
<p style="color:#888;font-size:13px">This link expires in 2 hours. If you did not request this, ignore this email.</p>
</body></html>`,
  };
}
