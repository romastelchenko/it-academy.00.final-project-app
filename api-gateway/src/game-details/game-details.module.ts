import { Module } from '@nestjs/common';
import { GameDetailsController } from './game-details.controller';
import { GameDetailsService } from './game-details.service';
import { HttpClientModule } from '../http/http-client.module';

@Module({
  imports: [HttpClientModule],
  controllers: [GameDetailsController],
  providers: [GameDetailsService],
})
export class GameDetailsModule {}
