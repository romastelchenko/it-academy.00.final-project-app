import { apiFetch } from './apiClient';
import { GameSchema, GameDetailsSchema } from './schemas';
import { z } from 'zod';

const GamesListSchema = z.array(GameSchema);

export const gamesApi = {
  async list(from?: string, to?: string) {
    const query = new URLSearchParams({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }).toString();
    const data = await apiFetch(`/games?${query}`);
    return GamesListSchema.parse(data);
  },
  async create(payload: { startsAt: string; location: string }) {
    const data = await apiFetch('/games', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return GameSchema.parse(data);
  },
  async getDetails(gameId: string) {
    const data = await apiFetch(`/games/${gameId}/details`);
    return GameDetailsSchema.parse(data);
  },
  async confirm(gameId: string) {
    return apiFetch(`/games/${gameId}/confirm`, { method: 'POST' });
  },
  async cancel(gameId: string) {
    return apiFetch(`/games/${gameId}/cancel`, { method: 'POST' });
  },
  async reopen(gameId: string) {
    return apiFetch(`/games/${gameId}/reopen`, { method: 'POST' });
  },
  async addParticipants(gameId: string, playerIds: number[]) {
    return apiFetch(`/games/${gameId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ playerIds }),
    });
  },
  async updateInviteStatus(gameId: string, playerId: string, inviteStatus: 'INVITED' | 'CONFIRMED' | 'DECLINED') {
    return apiFetch(`/games/${gameId}/participants/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ inviteStatus }),
    });
  },
  async removeParticipant(gameId: string, playerId: string) {
    return apiFetch(`/games/${gameId}/participants/${playerId}`, { method: 'DELETE' });
  },
};
