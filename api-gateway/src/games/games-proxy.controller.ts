import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HttpClientService } from '../http/http-client.service';
import { buildForwardHeaders } from '../common/header-utils';

@ApiTags('games-proxy')
@Controller('games')
export class GamesProxyController {
  private readonly baseUrl = process.env.GAME_SVC_URL || 'http://game-service:3002';

  constructor(private readonly http: HttpClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create game' })
  create(@Req() req: Request, @Body() body: any) {
    return this.http.forward('game-service', `${this.baseUrl}/games`, {
      method: 'POST',
      headers: buildForwardHeaders(req),
      body: JSON.stringify(body ?? {}),
    });
  }

  @Get()
  @ApiOperation({ summary: 'List games' })
  list(@Req() req: Request) {
    const url = `${this.baseUrl}${req.originalUrl.replace('/api/v1', '')}`;
    return this.http.forward('game-service', url, {
      method: 'GET',
      headers: buildForwardHeaders(req),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game' })
  get(@Param('id') id: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${id}`;
    return this.http.forward('game-service', url, {
      method: 'GET',
      headers: buildForwardHeaders(req),
    });
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participants' })
  addParticipants(@Param('id') id: string, @Req() req: Request, @Body() body: any) {
    const url = `${this.baseUrl}/games/${id}/participants`;
    return this.http.forward('game-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
      body: JSON.stringify(body ?? {}),
    });
  }

  @Patch(':id/participants/:playerId')
  @ApiOperation({ summary: 'Update invite status' })
  updateInviteStatus(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const url = `${this.baseUrl}/games/${id}/participants/${playerId}`;
    return this.http.forward('game-service', url, {
      method: 'PATCH',
      headers: buildForwardHeaders(req),
      body: JSON.stringify(body ?? {}),
    });
  }

  @Delete(':id/participants/:playerId')
  @ApiOperation({ summary: 'Remove participant' })
  removeParticipant(@Param('id') id: string, @Param('playerId') playerId: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${id}/participants/${playerId}`;
    return this.http.forward('game-service', url, {
      method: 'DELETE',
      headers: buildForwardHeaders(req),
    });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm game' })
  confirm(@Param('id') id: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${id}/confirm`;
    return this.http.forward('game-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel game' })
  cancel(@Param('id') id: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${id}/cancel`;
    return this.http.forward('game-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
    });
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen game' })
  reopen(@Param('id') id: string, @Req() req: Request) {
    const url = `${this.baseUrl}/games/${id}/reopen`;
    return this.http.forward('game-service', url, {
      method: 'POST',
      headers: buildForwardHeaders(req),
    });
  }
}
