import { Request } from 'express';

export function buildForwardHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const passthrough = ['content-type', 'accept', 'authorization', 'x-request-id'];
  for (const key of passthrough) {
    const value = req.header(key);
    if (value) headers[key] = value;
  }
  const requestId = (req as any).requestId;
  if (requestId && !headers['x-request-id']) {
    headers['x-request-id'] = requestId;
  }
  return headers;
}

export function extractPath(req: Request): string {
  return req.originalUrl.replace(/^\/api\/v1/, '');
}
