/**
 * Oversite.ng High-Performance Responsive HTML Email Templates
 */

export function renderEmailTemplate(
  template: string,
  payload: Record<string, unknown>
): { html: string; text: string } {
  const brandGreen = "#10b981";
  const darkBg = "#0b1410";
  const cardBg = "#ffffff";
  const textColor = "#1e293b";
  const mutedColor = "#64748b";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dev.oversite.ng";

  switch (template) {
    case "2FA_CODE":
    case "OTP_VERIFICATION": {
      const code = String(payload.code || "000000");
      const name = String(payload.name || "User");
      const expiresIn = String(payload.expiresIn || "10 minutes");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Oversite Security Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="560" style="max-width: 560px; background-color: ${cardBg}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 40px 24px; text-align: left; background-color: ${darkBg};">
                      <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Oversite<span style="color: ${brandGreen};">.ng</span></span>
                      <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: ${brandGreen}; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 9999px; font-weight: 700; margin-left: 10px; text-transform: uppercase;">Security</span>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 36px 40px;">
                      <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">Two-Factor Authentication</h1>
                      <p style="font-size: 14px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 24px;">
                        Hello ${name}, use the one-time verification code below to authorize your login request.
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
                      </div>

                      <p style="font-size: 12px; color: ${mutedColor}; line-height: 1.5; margin: 0 0 20px;">
                        ⏱ This code is valid for <strong>${expiresIn}</strong>. Do not share this code with anyone. Oversite personnel will never ask for your verification code.
                      </p>
                      <p style="font-size: 12px; color: ${mutedColor}; margin: 0;">
                        If you did not initiate this login, your credentials may be compromised. Please sign in and reset your password immediately.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                        © ${new Date().getFullYear()} Oversite Technologies Nigeria Limited. Protected by multi-factor security.
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

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert: New Sign-In</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="560" style="max-width: 560px; background-color: ${cardBg}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 40px 24px; text-align: left; background-color: ${darkBg};">
                      <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Oversite<span style="color: ${brandGreen};">.ng</span></span>
                      <span style="font-size: 11px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 8px; border-radius: 9999px; font-weight: 700; margin-left: 10px; text-transform: uppercase;">Security Alert</span>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 36px 40px;">
                      <h1 style="font-size: 20px; font-weight: 700; color: ${textColor}; margin: 0 0 12px;">New Sign-In Detected</h1>
                      <p style="font-size: 14px; line-height: 1.6; color: ${mutedColor}; margin: 0 0 24px;">
                        Hello ${name}, your account was recently accessed from a new device or location.
                      </p>
                      
                      <!-- Session Details Table -->
                      <table width="100%" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 28px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
                        <tr>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0; width: 35%;">Device / Browser</td>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 700; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${deviceName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0;">IP Address</td>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${ipAddress}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor}; border-bottom: 1px solid #e2e8f0;">Approx. Location</td>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor}; border-bottom: 1px solid #e2e8f0;">${location}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${mutedColor};">Timestamp</td>
                          <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: ${textColor};">${time}</td>
                        </tr>
                      </table>

                      <p style="font-size: 13px; line-height: 1.6; color: ${textColor}; margin: 0 0 24px;">
                        If this was you, no action is needed. If you do not recognize this activity, your account may be compromised.
                      </p>

                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <a href="${securityUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; text-align: center;">
                              Review & Terminate Sessions
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                        Your account is limited to 2 active devices simultaneously.
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

      return {
        html,
        text: `Security Alert: New sign-in detected on your Oversite account from ${deviceName} (${ipAddress}) at ${time}. If this was not you, visit ${securityUrl} to terminate all active sessions.`,
      };
    }

    default: {
      const html = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: ${brandGreen};">Oversite.ng Notification</h2>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; font-size: 14px;">
            ${JSON.stringify(payload, null, 2)}
          </div>
        </div>
      `;
      return { html, text: JSON.stringify(payload) };
    }
  }
}
