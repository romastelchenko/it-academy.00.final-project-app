import { apiFetch } from './apiClient';
import { PlayerSchema, PlayerDTO } from './schemas';
import { z } from 'zod';

const PlayerListSchema = z.object({
  items: z.array(PlayerSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const playersApi = {
  async list(params: Record<string, string | number>) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const data = await apiFetch(`/players?${query}`);
    return PlayerListSchema.parse(data);
  },
  async create(payload: Omit<PlayerDTO, 'id' | 'deletedAt'>) {
    const data = await apiFetch('/players', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return PlayerSchema.parse(data);
  },
  async update(id: string, payload: Partial<Omit<PlayerDTO, 'id' | 'deletedAt'>>) {
    const data = await apiFetch(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return PlayerSchema.parse(data);
  },
  async remove(id: string) {
    await apiFetch(`/players/${id}`, { method: 'DELETE' });
  },
  async restore(id: string) {
    const data = await apiFetch(`/players/${id}/restore`, { method: 'POST' });
    return PlayerSchema.parse(data);
  },
};
