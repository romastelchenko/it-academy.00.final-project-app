import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ManualUpdateDto } from './dto/manual-update.dto';

const CONFIRMABLE_COUNTS = new Set([10, 11, 12, 15]);

function toBigInt(id: string) {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException('Invalid id');
  }
}

function serializeTeamSet(teamSet: any) {
  return {
    ...teamSet,
    id: teamSet.id.toString(),
    gameId: teamSet.gameId.toString(),
    teams: teamSet.teams?.map(serializeTeam) ?? [],
  };
}

function serializeTeam(team: any) {
  return {
    ...team,
    id: team.id.toString(),
    teamSetId: team.teamSetId.toString(),
    players: team.players?.map((p: any) => ({
      ...p,
      id: p.id.toString(),
      teamId: p.teamId.toString(),
      playerId: p.playerId.toString(),
    })) ?? [],
  };
}

function snakeDraft<T>(items: T[], teamCount: number): T[][] {
  const teams: T[][] = Array.from({ length: teamCount }, () => []);
  let index = 0;
  let direction = 1;
  for (const item of items) {
    teams[index].push(item);
    if (direction === 1 && index === teamCount - 1) direction = -1;
    else if (direction === -1 && index === 0) direction = 1;
    else index += direction;
  }
  return teams;
}

@Injectable()
export class TeamsService {
  private readonly gameServiceUrl = process.env.GAME_SVC_URL || 'http://game-service:3002';
  private readonly playerServiceUrl = process.env.PLAYER_SVC_URL || 'http://player-service:3001';
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

  private async getGameDetails(gameId: string) {
    return this.fetchJson(`${this.gameServiceUrl}/games/${gameId}`);
  }

  private async getPlayer(playerId: string) {
    return this.fetchJson(`${this.playerServiceUrl}/players/${playerId}`);
  }

