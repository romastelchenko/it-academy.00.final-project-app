import { Injectable } from '@nestjs/common';
import { request, Dispatcher } from 'undici';
import { CircuitBreaker } from './circuit-breaker';

export class HttpClientError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

@Injectable()
export class HttpClientService {
  private readonly timeoutMs = parseInt(process.env.HTTP_TIMEOUT_MS || '3000', 10);
  private readonly maxResponseBytes = parseInt(process.env.MAX_RESPONSE_BYTES || '1048576', 10);
  private readonly breaker = new CircuitBreaker();

  async forward(
    serviceName: 'player-service' | 'game-service' | 'team-service' | 'result-service',
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: any;
    },
  ) {
    if (!this.breaker.canRequest(serviceName)) {
      throw new HttpClientError(503, 'SERVICE_UNAVAILABLE', `${serviceName} unavailable`, {
        service: serviceName,
      });
    }

    const isGet = options.method.toUpperCase() === 'GET';
    const attempts = isGet ? 2 : 1;
    let lastError: unknown;

    for (let i = 0; i < attempts; i += 1) {
      try {
        const res = await request(url, {
          method: options.method as Dispatcher.HttpMethod,
          headers: options.headers,
          body: options.body,
          headersTimeout: this.timeoutMs,
          bodyTimeout: this.timeoutMs,
        });

        const chunks: Buffer[] = [];
        for await (const chunk of res.body) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        if (buffer.length > this.maxResponseBytes) {
          throw new HttpClientError(502, 'PAYLOAD_TOO_LARGE', 'Response too large', {
            service: serviceName,
            maxBytes: this.maxResponseBytes,
          });
        }

        const text = buffer.toString('utf8');
        const contentType =
          typeof (res.headers as any).get === 'function'
            ? (res.headers as any).get('content-type') || ''
            : (res.headers as any)['content-type']?.toString() || '';
        const parsed = contentType.includes('application/json') && text ? JSON.parse(text) : text;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.breaker.recordSuccess(serviceName);
          return parsed;
        }

        const status = res.statusCode;
        if (status >= 400 && status < 500) {
          throw new HttpClientError(status, 'UPSTREAM_4XX', 'Upstream client error', {
            service: serviceName,
            upstreamStatus: status,
            body: parsed,
          });
        }

        throw new HttpClientError(502, 'UPSTREAM_5XX', 'Upstream server error', {
          service: serviceName,
          upstreamStatus: status,
          body: parsed,
        });
      } catch (err) {
        lastError = err;
        this.breaker.recordFailure(serviceName);
        if (err instanceof HttpClientError) {
          if (!isGet || err.status < 500) {
            throw err;
          }
        }
      }
    }

    if (lastError instanceof HttpClientError) {
      throw lastError;
    }

    throw new HttpClientError(503, 'SERVICE_UNAVAILABLE', `${serviceName} unavailable`, {
      service: serviceName,
    });
  }
}
