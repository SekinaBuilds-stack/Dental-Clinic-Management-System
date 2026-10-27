// backend/src/scheduler/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token =
        client.handshake.auth?.token?.split(' ')[1] ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Missing authentication token.');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-key',
      });

      (client as any).user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized socket connection.');
    }
  }
}