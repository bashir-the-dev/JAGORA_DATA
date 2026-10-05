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
  const fromAddress = process.env.SMTP_FROM || `"Al'amin Jagora Data" <${process.env.SMTP_USER || 'support@alaminjagoradata.com.ng'}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #047857 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Al'amin Jagora Data</h1>
              <p style="margin:4px 0 0 0;font-size:13px;color:#d1fae5;font-weight:500;">Automated Telecom & VTU Switch</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#f8fafc;">Password Reset Verification</h2>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
                Hello <strong style="color:#f1f5f9;">${recipientName || 'Customer'}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
                We received an automated request to reset the login password for your Al'amin Jagora Data account. Use the 6-digit verification code below to authorize your new password:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color:#0f172a;border:2px dashed #059669;border-radius:12px;padding:20px 16px;">
                    <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">
                      Single-Use Security OTP
                    </div>
                    <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#34d399;font-family:Consolas,Monaco,'Courier New',monospace;text-align:center;padding-left:10px;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Warnings -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:rgba(239, 68, 68, 0.08);border-left:4px solid #ef4444;border-radius:6px;padding:12px 14px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12.5px;color:#fca5a5;line-height:1.5;">
                      <strong>Security Advisory:</strong> This code is valid for <strong>10 minutes</strong>. Never share this code with anyone. Al'amin Jagora Data staff will never ask for your verification code.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
                If you did not initiate this request, someone may have entered your email by mistake. Your account remains completely secure and no changes have been made.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
                Al'amin Jagora Data &bull; Enterprise VTU Telecom Gateway
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                Need assistance? Contact support at <a href="mailto:support@alaminjagoradata.com.ng" style="color:#10b981;text-decoration:none;">support@alaminjagoradata.com.ng</a>
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
Al'amin Jagora Data - Password Reset Verification Code

Hello ${recipientName || 'Customer'},

We received a request to reset your password. Use the 6-digit verification code below:

VERIFICATION CODE: ${otpCode}

This code expires in 10 minutes. Never share this code with anyone.

If you did not request this password reset, please ignore this message.

Support: support@alaminjagoradata.com.ng
`.trim();

  const transporter = getTransporter();

  if (!transporter) {
    // SMTP not configured yet in environment (e.g. preview mode)
    console.log(
      `\n============================================================\n` +
      `[EMAIL SIMULATION - SMTP CREDENTIALS NOT SET IN .ENV]\n` +
      `TO: ${cleanEmail} (${recipientName})\n` +
      `SUBJECT: Password Reset Code - Al'amin Jagora Data\n` +
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
      subject: `Your Password Reset Code: ${otpCode} - Al'amin Jagora Data`,
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
  const fromAddress = process.env.SMTP_FROM || `"Al'amin Jagora Data" <${process.env.SMTP_USER || 'support@alaminjagoradata.com.ng'}>`;
  const appDomain = process.env.APP_DOMAIN || 'alaminjagoradata.com.ng';

  let accountsHtml = '';
  if (virtualAccounts && virtualAccounts.length > 0) {
    accountsHtml += '<div style="margin:20px 0;background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:16px;">';
    accountsHtml += '<div style="font-size:12px;font-weight:700;color:#60a5fa;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.5px;">Your Automated Wallet Funding Accounts:</div>';
    for (const acc of virtualAccounts) {
      accountsHtml += '<div style="padding:8px 0;border-bottom:1px solid #1e293b;font-size:13px;color:#cbd5e1;display:flex;justify-content:space-between;align-items:center;">';
      accountsHtml += `<span>${acc.bank_name}:</span> <strong style="color:#34d399;font-family:monospace;font-size:15px;letter-spacing:1.5px;">${acc.account_number}</strong>`;
      accountsHtml += '</div>';
    }
    accountsHtml += '<div style="font-size:11px;color:#64748b;margin-top:8px;">Transfer funds from any Nigerian bank app to instantly fund your wallet 24/7.</div>';
    accountsHtml += '</div>';
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Al'amin Jagora Data</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0047cc 0%, #003294 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Al'amin Jagora Data</h1>
              <p style="margin:4px 0 0 0;font-size:13px;color:#93c5fd;font-weight:500;">Automated Telecom & VTU Switch</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#f8fafc;">Welcome Aboard, ${recipientName}!</h2>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
                Your account is activated and ready for instant automated purchases of MTN, Airtel, Glo, and 9mobile data bundles, airtime, electricity tokens, cable TV, and exam result PINs.
              </p>

              <!-- Account Details -->
              <div style="background-color:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin:20px 0;">
                <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your Registered Profile:</div>
                <div style="font-size:13px;color:#f1f5f9;margin-bottom:4px;"><strong>Full Name:</strong> ${recipientName}</div>
                <div style="font-size:13px;color:#f1f5f9;margin-bottom:4px;"><strong>Phone:</strong> ${phone}</div>
                <div style="font-size:13px;color:#f1f5f9;"><strong>Email:</strong> ${cleanEmail}</div>
              </div>

              ${accountsHtml}

              <!-- Call to Action -->
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="https://${appDomain}/login" target="_blank" style="background:linear-gradient(135deg, #0047cc 0%, #003294 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(0,71,204,0.3);letter-spacing:0.3px;">
                  Access Your Dashboard
                </a>
              </div>

              <!-- Security Notice -->
              <div style="margin-top:24px;background-color:rgba(239, 68, 68, 0.08);border-left:4px solid #ef4444;border-radius:6px;padding:12px 14px;">
                <p style="margin:0;font-size:12.5px;color:#fca5a5;line-height:1.5;">
                  <strong>Security Advisory:</strong> Keep your login password and 4-digit Transaction PIN strictly confidential. Al'amin Jagora Data staff will never ask for your PIN.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
                Al'amin Jagora Data &bull; Enterprise VTU Telecom Gateway
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                Need assistance? Contact support at <a href="mailto:support@alaminjagoradata.com.ng" style="color:#60a5fa;text-decoration:none;">support@alaminjagoradata.com.ng</a>
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
Welcome to Al'amin Jagora Data!

Hello ${recipientName},

Your account has been activated and is ready for automated VTU purchases (MTN, Airtel, Glo, 9mobile data & airtime, bill payments, and exam pins).

Account Overview:
- Full Name: ${recipientName}
- Phone: ${phone}
- Email: ${cleanEmail}

Security Reminder: Keep your login password and 4-digit Transaction PIN strictly secret. Never share them with anyone.

Login: https://${appDomain}/login
Support: support@alaminjagoradata.com.ng
`.trim();

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `\n============================================================\n` +
      `[EMAIL SIMULATION - WELCOME EMAIL]\n` +
      `TO: ${cleanEmail} (${recipientName})\n` +
      `PHONE: ${phone}\n` +
      `SUBJECT: Welcome to Al'amin Jagora Data\n` +
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
      subject: `Welcome to Al'amin Jagora Data - Account Activated`,
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
