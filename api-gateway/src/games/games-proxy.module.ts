import { Module } from '@nestjs/common';
import { GamesProxyController } from './games-proxy.controller';
import { HttpClientModule } from '../http/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [GamesProxyController],
})
export class GamesProxyModule {}
