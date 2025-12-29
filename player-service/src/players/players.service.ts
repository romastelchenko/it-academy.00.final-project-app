import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ListPlayersDto } from './dto/list-players.dto';

function serializePlayer(player: any) {
  return {
    ...player,
    id: player.id.toString(),
    deletedAt: player.deletedAt ? player.deletedAt.toISOString() : null,
  };
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlayerDto) {
    try {
      const player = await this.prisma.player.create({ data: dto });
      return serializePlayer(player);
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('Player with same unique field exists');
      }
      throw err;
    }
  }

  async list(query: ListPlayersDto) {
    const skip = (query.page - 1) * query.limit;
    const baseWhere: any = query.search
      ? {
          OR: [
            { nickname: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
          ],
        }
      : {};
    const where = query.includeDeleted ? baseWhere : { ...baseWhere, deletedAt: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.player.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.order },
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      items: null,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findByIds(ids: number[]) {
    const bigIds = ids.map((id) => BigInt(id));
    const players = await this.prisma.player.findMany({
      where: { id: { in: bigIds }, deletedAt: null },
    });
    return players.map(serializePlayer);
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });
    if (!player) throw new NotFoundException('Player not found');
    return serializePlayer(player);
  }

  async update(id: string, dto: UpdatePlayerDto) {
    try {
      const player = await this.prisma.player.update({
        where: { id: BigInt(id) },
        data: dto,
      });
      return serializePlayer(player);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Player not found');
      if (err.code === 'P2002') throw new ConflictException('Player with same unique field exists');
      throw err;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.player.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date() },
      });
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Player not found');
      throw err;
    }
  }

  async restore(id: string) {
    try {
      const player = await this.prisma.player.update({
        where: { id: BigInt(id) },
        data: { deletedAt: null },
      });
      return serializePlayer(player);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Player not found');
      throw err;
    }
  }
}
