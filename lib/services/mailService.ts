import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { enqueueJob, EmailJobData } from "@/lib/queue/backgroundQueue";
import { renderEmailTemplate } from "@/lib/services/mailTemplates";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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
  const senderEmail =
    process.env.SES_SENDER_EMAIL || "notifications@oversite.ng";
  const { html, text } = renderEmailTemplate(jobData.template, jobData.payload);

  // If AWS credentials are missing in local dev environment, log cleanly and return
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log(
      `[Email Dev Fallback] Email to ${jobData.to} (${jobData.subject}):`
    );
    console.log(`[Email Dev Fallback Content] ${text}`);
    return true;
  }

  const command = new SendEmailCommand({
    Source: senderEmail,
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
    console.log(`[SES Success] Email delivered to ${jobData.to}`);
    return true;
  } catch (error) {
    console.error(
      `[SES Failure] Could not deliver email to ${jobData.to}:`,
      error
    );
    return false;
  }
}
