import { Module } from '@nestjs/common';
import { TeamsModule } from './teams/teams.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [PrismaModule, TeamsModule, HealthModule],
})
export class AppModule {}
