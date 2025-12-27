import { Module } from '@nestjs/common';
import { PlayersModule } from './players/players.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [PrismaModule, PlayersModule, HealthModule],
})
export class AppModule {}
