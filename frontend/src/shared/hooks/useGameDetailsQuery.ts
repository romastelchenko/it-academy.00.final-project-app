import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@shared/api/gamesApi';

export const gameDetailsKey = (gameId: string) => ['gameDetails', gameId] as const;

export function useGameDetailsQuery(gameId: string) {
  return useQuery({
    queryKey: gameDetailsKey(gameId),
    queryFn: () => gamesApi.getDetails(gameId),
  });
}
