/**
 * Queue service for background jobs
 * TODO: Implement with Bull/BullMQ when needed
 *
 * Use cases:
 * - Email sending (OTP, vendor approval notifications)
 * - Image optimization post-upload
 * - Nightly aggregations (ratings, popular items)
 * - Push notifications
 */

interface Job {
  type: string;
  data: any;
}

export class QueueService {
  /**
   * Add job to queue
   * Currently a stub - logs job for later implementation
   */
  async addJob(job: Job): Promise<void> {
    console.log(`[QUEUE STUB] Job added:`, job);

    // TODO: Implement with Bull/BullMQ
    // await emailQueue.add(job.type, job.data);
  }

  /**
   * Process jobs
   * Currently a stub
   */
  async processJobs(): Promise<void> {
    console.log("[QUEUE STUB] Processing jobs...");

    // TODO: Implement job processors
    // emailQueue.process(async (job) => { ... });
  }
}

export const queueService = new QueueService();

// Helper functions for common job types
export const queueHelpers = {
  /**
   * Queue email sending
   */
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await queueService.addJob({
      type: "send-email",
      data: { to, subject, body },
    });
  },

  /**
   * Queue vendor approval notification
   */
  async notifyVendorApproval(
    vendorId: string,
    approved: boolean,
  ): Promise<void> {
    await queueService.addJob({
      type: "vendor-approval-notification",
      data: { vendorId, approved },
    });
  },

  /**
   * Queue image optimization
   */
  async optimizeImages(imageUrls: string[]): Promise<void> {
    await queueService.addJob({
      type: "optimize-images",
      data: { imageUrls },
    });
  },
};
