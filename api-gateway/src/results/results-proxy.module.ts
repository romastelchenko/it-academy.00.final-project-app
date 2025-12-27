import { Module } from '@nestjs/common';
import { ResultsProxyController } from './results-proxy.controller';
import { HttpClientModule } from '../http/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [ResultsProxyController],
})
export class ResultsProxyModule {}
