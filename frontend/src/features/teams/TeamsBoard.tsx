import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
interface BoardTeam {
  id: string;
  name: string;
  players: string[];
}

interface TeamsBoardProps {
  teams: BoardTeam[];
  playersById: Map<string, { nickname?: string; firstName?: string; lastName?: string; rating?: number }>;
  onTeamsChange?: (teams: BoardTeam[]) => void;
}

export function TeamsBoard({ teams, playersById, onTeamsChange }: TeamsBoardProps) {
  const movePlayer = (playerId: string, targetTeamId: string) => {
    const sourceIndex = teams.findIndex((team) => team.players.includes(playerId));
    const targetIndex = teams.findIndex((team) => team.id === targetTeamId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const sourceTeam = teams[sourceIndex];
    const targetTeam = teams[targetIndex];
    if (sourceTeam.id === targetTeam.id) return;

    const updatedSource = sourceTeam.players.filter((p) => p !== playerId);
    const updatedTarget = [...targetTeam.players, playerId];

    const next = teams.map((team, idx) => {
      if (idx === sourceIndex) return { ...team, players: updatedSource };
      if (idx === targetIndex) return { ...team, players: updatedTarget };
      return team;
    });

    onTeamsChange?.(next);
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      {teams.map((team) => (
        <Card key={team.id} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">
              {team.name}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                Avg {team.players.length === 0
                  ? '0'
                  : (
                      team.players.reduce((acc, playerId) => acc + (playersById.get(playerId)?.rating ?? 0), 0) /
                      team.players.length
                    ).toFixed(1)}
              </Typography>
            </Typography>
            <Stack spacing={1} mt={2}>
              {team.players
                .slice()
                .sort((a, b) => (playersById.get(b)?.rating ?? 0) - (playersById.get(a)?.rating ?? 0))
                .map((playerId, idx) => (
                <Box
                  key={playerId}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: idx % 2 === 0 ? '#eef2ed' : '#f7f1ea',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {playersById.get(playerId)?.nickname || `Player ${playerId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {playersById.get(playerId)?.firstName || 'Unknown'}{' '}
                        {playersById.get(playerId)?.lastName || ''} · Rating{' '}
                        {playersById.get(playerId)?.rating ?? 'N/A'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {teams
                        .filter((t) => t.id !== team.id)
                        .map((target) => (
                          <Button
                            key={target.id}
                            size="small"
                            variant="outlined"
                            onClick={() => movePlayer(playerId, target.id)}
                          >
                            Move to {target.name}
                          </Button>
                        ))}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
