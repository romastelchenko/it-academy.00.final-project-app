import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HttpClientService } from '../http/http-client.service';
import { buildForwardHeaders } from '../common/header-utils';

@ApiTags('results-proxy')
@Controller('games')
export class ResultsProxyController {
  private readonly baseUrl = process.env.RESULT_SVC_URL || 'http://result-service:3004';

  constructor(private readonly http: HttpClientService) {}

  @Post(':gameId/results')
  @ApiOperation({ summary: 'Create game result' })
  create(@Param('gameId') gameId: string, @Req() req: Request, @Body() body: any) {
    const url = `${this.baseUrl}/games/${gameId}/results`;
    return this.http.forward('result-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
      body: JSON.stringify(body ?? {}),
    });
  }

  @Get(':gameId/results')
  @ApiOperation({ summary: 'Get game result' })
  get(@Param('gameId') gameId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${gameId}/results`;
    return this.http.forward('result-service', url, {
      method: 'GET',
      headers: buildForwardHeaders(req),
    });
  }
}
