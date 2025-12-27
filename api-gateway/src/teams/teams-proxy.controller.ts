import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HttpClientService } from '../http/http-client.service';
import { buildForwardHeaders } from '../common/header-utils';

@ApiTags('teams-proxy')
@Controller()
export class TeamsProxyController {
  private readonly baseUrl = process.env.TEAM_SVC_URL || 'http://team-service:3003';

  constructor(private readonly http: HttpClientService) {}

  @Post('games/:gameId/teams/auto-generate')
  @ApiOperation({ summary: 'Auto-generate team set' })
  autoGenerate(@Param('gameId') gameId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${gameId}/team-sets/auto-generate`;
    return this.http.forward('team-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
    });
  }

  @Get('games/:gameId/teams')
  @ApiOperation({ summary: 'List team sets' })
  list(@Param('gameId') gameId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${gameId}/team-sets`;
    return this.http.forward('team-service', url, {
      method: 'GET',
      headers: buildForwardHeaders(req),
    });
  }

  @Get('games/:gameId/teams/locked')
  @ApiOperation({ summary: 'Get locked team set' })
  async locked(@Param('gameId') gameId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${gameId}/team-sets`;
    const teamSets: any[] = await this.http.forward('team-service', url, {
      method: 'GET',
      headers: buildForwardHeaders(req),
    });
    return teamSets.find((ts) => ts.status === 'LOCKED') || null;
  }

  @Patch('team-sets/:teamSetId/manual')
  @ApiOperation({ summary: 'Manual update team set' })
  manual(@Param('teamSetId') teamSetId: string, @Req() req: Request, @Body() body: any) {
    const url = `${this.baseUrl}/team-sets/${teamSetId}/manual`;
    return this.http.forward('team-service', url, {
      method: 'PATCH',
      headers: buildForwardHeaders(req),
      body: JSON.stringify(body ?? {}),
    });
  }

  @Post('team-sets/:teamSetId/lock')
  @ApiOperation({ summary: 'Lock team set' })
  lock(@Param('teamSetId') teamSetId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/team-sets/${teamSetId}/lock`;
    return this.http.forward('team-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
    });
  }
}
