import { dequeueNextJob } from "./lib/queue/backgroundQueue";
import { executeSendEmail } from "./lib/services/mailService";

async function startWorkerLoop() {
  console.log("🚀 Oversite.ng Background Microservice Worker started...");

  while (true) {
    try {
      const job = await dequeueNextJob();

      if (job) {
        console.log(`[Worker] Processing job ${job.id} of type ${job.type}`);

        switch (job.type) {
          case "SEND_EMAIL":
            await executeSendEmail(job.data);
            break;

          case "AUTO_RELEASE_ESCROW":
            console.log(`[Worker] Auto-releasing escrow for task ${job.data.taskId}`);
            // TODO: Execute db transaction to release escrow
            break;

          case "GENERATE_WATERMARK_PDF":
            console.log(`[Worker] Generating watermark PDF for report ${job.data.reportId}`);
            // TODO: Execute PDF generation script
            break;

          default:
            console.warn(`[Worker] Unknown job type: ${(job as { type: string }).type}`);
        }
      } else {
        // Sleep 1 second when queue is empty to avoid cpu spinning
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error("[Worker Exception]", err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

startWorkerLoop();
