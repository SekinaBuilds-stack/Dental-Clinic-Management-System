import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async createNotification(data: { type: NotificationType; title: string; message: string; recipientId?: string }) {
    const notif = this.notifRepo.create(data);
    return this.notifRepo.save(notif);
  }

  async findAll() {
    return this.notifRepo.find({ order: { createdAt: 'DESC' } });
  }

  async markAsRead(id: string) {
    await this.notifRepo.update(id, { isRead: true });
    return { success: true };
  }
}