import { Injectable } from '@nestjs/common';
import { HttpClientService, HttpClientError } from '../http/http-client.service';

@Injectable()
export class GameDetailsService {
  private readonly playerUrl = process.env.PLAYER_SVC_URL || 'http://player-service:3001';
  private readonly gameUrl = process.env.GAME_SVC_URL || 'http://game-service:3002';
  private readonly teamUrl = process.env.TEAM_SVC_URL || 'http://team-service:3003';
  private readonly resultUrl = process.env.RESULT_SVC_URL || 'http://result-service:3004';

  constructor(private readonly http: HttpClientService) {}

  async getDetails(gameId: string, requestId: string) {
    const headers = { 'x-request-id': requestId };
    const game = await this.http.forward('game-service', `${this.gameUrl}/games/${gameId}`, {
      method: 'GET',
      headers,
    });

    const participants = Array.isArray(game.participants) ? game.participants : [];
    const playerIds = [...new Set(participants.map((p: any) => p.playerId))];

    const playerPromise = playerIds.length
      ? this.http.forward('player-service', `${this.playerUrl}/players/batch`, {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify({ ids: playerIds }),
        })
      : Promise.resolve([]);

    const teamPromise = this.http.forward('team-service', `${this.teamUrl}/games/${gameId}/team-sets`, {
      method: 'GET',
      headers,
    });

    const resultPromise = this.http.forward('result-service', `${this.resultUrl}/games/${gameId}/results`, {
      method: 'GET',
      headers,
    });

    const warnings: Array<{ service: string; code: string; message: string }> = [];

    const [playersResult, teamsResult, resultResult] = await Promise.allSettled([
      playerPromise,
      teamPromise,
      resultPromise,
    ]);

    let players: any[] = [];
    if (playersResult.status === 'fulfilled') {
      players = playersResult.value || [];
    } else {
      warnings.push({
        service: 'player-service',
        code: 'PARTIAL_DATA',
        message: 'Players info unavailable',
      });
    }

    let teamSets: any[] | null = null;
    if (teamsResult.status === 'fulfilled') {
      teamSets = teamsResult.value || [];
    } else {
      warnings.push({
        service: 'team-service',
        code: 'PARTIAL_DATA',
        message: 'Teams info unavailable',
      });
    }

    let result: any = null;
    if (resultResult.status === 'fulfilled') {
      result = resultResult.value;
    } else if (resultResult.reason instanceof HttpClientError && resultResult.reason.status === 404) {
      result = null;
    } else {
      warnings.push({
        service: 'result-service',
        code: 'PARTIAL_DATA',
        message: 'Result info unavailable',
      });
    }

    const playersById = new Map(players.map((p: any) => [p.id?.toString(), p]));

    const participantsWithPlayer = participants.map((p: any) => ({
      ...p,
      player: playersById.get(p.playerId?.toString()) || null,
    }));

    let lockedTeamSet: any = null;
    let lastDraftTeamSet: any = null;
    if (teamSets && teamSets.length > 0) {
      lockedTeamSet = teamSets.find((ts: any) => ts.status === 'LOCKED') || null;
      lastDraftTeamSet = lockedTeamSet
        ? null
        : [...teamSets].sort((a, b) => (a.version || 0) - (b.version || 0)).pop();
    }

    const withRatingSums = (teamSet: any) => {
      if (!teamSet || players.length === 0) return teamSet;
      const teams = (teamSet.teams || []).map((team: any) => {
        const sum = (team.players || []).reduce((acc: number, tp: any) => {
          const player = playersById.get(tp.playerId?.toString());
          return acc + (player?.rating || 0);
        }, 0);
        return { ...team, ratingSum: sum };
      });
      return { ...teamSet, teams };
    };

    return {
      game: {
        id: game.id,
        startsAt: game.startsAt,
        location: game.location,
        status: game.status,
      },
      participants: participantsWithPlayer,
      teams: teamSets
        ? {
            lockedTeamSet: withRatingSums(lockedTeamSet),
            lastDraftTeamSet: withRatingSums(lastDraftTeamSet),
          }
        : null,
      result: result || null,
      warnings,
    };
  }
}
