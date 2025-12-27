import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GameDetailsService } from './game-details.service';

@ApiTags('game-details')
@Controller('games')
export class GameDetailsController {
  constructor(private readonly service: GameDetailsService) {}

  @Get(':id/details')
  @ApiOperation({ summary: 'Get game details for UI' })
  getDetails(@Param('id') id: string, @Req() req: Request) {
    const requestId = (req as any).requestId || '';
    return this.service.getDetails(id, requestId);
  }
}
