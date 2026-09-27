import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { enqueueJob, EmailJobData } from "@/lib/queue/backgroundQueue";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/** Enqueues email to background worker so HTTP request returns instantly */
export async function sendEmailAsync(jobData: EmailJobData): Promise<void> {
  await enqueueJob({
    type: "SEND_EMAIL",
    data: jobData,
  });
}

/** Direct AWS SES email dispatch (called by background worker) */
export async function executeSendEmail(jobData: EmailJobData): Promise<boolean> {
  const senderEmail = process.env.SES_SENDER_EMAIL || "notifications@oversite.ng";

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
          Data: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #059669;">Oversite.ng Ground Intelligence</h2>
              <p>${jobData.subject}</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; font-size: 14px;">
                ${JSON.stringify(jobData.payload, null, 2)}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                Confidential dispatch notification • Oversite.ng Decentralized Field Ops
              </p>
            </div>
          `,
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
    console.error(`[SES Failure] Could not deliver email to ${jobData.to}:`, error);
    return false;
  }
}
