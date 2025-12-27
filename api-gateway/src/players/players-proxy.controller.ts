import { All, Body, Controller, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HttpClientService } from '../http/http-client.service';
import { buildForwardHeaders, extractPath } from '../common/header-utils';

@ApiTags('players-proxy')
@Controller('players')
export class PlayersProxyController {
  private readonly baseUrl = process.env.PLAYER_SVC_URL || 'http://player-service:3001';

  constructor(private readonly http: HttpClientService) {}

  @All()
  @ApiOperation({ summary: 'Proxy to player service (base)' })
  proxyBase(@Req() req: Request, @Body() body: any) {
    const path = extractPath(req);
    const url = `${this.baseUrl}${path}`;
    const headers = buildForwardHeaders(req);
    const method = req.method.toUpperCase();
    const payload = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body ?? {});
    return this.http.forward('player-service', url, { method, headers, body: payload });
  }

  @All('*')
  @ApiOperation({ summary: 'Proxy to player service' })
  proxy(@Req() req: Request, @Body() body: any) {
    const path = extractPath(req);
    const url = `${this.baseUrl}${path}`;
    const headers = buildForwardHeaders(req);
    const method = req.method.toUpperCase();
    const payload = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body ?? {});
    return this.http.forward('player-service', url, { method, headers, body: payload });
  }
}
