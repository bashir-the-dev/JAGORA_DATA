import nodemailer from 'nodemailer';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  previewUrl?: string;
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let cachedTransporter: MailTransporter | null = null;

function getTransporter(): MailTransporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!host || !user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (587)
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues on shared hosting
      },
    });
  }

  return cachedTransporter;
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string,
  otpCode: string
): Promise<EmailResult> {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  const fromAddress = process.env.SMTP_FROM || `"AJDATASUB" <${process.env.SMTP_USER || 'support@ajdatasub.com.ng'}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Password Reset Verification Code</title>
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin:0; padding:0; background-color:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .email-bg { background-color: #f4f6fb !important; }
    .email-card { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; }
    .email-header-sub { color: #64748b !important; }
    .email-title { color: #0f172a !important; }
    .email-body { color: #334155 !important; }
    .email-footer { background-color: #f8fafc !important; border-top: 1px solid #e2e8f0 !important; }
    .email-footer-text { color: #64748b !important; }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="email-bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6fb;padding:36px 16px;">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 30px rgba(15,23,42,0.06);">
          
          <!-- Accent Gradient Bar -->
          <tr>
            <td height="5" style="background:linear-gradient(90deg, #f59e0b 0%, #0047cc 50%, #10b981 100%);"></td>
          </tr>

          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#0047cc;letter-spacing:-0.5px;">
                <span style="color:#0f172a;">Al'amin</span> AJDATASUB
              </h1>
              <p class="email-header-sub" style="margin:4px 0 0 0;font-size:11.5px;color:#64748b;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Automated Telecom & VTU Gateway</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h2 class="email-title" style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Password Reset Verification</h2>
              <p class="email-body" style="margin:0 0 16px 0;font-size:14.5px;line-height:1.65;color:#334155;">
                Hello <strong style="color:#0f172a;">${recipientName || 'Customer'}</strong>,
              </p>
              <p class="email-body" style="margin:0 0 24px 0;font-size:14.5px;line-height:1.65;color:#334155;">
                We received an automated request to reset the login password for your AJDATASUB account. Use the 6-digit verification code below to authorize your new password:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color:#f0fdf4;border:2px dashed #059669;border-radius:12px;padding:20px 16px;">
                    <div style="font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">
                      Single-Use Security OTP
                    </div>
                    <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#059669;font-family:Consolas,Monaco,'Courier New',monospace;text-align:center;padding-left:10px;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Warnings -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:12px 14px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12.5px;color:#991b1b;line-height:1.5;">
                      <strong>Security Advisory:</strong> This code is valid for <strong>10 minutes</strong>. Never share this code with anyone. AJDATASUB staff will never ask for your verification code.
                    </p>
                  </td>
                </tr>
              </table>

              <p class="email-body" style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                If you did not initiate this request, someone may have entered your email by mistake. Your account remains completely secure and no changes have been made.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color:#f8fafc;padding:22px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p class="email-footer-text" style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
                AJDATASUB &bull; Enterprise VTU Telecom Gateway
              </p>
              <p class="email-footer-text" style="margin:0;font-size:11.5px;color:#94a3b8;">
                Need assistance? Contact support at <a href="mailto:support@ajdatasub.com.ng" style="color:#0047cc;text-decoration:none;">support@ajdatasub.com.ng</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
AJDATASUB - Password Reset Verification Code

Hello ${recipientName || 'Customer'},

We received a request to reset your password. Use the 6-digit verification code below:

VERIFICATION CODE: ${otpCode}

This code expires in 10 minutes. Never share this code with anyone.

If you did not request this password reset, please ignore this message.

Support: support@ajdatasub.com.ng
`.trim();

  const transporter = getTransporter();

  if (!transporter) {
    // SMTP not configured yet in environment (e.g. preview mode)
    console.log(
      `\n============================================================\n` +
      `[EMAIL SIMULATION - SMTP CREDENTIALS NOT SET IN .ENV]\n` +
      `TO: ${cleanEmail} (${recipientName})\n` +
      `SUBJECT: Password Reset Code - AJDATASUB\n` +
      `RESET OTP: ${otpCode}\n` +
      `EXPIRES: 10 minutes\n` +
      `============================================================\n`
    );
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Your Password Reset Code: ${otpCode} - AJDATASUB`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[SMTP EMAIL DISPATCHED] To: ${cleanEmail} | MessageID: ${info.messageId} | OTP: ${otpCode}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed sending email to ${cleanEmail}:`, err?.message || err);
    // Still log the OTP for recovery so the user isn't stuck during unexpected SMTP issues
    console.log(`[FALLBACK OTP CODE] For ${cleanEmail}: ${otpCode}`);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch email via SMTP server.',
    };
  }
}

