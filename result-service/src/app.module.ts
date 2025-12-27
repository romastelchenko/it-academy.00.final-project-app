import { Module } from '@nestjs/common';
import { ResultsModule } from './results/results.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [PrismaModule, ResultsModule, HealthModule],
})
export class AppModule {}
