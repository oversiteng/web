/**
 * Oversite.ng High-Performance Responsive HTML Email Templates
 */

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapBrandedLayout({
  badgeText,
  badgeColor = "#10b981",
  badgeBg = "rgba(16, 185, 129, 0.15)",
  badgeBorder = "rgba(16, 185, 129, 0.3)",
  title,
  bodyHtml,
  footerText,
}: {
  badgeText: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
  title: string;
  bodyHtml: string;
  footerText?: string;
}): string {
  const brandGreen = "#10b981";
  const darkBg = "#0b1410";
  const cardBg = "#ffffff";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" style="max-width: 560px; background-color: ${cardBg}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 32px 40px 24px; text-align: left; background-color: ${darkBg};">
                  <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Oversite<span style="color: ${brandGreen};">.ng</span></span>
                  <span style="font-size: 11px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 2px 8px; border-radius: 9999px; font-weight: 700; margin-left: 10px; text-transform: uppercase;">${escapeHtml(badgeText)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 40px;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                    ${escapeHtml(
                      footerText ||
                        `© ${new Date().getFullYear()} Oversite.ng.`
                    )}
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
}

export function renderEmailTemplate(
  template: string,
  payload: Record<string, unknown>
): { html: string; text: string } {
  const textColor = "#1e293b";
  const mutedColor = "#64748b";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dev.oversite.ng";

  switch (template) {
    case "2FA_CODE":
    case "OTP_VERIFICATION":
    case "PASSWORD_RESET": {
      const isReset = template === "PASSWORD_RESET";
      const code = String(payload.code || "000000");
      const name = String(payload.name || "User");
      const expiresIn = String(payload.expiresIn || "10 minutes");

      const html = wrapBrandedLayout({
        badgeText: isReset ? "Password Reset" : "Security",
        title: isReset
          ? "Reset Your Oversite Password"
          : "Your Oversite Security Code",
        footerText: `© ${new Date().getFullYear()} Oversite.ng. Protected by multi-factor security.`,
        bodyHtml: `
          <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">${
            isReset ? "Password Reset Verification" : "Two-Factor Authentication"
          }</h1>
          <p style="font-size: 14px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 24px;">
            Hello ${escapeHtml(name)}, ${
              isReset
                ? "use the one-time verification code below to reset your Oversite password."
                : "use the one-time verification code below to authorize your login request."
            }
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${escapeHtml(code)}</span>
          </div>
          <p style="font-size: 12px; color: ${mutedColor}; line-height: 1.5; margin: 0 0 20px;">
            This code is valid for <strong>${escapeHtml(expiresIn)}</strong>. Do not share this code with anyone. Oversite personnel will never ask for your verification code.
          </p>
          <p style="font-size: 12px; color: ${mutedColor}; margin: 0;">
            If you did not initiate this login, please sign in and reset your password immediately.
          </p>
        `,
      });

      return {
        html,
        text: `Your Oversite 2FA Code is ${code}. Valid for ${expiresIn}. Do not share this code.`,
      };
    }

    case "NEW_LOGIN_ALERT": {
      const name = String(payload.name || "User");
      const deviceName = String(payload.deviceName || "Unrecognized Device");
      const ipAddress = String(payload.ipAddress || "Unknown IP");
      const location = String(payload.location || "Nigeria");
      const time = String(payload.time || new Date().toUTCString());
      const securityUrl = `${appUrl}/security`;

      const html = wrapBrandedLayout({
        badgeText: "Security Alert",
        badgeColor: "#f87171",
        badgeBg: "rgba(239, 68, 68, 0.15)",
        badgeBorder: "rgba(239, 68, 68, 0.3)",
        title: "Security Alert: New Sign-In",
        footerText: "Your account is limited to 2 active devices simultaneously.",
        bodyHtml: `
          <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">New Sign-In Detected</h1>
          <p style="font-size: 14px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 24px;">
            Hello ${escapeHtml(name)}, your account was recently accessed from a new device or location.
          </p>
          <table width="100%" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 28px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
            <tr>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0; width: 35%;">Device / Browser</td>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 700; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${escapeHtml(deviceName)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0;">IP Address</td>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${escapeHtml(ipAddress)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0;">Approx. Location</td>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${escapeHtml(location)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor};">Timestamp</td>
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor};">${escapeHtml(time)}</td>
            </tr>
          </table>
          <p style="font-size: 13px; line-height: 1.6; color: ${textColor}; margin: 0 0 24px;">
            If this was you, no action is needed. If you do not recognize this activity, your account may be compromised.
          </p>
          <a href="${escapeHtml(securityUrl)}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700;">
            Review &amp; Terminate Sessions
          </a>
        `,
      });

      return {
        html,
        text: `Security Alert: New sign-in detected on your Oversite account from ${deviceName} (${ipAddress}) at ${time}. If this was not you, visit ${securityUrl} to terminate all active sessions.`,
      };
    }

    case "ADMIN_INVITE_CREDENTIALS":
    case "ADMIN_CREDENTIALS_RESET": {
      const isReset = template === "ADMIN_CREDENTIALS_RESET";
      const name = String(payload.name || "Administrator");
      const department = String(payload.department || "Oversite Operations");
      const loginUrl = String(payload.loginUrl || `${appUrl}/admin/login`);
      const tempPassword = String(payload.tempPassword || "");

      const html = wrapBrandedLayout({
        badgeText: isReset ? "Credential Reset" : "Admin Onboarding",
        title: isReset
          ? "Oversite Admin Credentials Reset"
          : `Oversite Admin Credentials — ${department}`,
        footerText:
          "Strict Security Policy: No administrator may copy, export, or download platform data.",
        bodyHtml: `
          <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">
            ${isReset ? "Temporary Admin Password Reset" : "Welcome to Oversite Admin Command"}
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 20px;">
            Hello ${escapeHtml(name)}, ${
              isReset
                ? "your temporary administrator password has been reset by the Super Admin."
                : `you have been provisioned as an Oversite Administrator under <strong>${escapeHtml(department)}</strong>.`
            }
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 22px;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${mutedColor}; margin: 0 0 6px;">Temporary Password</p>
            <p style="font-size: 20px; font-weight: 800; font-family: monospace; color: #0f172a; margin: 0;">${escapeHtml(tempPassword)}</p>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 22px;">
            1. Sign in at the Admin Portal using your official email and the temporary password above.<br/>
            2. Complete the mandatory 2FA check and set your personal password.<br/>
            3. Wait for final Super Admin approval to activate your departmental workspace.
          </p>
          <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700;">
            Open Admin Portal
          </a>
        `,
      });

      return {
        html,
        text: `Hello ${name}, sign in at ${loginUrl} with temporary password: ${tempPassword}. You will be required to update your password and await Super Admin approval.`,
      };
    }

    default: {
      const recipientName = String(
        payload.recipientName || payload.name || "Valued User"
      );
      const message = String(
        payload.message || payload.body || JSON.stringify(payload, null, 2)
      );
      const actionLink = payload.actionLink ? String(payload.actionLink) : null;
      const badgeLabel = template.startsWith("ADMIN_")
        ? template.replace("ADMIN_", "")
        : "Notification";

      const html = wrapBrandedLayout({
        badgeText: badgeLabel,
        title: "Oversite.ng Update",
        bodyHtml: `
          <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">Hello ${escapeHtml(recipientName)},</h1>
          <p style="font-size: 14px; line-height: 1.7; color: ${mutedColor}; white-space: pre-line; margin: 0 0 24px;">
            ${escapeHtml(message)}
          </p>
          ${
            actionLink
              ? `<a href="${escapeHtml(actionLink)}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700;">View in Oversite</a>`
              : ""
          }
        `,
      });

      return {
        html,
        text: `Hello ${recipientName},\n\n${message}${actionLink ? `\n\nView: ${actionLink}` : ""}`,
      };
    }
  }
}
