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

// ── Transactional event emails ────────────────────────────────────────────────

function layout(title: string, body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://3real.no";
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#09090b;color:#e4e4e7">
<div style="border-bottom:1px solid #27272a;padding-bottom:16px;margin-bottom:24px">
  <span style="font-size:20px;font-weight:800;color:#f59e0b">3REAL</span>
</div>
<h2 style="color:#f4f4f5;font-size:18px;margin:0 0 12px">${title}</h2>
${body}
<div style="border-top:1px solid #27272a;margin-top:32px;padding-top:16px;font-size:11px;color:#52525b">
  <a href="${appUrl}/dashboard" style="color:#f59e0b;text-decoration:none">Go to your dashboard</a>
  &nbsp;·&nbsp;
  <span>3REAL · noreply@3real.no</span>
</div>
</body></html>`;
}

export function kycApprovedEmail(to: string, tier: number): EmailOptions {
  const body = `<p style="color:#a1a1aa">Your identity verification has been approved — you are now at KYC Tier ${tier}.</p>
<p style="color:#a1a1aa">You can now access full deposit and withdrawal features on your 3REAL account.</p>`;
  return {
    to,
    subject: "Your 3REAL identity verification was approved",
    text: `Your identity verification was approved. You are now at KYC Tier ${tier}. Log in to access full platform features.`,
    html: layout("Identity Verification Approved", body),
  };
}

export function kycRejectedEmail(to: string, reason: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Unfortunately your KYC submission was not approved.</p>
<p style="color:#fca5a5"><strong>Reason:</strong> ${reason}</p>
<p style="color:#a1a1aa">You can re-submit your documents from your dashboard.</p>`;
  return {
    to,
    subject: "Your 3REAL identity verification was not approved",
    text: `Your KYC submission was rejected. Reason: ${reason}. Log in to re-submit.`,
    html: layout("Identity Verification Not Approved", body),
  };
}

export function kycUpdateRequestedEmail(to: string, reason: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Our team has reviewed your KYC documents and requires an update before we can proceed.</p>
<p style="color:#fde68a"><strong>What's needed:</strong> ${reason}</p>
<p style="color:#a1a1aa">Please log in and re-upload the requested documents.</p>`;
  return {
    to,
    subject: "Action required — update your 3REAL KYC documents",
    text: `Your KYC submission needs an update. Reason: ${reason}. Log in to re-submit.`,
    html: layout("KYC Update Required", body),
  };
}

export function depositApprovedEmail(to: string, amount: number, assetCode: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Your deposit has been approved and credited to your account.</p>
<p style="font-size:24px;font-weight:700;color:#4ade80;margin:16px 0">+${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${assetCode}</p>
<p style="color:#a1a1aa">Your balance has been updated. You can view your wallet from the dashboard.</p>`;
  return {
    to,
    subject: `Deposit of ${amount} ${assetCode} approved — 3REAL`,
    text: `Your deposit of ${amount} ${assetCode} has been approved and credited to your account.`,
    html: layout("Deposit Approved", body),
  };
}

export function depositRejectedEmail(to: string, amount: number, assetCode: string, reason: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Your deposit request was reviewed but could not be approved.</p>
<p style="color:#a1a1aa"><strong>Amount:</strong> ${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${assetCode}</p>
<p style="color:#fca5a5"><strong>Reason:</strong> ${reason}</p>
<p style="color:#a1a1aa">If you believe this is an error, please contact support or submit a new deposit request.</p>`;
  return {
    to,
    subject: `Deposit of ${amount} ${assetCode} was not approved — 3REAL`,
    text: `Your deposit of ${amount} ${assetCode} was rejected. Reason: ${reason}.`,
    html: layout("Deposit Not Approved", body),
  };
}

export function withdrawalApprovedEmail(to: string, amount: number, assetCode: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Your withdrawal request has been approved and is being processed.</p>
<p style="font-size:24px;font-weight:700;color:#60a5fa;margin:16px 0">${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${assetCode}</p>
<p style="color:#a1a1aa">Funds will be sent to the destination you specified. Processing time varies by asset and network.</p>`;
  return {
    to,
    subject: `Withdrawal of ${amount} ${assetCode} approved — 3REAL`,
    text: `Your withdrawal of ${amount} ${assetCode} has been approved and is being processed.`,
    html: layout("Withdrawal Approved", body),
  };
}

export function withdrawalRejectedEmail(to: string, amount: number, assetCode: string, reason: string): EmailOptions {
  const body = `<p style="color:#a1a1aa">Your withdrawal request was reviewed but could not be approved.</p>
<p style="color:#a1a1aa"><strong>Amount:</strong> ${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${assetCode}</p>
<p style="color:#fca5a5"><strong>Reason:</strong> ${reason}</p>
<p style="color:#a1a1aa">Your balance has been restored. You can submit a new withdrawal request from your dashboard.</p>`;
  return {
    to,
    subject: `Withdrawal of ${amount} ${assetCode} was not approved — 3REAL`,
    text: `Your withdrawal of ${amount} ${assetCode} was rejected. Reason: ${reason}. Your balance has been restored.`,
    html: layout("Withdrawal Not Approved", body),
  };
}

export function referralRewardEmail(to: string, amount: number): EmailOptions {
  const body = `<p style="color:#a1a1aa">You earned a referral reward!</p>
<p style="font-size:24px;font-weight:700;color:#fb923c;margin:16px 0">+${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} REAL</p>
<p style="color:#a1a1aa">The reward has been credited to your REAL balance. Keep sharing your referral link to earn more.</p>`;
  return {
    to,
    subject: `You earned ${amount} REAL — referral reward`,
    text: `You earned a referral reward of ${amount} REAL. The funds have been credited to your account.`,
    html: layout("Referral Reward Earned", body),
  };
}
