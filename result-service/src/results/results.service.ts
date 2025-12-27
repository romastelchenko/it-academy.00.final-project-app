import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateResultDto, ResultLineDto } from './dto/create-result.dto';

function toBigInt(id: string) {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException('Invalid id');
  }
}

function serializeResult(result: any) {
  return {
    ...result,
    id: result.id.toString(),
    gameId: result.gameId.toString(),
    lines: result.lines?.map((line: any) => ({
      ...line,
      id: line.id.toString(),
      gameResultId: line.gameResultId.toString(),
      teamAId: line.teamAId.toString(),
      teamBId: line.teamBId.toString(),
    })),
  };
}

@Injectable()
export class ResultsService {
  private readonly gameServiceUrl = process.env.GAME_SVC_URL || 'http://game-service:3002';
  private readonly teamServiceUrl = process.env.TEAM_SVC_URL || 'http://team-service:3003';
  private readonly timeoutMs = parseInt(process.env.HTTP_TIMEOUT_MS || '3000', 10);

  constructor(private readonly prisma: PrismaService) {}

  private async fetchJson(url: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new BadRequestException(`Upstream error: ${res.status}`);
      }
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getGame(gameId: string) {
    return this.fetchJson(`${this.gameServiceUrl}/games/${gameId}`);
  }

  private async getLockedTeamSet(gameId: string) {
    const teamSets = await this.fetchJson(`${this.teamServiceUrl}/games/${gameId}/team-sets`);
    return (teamSets || []).find((ts: any) => ts.status === 'LOCKED');
  }

  private validatePairs(lines: ResultLineDto[], teamIds: Set<string>) {
    const seen = new Set<string>();
    for (const line of lines) {
      if (line.teamAId === line.teamBId) {
        throw new BadRequestException('Team ids must be different');
      }
      const key = [line.teamAId, line.teamBId].sort((a, b) => a - b).join('-');
      if (seen.has(key)) {
        throw new BadRequestException('Duplicate team pair');
      }
      seen.add(key);
      if (!teamIds.has(line.teamAId.toString()) || !teamIds.has(line.teamBId.toString())) {
        throw new BadRequestException('Team id not in locked team set');
      }
    }
  }

  async create(gameId: string, dto: CreateResultDto) {
    const game = await this.getGame(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (game.status !== 'CONFIRMED') {
      throw new ConflictException('Game must be CONFIRMED to add result');
    }

    const existing = await this.prisma.gameResult.findUnique({
      where: { gameId: toBigInt(gameId) },
    });
    if (existing) throw new ConflictException('Result already exists');

    const lockedTeamSet = await this.getLockedTeamSet(gameId);
    if (!lockedTeamSet) throw new ConflictException('No locked team set');

    const teamIds = new Set<string>((lockedTeamSet.teams || []).map((t: any) => t.id.toString()));

    let lines: ResultLineDto[] = [];
    if (dto.format === 'TWO_TEAMS') {
      if (!dto.teamAId || !dto.teamBId || dto.scoreA === undefined || dto.scoreB === undefined) {
        throw new BadRequestException('Missing fields for TWO_TEAMS');
      }
      lines = [{
        teamAId: dto.teamAId,
        teamBId: dto.teamBId,
        scoreA: dto.scoreA,
        scoreB: dto.scoreB,
      }];
    } else {
      if (!dto.lines || dto.lines.length !== 3) {
        throw new BadRequestException('THREE_TEAMS requires 3 lines');
      }
      lines = dto.lines;
    }

    this.validatePairs(lines, teamIds);

    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.gameResult.create({
        data: {
          gameId: toBigInt(gameId),
          format: dto.format,
        },
      });

      await tx.resultLine.createMany({
        data: lines.map((line) => ({
          gameResultId: created.id,
          teamAId: BigInt(line.teamAId),
          teamBId: BigInt(line.teamBId),
          scoreA: line.scoreA,
          scoreB: line.scoreB,
        })),
      });

      const full = await tx.gameResult.findUnique({
        where: { id: created.id },
        include: { lines: true },
      });

      if (!full) throw new NotFoundException('Result not found');
      return serializeResult(full);
    });

    return result;
  }

  async get(gameId: string) {
    const game = await this.getGame(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (game.status !== 'CONFIRMED' && game.status !== 'FINISHED') {
      throw new ConflictException('Game is not confirmed');
    }

    const result = await this.prisma.gameResult.findUnique({
      where: { gameId: toBigInt(gameId) },
      include: { lines: true },
    });

    if (!result) throw new NotFoundException('Result not found');
    return serializeResult(result);
  }
}
