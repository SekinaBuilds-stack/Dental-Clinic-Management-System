// backend/src/scheduler/scheduler.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/scheduler',
})
export class SchedulerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SchedulerGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to scheduler socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from scheduler socket: ${client.id}`);
  }

  // TR-APT-007: Broadcast appointment update to all clients
  broadcastAppointmentUpdate(appointmentData: any) {
    this.server.emit('appointment:updated', appointmentData);
    this.logger.log(`Broadcasted appointment:updated for ID: ${appointmentData.id}`);
  }

  broadcastAppointmentCreated(appointmentData: any) {
    this.server.emit('appointment:created', appointmentData);
    this.logger.log(`Broadcasted appointment:created for ID: ${appointmentData.id}`);
  }

  broadcastChairUpdate(chairData: any) {
    this.server.emit('chair:updated', chairData);
    this.logger.log(`Broadcasted chair:updated for Chair ID: ${chairData.chairId}`);
  }
}