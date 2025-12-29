import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Player Service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
