import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { enqueueJob, EmailJobData } from "@/lib/queue/backgroundQueue";
import { renderEmailTemplate } from "@/lib/services/mailTemplates";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "eu-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const NO_REPLY_TEMPLATES = new Set([
  "2FA_CODE",
  "OTP_VERIFICATION",
  "NEW_LOGIN_ALERT",
  "ADMIN_INVITE_CREDENTIALS",
  "ADMIN_CREDENTIALS_RESET",
]);

function resolveSenderAddress(jobData: EmailJobData): string {
  if (jobData.from) return jobData.from;
  const noReplyEmail =
    process.env.SES_NOREPLY_EMAIL || "no-reply@oversite.ng";
  const notificationsEmail =
    process.env.SES_SENDER_EMAIL || "notifications@oversite.ng";

  return NO_REPLY_TEMPLATES.has(jobData.template)
    ? noReplyEmail
    : notificationsEmail;
}

/**
 * Dispatches email asynchronously so HTTP requests return immediately.
 * - When USE_REDIS_EMAIL_WORKER="true", pushes to Redis for scripts/worker.ts.
 * - Otherwise, executes non-blocking AWS SES dispatch in the background.
 */
export async function sendEmailAsync(jobData: EmailJobData): Promise<void> {
  if (process.env.USE_REDIS_EMAIL_WORKER === "true") {
    await enqueueJob({
      type: "SEND_EMAIL",
      data: jobData,
    });
    return;
  }

  void executeSendEmail(jobData).catch((err) => {
    console.error("[Email Async Dispatch Error]:", err);
  });
}

/** Direct AWS SES email dispatch (called directly or by background worker) */
export async function executeSendEmail(jobData: EmailJobData): Promise<boolean> {
  const senderEmail = resolveSenderAddress(jobData);
  const supportEmail =
    process.env.SES_SUPPORT_EMAIL || "support@oversite.ng";
  const { html, text } = renderEmailTemplate(jobData.template, jobData.payload);

  // If AWS credentials are missing in local dev environment, log cleanly and return
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log(
      `[Email Dev Fallback] From ${senderEmail} -> To ${jobData.to} (${jobData.subject}):`
    );
    console.log(`[Email Dev Fallback Content] ${text}`);
    return true;
  }

  const command = new SendEmailCommand({
    Source: `Oversite <${senderEmail}>`,
    ReplyToAddresses: [supportEmail],
    Destination: {
      ToAddresses: [jobData.to],
    },
    Message: {
      Subject: {
        Data: jobData.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
        Text: {
          Data: text,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(
      `[SES Success] Email delivered from ${senderEmail} to ${jobData.to}`
    );
    return true;
  } catch (error) {
    console.error(
      `[SES Failure] Could not deliver email from ${senderEmail} to ${jobData.to}:`,
      error
    );
    return false;
  }
}
