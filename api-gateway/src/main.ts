import 'reflect-metadata';
import { json, Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { LoggerService } from './common/logger.service';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const logger = app.get(LoggerService);

  app.use(json({ limit: process.env.BODY_LIMIT || '1mb' }));
  app.use(RequestIdMiddleware);
  app.use((req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        latencyMs: Date.now() - start,
      });
    });
    next();
  });
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
