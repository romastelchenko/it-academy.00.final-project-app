import { Module } from '@nestjs/common';
import { TeamsProxyController } from './teams-proxy.controller';
import { HttpClientModule } from '../http/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [TeamsProxyController],
})
export class TeamsProxyModule {}
