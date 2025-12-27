import { Module } from '@nestjs/common';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [PrismaModule, GamesModule, HealthModule],
})
export class AppModule {}
