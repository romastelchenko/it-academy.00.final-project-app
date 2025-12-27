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
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ListPlayersDto } from './dto/list-players.dto';
import { BatchPlayersDto } from './dto/batch-players.dto';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Create player' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List players' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'search', required: false })
  list(@Query() query: ListPlayersDto) {
    return this.playersService.list(query);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Get players by ids' })
  batch(@Body() dto: BatchPlayersDto) {
    return this.playersService.findByIds(dto.ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by id' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update player' })
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete player' })
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted player' })
  restore(@Param('id') id: string) {
    return this.playersService.restore(id);
  }
}
