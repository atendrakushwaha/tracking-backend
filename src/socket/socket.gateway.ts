import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { LocationService } from '../location/location.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private users = new Map<string, string>(); // userId -> socketId

  constructor(
    private locationService: LocationService,
    private configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'super-secret-key-change-me';
  }

  // 🔥 USER CONNECT
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      const decoded: any = jwt.verify(token, this.getJwtSecret());
      const userId = decoded.sub;

      this.users.set(userId, client.id);
      console.log(`✅ User connected: ${userId} (socket: ${client.id})`);
    } catch (err) {
      console.log('❌ Socket auth failed:', err.message);
      client.disconnect();
    }
  }

  // 🔥 USER DISCONNECT
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.users.entries()) {
      if (socketId === client.id) {
        this.users.delete(userId);
        console.log(`🔌 User disconnected: ${userId}`);
      }
    }
  }

  // 🔥 LOCATION UPDATE EVENT
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @MessageBody() data: { latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token = client.handshake.auth.token;
      const decoded: any = jwt.verify(token, this.getJwtSecret());
      const userId = decoded.sub;
      const userEmail = decoded.email;

      // 🔥 Save location
      await this.locationService.updateLocation(userId, data.latitude, data.longitude);

      // 🔥 Find nearby users (within 3km)
      const nearbyUsers = await this.locationService.findNearbyUsers(
        userId,
        data.latitude,
        data.longitude,
      );

      // 🔥 SEND REAL-TIME ALERT TO ALL NEARBY USERS
      nearbyUsers.forEach((user: any) => {
        const targetUserId = user.userId?._id?.toString() || user.userId?.toString();
        const targetSocketId = this.users.get(targetUserId);

        if (targetSocketId) {
          this.server.to(targetSocketId).emit('nearbyUserAlert', {
            userId,
            email: userEmail,
            name: decoded.name || userEmail,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      });

      return {
        status: 'ok',
        message: 'Location shared successfully',
        nearbyCount: nearbyUsers.length,
      };
    } catch (err) {
      console.log('Error in socket:', err.message);
      return { status: 'error', message: err.message };
    }
  }
}