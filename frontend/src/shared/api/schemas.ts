import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  shirtNumber: z.number(),
  rating: z.number(),
  positionOnField: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const GameSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  location: z.string(),
  status: z.string(),
});

export const ParticipantSchema = z.object({
  playerId: z.string(),
  inviteStatus: z.string(),
  confirmedAt: z.string().nullable().optional(),
  player: PlayerSchema.nullable().optional(),
});

export const TeamPlayerSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  playerId: z.string(),
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderIndex: z.number(),
  players: z.array(TeamPlayerSchema),
  ratingSum: z.number().optional(),
});

export const TeamSetSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  mode: z.string(),
  status: z.string(),
  version: z.number(),
  teams: z.array(TeamSchema),
});

export const ResultLineSchema = z.object({
  id: z.string(),
  teamAId: z.string(),
  teamBId: z.string(),
  scoreA: z.number(),
  scoreB: z.number(),
});

export const ResultSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  format: z.string(),
  lines: z.array(ResultLineSchema),
});

export const GameDetailsSchema = z.object({
  game: GameSchema,
  participants: z.array(ParticipantSchema),
  teams: z
    .object({
      lockedTeamSet: TeamSetSchema.nullable(),
      lastDraftTeamSet: TeamSetSchema.nullable().optional(),
    })
    .nullable(),
  result: ResultSchema.nullable(),
  warnings: z.array(
    z.object({
      service: z.string(),
      code: z.string(),
      message: z.string(),
    }),
  ),
});

export type PlayerDTO = z.infer<typeof PlayerSchema>;
export type GameDTO = z.infer<typeof GameSchema>;
export type GameDetailsDTO = z.infer<typeof GameDetailsSchema>;
export type TeamSetDTO = z.infer<typeof TeamSetSchema>;
export type ResultDTO = z.infer<typeof ResultSchema>;