export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string,
  phone: string,
  virtualAccounts: Array<{ bank_name: string; account_number: string; account_name?: string }> = []
): Promise<EmailResult> {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  const fromAddress = process.env.SMTP_FROM || `"AJDATASUB" <${process.env.SMTP_USER || 'support@ajdatasub.com.ng'}>`;
  const appDomain = process.env.APP_DOMAIN || 'ajdatasub.com.ng';

  let accountsHtml = '';
  if (virtualAccounts && virtualAccounts.length > 0) {
    accountsHtml += '<div style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">';
    accountsHtml += '<div style="font-size:12px;font-weight:700;color:#0047cc;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.5px;">Your Dedicated Bank Accounts:</div>';
    for (const acc of virtualAccounts) {
      accountsHtml += '<div style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13.5px;color:#334155;display:flex;justify-content:space-between;align-items:center;">';
      accountsHtml += `<span>${acc.bank_name}:</span> <strong style="color:#059669;font-family:monospace;font-size:15px;letter-spacing:1.5px;">${acc.account_number}</strong>`;
      accountsHtml += '</div>';
    }
    accountsHtml += '<div style="font-size:11.5px;color:#64748b;margin-top:8px;">Transfer funds from any Nigerian bank app to instantly auto-fund your wallet 24/7.</div>';
    accountsHtml += '</div>';
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to AJDATASUB</title>
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin:0; padding:0; background-color:#f4f6fb; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
    .email-bg { background-color: #f4f6fb !important; }
    .email-card { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; }
    .email-header-sub { color: #64748b !important; }
    .email-title { color: #0f172a !important; }
    .email-body { color: #334155 !important; }
    .email-footer { background-color: #f8fafc !important; border-top: 1px solid #e2e8f0 !important; }
    .email-footer-text { color: #64748b !important; }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="email-bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6fb;padding:36px 16px;">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 30px rgba(15,23,42,0.06);">
          
          <!-- Accent Gradient Bar -->
          <tr>
            <td height="5" style="background:linear-gradient(90deg, #f59e0b 0%, #0047cc 50%, #10b981 100%);"></td>
          </tr>

          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e2e8f0;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#0047cc;letter-spacing:-0.5px;">
                <span style="color:#0f172a;">Al'amin</span> AJDATASUB
              </h1>
              <p class="email-header-sub" style="margin:4px 0 0 0;font-size:11.5px;color:#64748b;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Automated Telecom & VTU Gateway</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h2 class="email-title" style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Welcome Aboard, ${recipientName}!</h2>
              <p class="email-body" style="margin:0 0 16px 0;font-size:14.5px;line-height:1.65;color:#334155;">
                Your account is activated and ready for instant automated purchases of MTN, Airtel, Glo, and 9mobile data bundles, airtime, electricity tokens, cable TV, and exam result PINs.
              </p>

              <!-- Account Details -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your Registered Profile:</div>
                <div style="font-size:13.5px;color:#0f172a;margin-bottom:4px;"><strong>Full Name:</strong> ${recipientName}</div>
                <div style="font-size:13.5px;color:#0f172a;margin-bottom:4px;"><strong>Phone:</strong> ${phone}</div>
                <div style="font-size:13.5px;color:#0f172a;"><strong>Email:</strong> ${cleanEmail}</div>
              </div>

              ${accountsHtml}

              <!-- Call to Action -->
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="https://${appDomain}/login" target="_blank" style="background:linear-gradient(135deg, #0047cc 0%, #003294 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(0,71,204,0.25);letter-spacing:0.3px;">
                  Access Your Dashboard
                </a>
              </div>

              <!-- Security Notice -->
              <div style="margin-top:24px;background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:12px 14px;">
                <p style="margin:0;font-size:12.5px;color:#991b1b;line-height:1.5;">
                  <strong>Security Advisory:</strong> Keep your login password and 4-digit Transaction PIN strictly confidential. AJDATASUB staff will never ask for your PIN.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color:#f8fafc;padding:22px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p class="email-footer-text" style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
                AJDATASUB &bull; Enterprise VTU Telecom Gateway
              </p>
              <p class="email-footer-text" style="margin:0;font-size:11.5px;color:#94a3b8;">
                Need assistance? Contact support at <a href="mailto:support@ajdatasub.com.ng" style="color:#0047cc;text-decoration:none;">support@ajdatasub.com.ng</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Welcome to AJDATASUB!

Hello ${recipientName},

Your account has been activated and is ready for automated VTU purchases (MTN, Airtel, Glo, 9mobile data & airtime, bill payments, and exam pins).

Account Overview:
- Full Name: ${recipientName}
- Phone: ${phone}
- Email: ${cleanEmail}

Security Reminder: Keep your login password and 4-digit Transaction PIN strictly secret. Never share them with anyone.

Login: https://${appDomain}/login
Support: support@ajdatasub.com.ng
`.trim();

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `\n============================================================\n` +
      `[EMAIL SIMULATION - WELCOME EMAIL]\n` +
      `TO: ${cleanEmail} (${recipientName})\n` +
      `PHONE: ${phone}\n` +
      `SUBJECT: Welcome to AJDATASUB\n` +
      `============================================================\n`
    );
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Welcome to AJDATASUB - Account Activated`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[WELCOME EMAIL DISPATCHED] To: ${cleanEmail} | MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed sending welcome email to ${cleanEmail}:`, err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch welcome email via SMTP server.',
    };
  }
}
