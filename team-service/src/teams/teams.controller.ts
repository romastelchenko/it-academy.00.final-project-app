import { Controller, Get, Param, Patch, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { ManualUpdateDto } from './dto/manual-update.dto';

@ApiTags('teams')
@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('games/:gameId/team-sets/auto-generate')
  @ApiOperation({ summary: 'Auto-generate team set for game' })
  autoGenerate(@Param('gameId') gameId: string) {
    return this.teamsService.autoGenerate(gameId);
  }

  @Get('games/:gameId/team-sets')
  @ApiOperation({ summary: 'List team sets for game' })
  listTeamSets(@Param('gameId') gameId: string) {
    return this.teamsService.listTeamSets(gameId);
  }

  @Get('team-sets/:teamSetId')
  @ApiOperation({ summary: 'Get team set details' })
  getTeamSet(@Param('teamSetId') teamSetId: string) {
    return this.teamsService.getTeamSet(teamSetId);
  }

  @Patch('team-sets/:teamSetId/manual')
  @ApiOperation({ summary: 'Manual update team set' })
  manualUpdate(@Param('teamSetId') teamSetId: string, @Body() dto: ManualUpdateDto) {
    return this.teamsService.manualUpdate(teamSetId, dto);
  }

  @Post('team-sets/:teamSetId/lock')
  @ApiOperation({ summary: 'Lock team set' })
  lock(@Param('teamSetId') teamSetId: string) {
    return this.teamsService.lockTeamSet(teamSetId);
  }
}
