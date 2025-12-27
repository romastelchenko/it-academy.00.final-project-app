import { Module } from '@nestjs/common';
import { PlayersProxyController } from './players-proxy.controller';
import { HttpClientModule } from '../http/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [PlayersProxyController],
})
export class PlayersProxyModule {}