  async autoGenerate(gameId: string) {
    const game = await this.getGameDetails(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (game.status !== 'CONFIRMED') {
      throw new ConflictException('Game must be CONFIRMED');
    }

    const confirmed = (game.participants || []).filter((p: any) => p.inviteStatus === 'CONFIRMED');
    const confirmedCount = confirmed.length;
    if (!CONFIRMABLE_COUNTS.has(confirmedCount)) {
      throw new BadRequestException('Invalid number of confirmed participants');
    }

    const teamCount = confirmedCount === 15 ? 3 : 2;
    const playerIds = confirmed.map((p: any) => p.playerId.toString());
    const players = await Promise.all(playerIds.map((id: string) => this.getPlayer(id)));

    const rated = players.map((p: any) => ({ id: p.id.toString(), rating: p.rating }));
    rated.sort((a, b) => b.rating - a.rating);

    const teams = snakeDraft(rated, teamCount);

    const latest = await this.prisma.teamSet.aggregate({
      where: { gameId: toBigInt(gameId) },
      _max: { version: true },
    });

    const version = (latest._max.version || 0) + 1;

    const result = await this.prisma.$transaction(async (tx) => {
      const teamSet = await tx.teamSet.create({
        data: {
          gameId: toBigInt(gameId),
          mode: 'AUTO',
          status: 'DRAFT',
          version,
        },
      });

      const createdTeams = await Promise.all(
        teams.map((_, index) =>
          tx.team.create({
            data: {
              teamSetId: teamSet.id,
              name: `Team ${index + 1}`,
              orderIndex: index + 1,
            },
          }),
        ),
      );

      for (let i = 0; i < createdTeams.length; i += 1) {
        const team = createdTeams[i];
        const playersForTeam = teams[i];
        if (playersForTeam.length === 0) continue;
        await tx.teamPlayer.createMany({
          data: playersForTeam.map((p) => ({
            teamId: team.id,
            playerId: BigInt(p.id),
          })),
        });
      }

      const full = await tx.teamSet.findUnique({
        where: { id: teamSet.id },
        include: { teams: { include: { players: true } } },
      });

      if (!full) throw new NotFoundException('Team set not found');
      return serializeTeamSet(full);
    });

    return result;
  }

  async listTeamSets(gameId: string) {
    const teamSets = await this.prisma.teamSet.findMany({
      where: { gameId: toBigInt(gameId) },
      orderBy: { version: 'asc' },
      include: { teams: { include: { players: true } } },
    });

    return teamSets.map(serializeTeamSet);
  }

  async getTeamSet(teamSetId: string) {
    const teamSet = await this.prisma.teamSet.findUnique({
      where: { id: toBigInt(teamSetId) },
      include: { teams: { include: { players: true } } },
    });
    if (!teamSet) throw new NotFoundException('Team set not found');
    return serializeTeamSet(teamSet);
  }

  async manualUpdate(teamSetId: string, dto: ManualUpdateDto) {
    if (!dto.move && !dto.teams) {
      throw new BadRequestException('Provide move or teams payload');
    }

    const teamSet = await this.prisma.teamSet.findUnique({
      where: { id: toBigInt(teamSetId) },
      include: { teams: { include: { players: true } } },
    });

    if (!teamSet) throw new NotFoundException('Team set not found');
    if (teamSet.status === 'LOCKED') throw new ConflictException('Team set is locked');

    if (dto.move) {
      const fromTeam = teamSet.teams.find((t) => t.id === BigInt(dto.move!.fromTeamId));
      const toTeam = teamSet.teams.find((t) => t.id === BigInt(dto.move!.toTeamId));
      if (!fromTeam || !toTeam) throw new NotFoundException('Team not found');

      const exists = fromTeam.players.find((p) => p.playerId === BigInt(dto.move!.playerId));
      if (!exists) throw new NotFoundException('Player not in from-team');

      await this.prisma.$transaction(async (tx) => {
        await tx.teamPlayer.delete({ where: { id: exists.id } });
        await tx.teamPlayer.create({
          data: {
            teamId: toTeam.id,
            playerId: BigInt(dto.move!.playerId),
          },
        });
      });

      return this.getTeamSet(teamSetId);
    }

    if (dto.teams) {
      const teamIds = new Set(teamSet.teams.map((t) => t.id.toString()));
      const incomingIds = new Set(dto.teams.map((t) => t.teamId.toString()));
      for (const id of incomingIds) {
        if (!teamIds.has(id)) throw new NotFoundException('Team not found');
      }

      const allPlayerIds: number[] = dto.teams.flatMap((t) => t.playerIds);
      const unique = new Set(allPlayerIds);
      if (unique.size !== allPlayerIds.length) {
        throw new BadRequestException('Duplicate player assignments');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.teamPlayer.deleteMany({
          where: { teamId: { in: teamSet.teams.map((t) => t.id) } },
        });

        for (const team of dto.teams!) {
          if (team.playerIds.length === 0) continue;
          await tx.teamPlayer.createMany({
            data: team.playerIds.map((playerId) => ({
              teamId: BigInt(team.teamId),
              playerId: BigInt(playerId),
            })),
          });
        }
      });

      return this.getTeamSet(teamSetId);
    }

    throw new BadRequestException('Invalid manual update payload');
  }

  async lockTeamSet(teamSetId: string) {
    const teamSet = await this.prisma.teamSet.findUnique({
      where: { id: toBigInt(teamSetId) },
    });
    if (!teamSet) throw new NotFoundException('Team set not found');
    if (teamSet.status === 'LOCKED') return teamSet;

    const game = await this.getGameDetails(teamSet.gameId.toString());
    if (!game || game.status !== 'CONFIRMED') {
      throw new ConflictException('Game must be CONFIRMED to lock team set');
    }

    const updated = await this.prisma.teamSet.update({
      where: { id: teamSet.id },
      data: { status: 'LOCKED' },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      gameId: updated.gameId.toString(),
    };
  }
}
