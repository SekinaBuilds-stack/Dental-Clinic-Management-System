import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Processor('inventory-expiry-queue')
export class InventoryExpiryProcessor extends WorkerHost {
  constructor(private notifService: NotificationsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { itemId, batchNumber, expiryDate } = job.data;
    await this.notifService.createNotification({
      type: NotificationType.EXPIRY_WARNING,
      title: `Batch Expiry Warning: ${batchNumber}`,
      message: `Item stock batch ${batchNumber} is approaching its expiry date (${expiryDate}).`,
    });
    return { processed: true };
  }
}