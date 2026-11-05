import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Processor('appointment-reminder-queue')
export class AppointmentReminderProcessor extends WorkerHost {
  constructor(private notifService: NotificationsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { appointmentId, patientName, appointmentTime } = job.data;
    await this.notifService.createNotification({
      type: NotificationType.APPOINTMENT_REMINDER,
      title: `Appointment Reminder: ${patientName}`,
      message: `Upcoming appointment scheduled for ${patientName} at ${appointmentTime} (TR-APT-005).`,
    });
    return { processed: true };
  }
}