import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { ListGamesDto } from './dto/list-games.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UpdateInviteStatusDto } from './dto/update-invite-status.dto';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @ApiOperation({ summary: 'Create game' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List games by period' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  list(@Query() query: ListGamesDto) {
    return this.gamesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game details' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Bulk add participants' })
  addParticipants(@Param('id') id: string, @Body() dto: AddParticipantsDto) {
    return this.gamesService.addParticipants(id, dto);
  }

  @Patch(':id/participants/:playerId')
  @ApiOperation({ summary: 'Update invite status' })
  updateInviteStatus(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateInviteStatusDto,
  ) {
    return this.gamesService.updateInviteStatus(id, playerId, dto);
  }

  @Delete(':id/participants/:playerId')
  @ApiOperation({ summary: 'Remove participant' })
  removeParticipant(@Param('id') id: string, @Param('playerId') playerId: string) {
    return this.gamesService.removeParticipant(id, playerId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm game participants list' })
  confirm(@Param('id') id: string) {
    return this.gamesService.confirmGame(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel game' })
  cancel(@Param('id') id: string) {
    return this.gamesService.cancelGame(id);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen cancelled game' })
  reopen(@Param('id') id: string) {
    return this.gamesService.reopenGame(id);
  }
}
