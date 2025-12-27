import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { HttpClientModule } from './http/http-client.module';
import { PlayersProxyModule } from './players/players-proxy.module';
import { GamesProxyModule } from './games/games-proxy.module';
import { TeamsProxyModule } from './teams/teams-proxy.module';
import { ResultsProxyModule } from './results/results-proxy.module';
import { GameDetailsModule } from './game-details/game-details.module';
import { LoggerService } from './common/logger.service';

@Module({
  imports: [
    HealthModule,
    HttpClientModule,
    PlayersProxyModule,
    GamesProxyModule,
    TeamsProxyModule,
    ResultsProxyModule,
    GameDetailsModule,
  ],
  providers: [LoggerService],
})
export class AppModule {}
