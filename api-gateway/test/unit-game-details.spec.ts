import { GameDetailsService } from '../src/game-details/game-details.service';
import { HttpClientError } from '../src/http/http-client.service';

class MockHttpClient {
  private handlers: Record<string, (...args: any[]) => any>;

  constructor(handlers: Record<string, (...args: any[]) => any>) {
    this.handlers = handlers;
  }

  async forward(service: string, url: string, options: any) {
    const key = `${service}:${url}`;
    if (this.handlers[key]) {
      return this.handlers[key](options);
    }
    if (this.handlers[service]) {
      return this.handlers[service](url, options);
    }
    throw new Error(`Unhandled request: ${key}`);
  }
}

describe('GameDetailsService', () => {
  it('returns full details when all services are available', async () => {
    const gameId = '1';
    const mock = new MockHttpClient({
      'game-service': () => ({
        id: gameId,
        startsAt: '2025-01-01T18:00:00Z',
        location: 'A',
        status: 'CONFIRMED',
        participants: [
          { playerId: '10', inviteStatus: 'CONFIRMED', confirmedAt: '2025-01-01T12:00:00Z' },
          { playerId: '11', inviteStatus: 'CONFIRMED', confirmedAt: '2025-01-01T12:00:00Z' },
        ],
      }),
      'player-service': () => ([
        { id: '10', rating: 80, nickname: 'p10' },
        { id: '11', rating: 70, nickname: 'p11' },
      ]),
      'team-service': () => ([
        {
          id: '5',
          status: 'LOCKED',
          version: 1,
          teams: [
            { id: '100', players: [{ playerId: '10' }] },
            { id: '101', players: [{ playerId: '11' }] },
          ],
        },
      ]),
      'result-service': () => ({ id: '200', gameId: gameId, format: 'TWO_TEAMS' }),
    });

    const service = new GameDetailsService(mock as any);
    const details = await service.getDetails(gameId, 'req-1');

    expect(details.game.id).toBe(gameId);
    expect(details.warnings.length).toBe(0);
    expect(details.participants.length).toBe(2);
    expect(details.participants[0].player?.nickname).toBe('p10');
    expect(details.teams?.lockedTeamSet?.teams?.[0]?.ratingSum).toBe(80);
  });

  it('returns partial data when player service fails', async () => {
    const gameId = '2';
    const mock = new MockHttpClient({
      'game-service': () => ({
        id: gameId,
        startsAt: '2025-01-01T18:00:00Z',
        location: 'B',
        status: 'CONFIRMED',
        participants: [{ playerId: '20', inviteStatus: 'CONFIRMED' }],
      }),
      'player-service': () => {
        throw new Error('player down');
      },
      'team-service': () => ([]),
      'result-service': () => {
        throw new HttpClientError(404, 'NOT_FOUND', 'Not found', { service: 'result-service' });
      },
    });

    const service = new GameDetailsService(mock as any);
    const details = await service.getDetails(gameId, 'req-2');

    expect(details.participants[0].player).toBeNull();
    expect(details.result).toBeNull();
    expect(details.warnings.length).toBeGreaterThan(0);
  });

  it('sets teams to null and warns when team service is down', async () => {
    const gameId = '3';
    const mock = new MockHttpClient({
      'game-service': () => ({
        id: gameId,
        startsAt: '2025-01-02T18:00:00Z',
        location: 'C',
        status: 'CONFIRMED',
        participants: [{ playerId: '30', inviteStatus: 'CONFIRMED' }],
      }),
      'player-service': () => ([
        { id: '30', rating: 90, nickname: 'p30' },
      ]),
      'team-service': () => {
        throw new Error('team down');
      },
      'result-service': () => ({ id: '300', gameId: gameId, format: 'TWO_TEAMS', lines: [] }),
    });

    const service = new GameDetailsService(mock as any);
    const details = await service.getDetails(gameId, 'req-3');

    expect(details.teams).toBeNull();
    expect(details.warnings.some((w) => w.service === 'team-service')).toBe(true);
  });

  it('treats result 404 as empty result without warnings', async () => {
    const gameId = '4';
    const mock = new MockHttpClient({
      'game-service': () => ({
        id: gameId,
        startsAt: '2025-01-03T18:00:00Z',
        location: 'D',
        status: 'CONFIRMED',
        participants: [{ playerId: '40', inviteStatus: 'CONFIRMED' }],
      }),
      'player-service': () => ([
        { id: '40', rating: 75, nickname: 'p40' },
      ]),
      'team-service': () => ([]),
      'result-service': () => {
        throw new HttpClientError(404, 'NOT_FOUND', 'Not found', { service: 'result-service' });
      },
    });

    const service = new GameDetailsService(mock as any);
    const details = await service.getDetails(gameId, 'req-4');

    expect(details.result).toBeNull();
    expect(details.warnings.some((w) => w.service === 'result-service')).toBe(false);
  });
});
