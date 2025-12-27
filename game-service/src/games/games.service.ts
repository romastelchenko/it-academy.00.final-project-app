import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { ListGamesDto } from './dto/list-games.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UpdateInviteStatusDto } from './dto/update-invite-status.dto';

const CONFIRMABLE_COUNTS = new Set([10, 11, 12, 15]);

function toBigInt(id: string) {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException('Invalid id');
  }
}

function serializeGame(game: any) {
  return {
    ...game,
    id: game.id.toString(),
    startsAt: game.startsAt instanceof Date ? game.startsAt.toISOString() : game.startsAt,
  };
}

function serializeParticipant(participant: any) {
  return {
    ...participant,
    id: participant.id.toString(),
    gameId: participant.gameId.toString(),
    playerId: participant.playerId.toString(),
    confirmedAt: participant.confirmedAt ? participant.confirmedAt.toISOString() : null,
  };
}

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGameDto) {
    const game = await this.prisma.game.create({
      data: {
        startsAt: new Date(dto.startsAt),
        location: dto.location,
      },
    });
    return serializeGame(game);
  }

  async list(query: ListGamesDto) {
    const where: any = {};
    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = new Date(query.from);
      if (query.to) where.startsAt.lte = new Date(query.to);
    }

    const games = await this.prisma.game.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });

    return games.map(serializeGame);
  }

  async findOne(id: string) {
    const gameId = toBigInt(id);
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { participants: true },
    });
    if (!game) throw new NotFoundException('Game not found');
    return {
      ...serializeGame(game),
      participants: game.participants.map(serializeParticipant),
    };
  }

  async addParticipants(id: string, dto: AddParticipantsDto) {
    const gameId = toBigInt(id);
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status === 'CONFIRMED' || game.status === 'FINISHED') {
      throw new ConflictException('Game participants are locked');
    }

    const now = new Date();
    await this.prisma.gameParticipant.createMany({
      data: dto.playerIds.map((playerId) => ({
        gameId,
        playerId: BigInt(playerId),
        inviteStatus: 'CONFIRMED',
        confirmedAt: now,
      })),
      skipDuplicates: true,
    });

    return this.findOne(id);
  }

  async updateInviteStatus(id: string, playerId: string, dto: UpdateInviteStatusDto) {
    const gameId = toBigInt(id);
    const pid = toBigInt(playerId);

    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status === 'CONFIRMED' || game.status === 'FINISHED') {
      throw new ConflictException('Game participants are locked');
    }

    const confirmedAt = dto.inviteStatus === 'CONFIRMED' ? new Date() : null;
    try {
      const participant = await this.prisma.gameParticipant.update({
        where: { gameId_playerId: { gameId, playerId: pid } },
        data: {
          inviteStatus: dto.inviteStatus,
          confirmedAt,
        },
      });
      return serializeParticipant(participant);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Participant not found');
      throw err;
    }
  }

  async removeParticipant(id: string, playerId: string) {
    const gameId = toBigInt(id);
    const pid = toBigInt(playerId);

    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status === 'FINISHED') throw new ConflictException('Game is finished');

    try {
      await this.prisma.gameParticipant.delete({
        where: { gameId_playerId: { gameId, playerId: pid } },
      });
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Participant not found');
      throw err;
    }
  }

  async confirmGame(id: string) {
    const gameId = toBigInt(id);
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status === 'CONFIRMED') return serializeGame(game);

    const confirmedCount = await this.prisma.gameParticipant.count({
      where: { gameId, inviteStatus: 'CONFIRMED' },
    });

    if (!CONFIRMABLE_COUNTS.has(confirmedCount)) {
      throw new BadRequestException('Invalid number of confirmed participants');
    }

    const updated = await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'CONFIRMED' },
    });

    return serializeGame(updated);
  }

  async cancelGame(id: string) {
    const gameId = toBigInt(id);
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status === 'FINISHED') throw new ConflictException('Cannot cancel finished game');

    const updated = await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'CANCELLED' },
    });

    return serializeGame(updated);
  }

  async reopenGame(id: string) {
    const gameId = toBigInt(id);
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.status !== 'CANCELLED') throw new ConflictException('Game is not cancelled');

    const updated = await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'CONFIRMING' },
    });

    return serializeGame(updated);
  }
}
