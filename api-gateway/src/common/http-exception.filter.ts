import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from './logger.service';
import { HttpClientError } from '../http/http-client.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req: any = ctx.getRequest();
    const requestId = req?.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: any = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error',
      },
    };

    if (exception instanceof HttpClientError) {
      status = exception.status;
      payload = {
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;
      payload = {
        error: {
          code: response?.error || 'BAD_REQUEST',
          message: response?.message || 'Request failed',
          details: response,
        },
      };
    }

    this.logger.error({
      requestId,
      status,
      error: payload.error,
    });

    res.status(status).json(payload);
  }
}
