import { apiFetch } from './apiClient';
import { TeamSetSchema } from './schemas';
import { z } from 'zod';

const TeamSetListSchema = z.array(TeamSetSchema);

export const teamsApi = {
  async autoGenerate(gameId: string) {
    const data = await apiFetch(`/games/${gameId}/teams/auto-generate`, { method: 'POST' });
    return TeamSetSchema.parse(data);
  },
  async list(gameId: string) {
    const data = await apiFetch(`/games/${gameId}/teams`);
    return TeamSetListSchema.parse(data);
  },
  async lock(teamSetId: string) {
    const data = await apiFetch(`/team-sets/${teamSetId}/lock`, { method: 'POST' });
    return TeamSetSchema.parse(data);
  },
  async manual(teamSetId: string, payload: any) {
    const data = await apiFetch(`/team-sets/${teamSetId}/manual`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return TeamSetSchema.parse(data);
  },
};
