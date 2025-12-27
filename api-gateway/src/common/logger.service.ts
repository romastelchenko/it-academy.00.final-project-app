import { Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
  });

  info(data: Record<string, unknown>) {
    this.logger.info(data);
  }

  error(data: Record<string, unknown>) {
    this.logger.error(data);
  }
}
