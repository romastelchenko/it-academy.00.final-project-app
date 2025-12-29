import 'reflect-metadata';
import { json, Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { LoggerService } from './common/logger.service';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const logger = app.get(LoggerService);
  const metricsRegistry = new Registry();
  collectDefaultMetrics({ register: metricsRegistry });
  const httpRequestsTotal = new Counter({
    name: 'http_server_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [metricsRegistry],
  });
  const httpRequestDuration = new Histogram({
    name: 'http_server_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [metricsRegistry],
  });
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });

  app.use(json({ limit: process.env.BODY_LIMIT || '1mb' }));
  app.use(RequestIdMiddleware);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    res.on('finish', () => {
      const [seconds, nanos] = process.hrtime(start);
      const duration = seconds + nanos / 1e9;
      const route = (req.route && req.route.path) || req.path;
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
    });
    next();
  });
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
