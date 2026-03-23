import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { LocationModule } from '../location/location.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LocationModule, ConfigModule],
  providers: [SocketGateway],
})
export class SocketModule {}