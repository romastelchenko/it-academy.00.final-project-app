import { apiFetch } from './apiClient';
import { ResultSchema } from './schemas';

export const resultsApi = {
  async get(gameId: string) {
    const data = await apiFetch(`/games/${gameId}/results`);
    return ResultSchema.parse(data);
  },
  async create(gameId: string, payload: any) {
    const data = await apiFetch(`/games/${gameId}/results`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return ResultSchema.parse(data);
  },
};
