import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';

@ApiTags('results')
@Controller('games/:gameId/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @ApiOperation({ summary: 'Create game result' })
  create(@Param('gameId') gameId: string, @Body() dto: CreateResultDto) {
    return this.resultsService.create(gameId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get game result' })
  get(@Param('gameId') gameId: string) {
    return this.resultsService.get(gameId);
  }
}
