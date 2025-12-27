import { Alert, Box, Button, Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@shared/ui/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@shared/api/teamsApi';
import { TeamsBoard } from '@features/teams/TeamsBoard';
import { useGameDetailsQuery } from '@shared/hooks/useGameDetailsQuery';
import { SyntheticEvent, useEffect, useState } from 'react';
import { EmptyState } from '@shared/ui/EmptyState';
import { StatusBadge } from '@shared/ui/StatusBadge';

export function TeamsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [boardTeams, setBoardTeams] = useState<{ id: string; name: string; players: string[] }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['teamSets', id],
    queryFn: () => teamsApi.list(id || ''),
  });

  const { data: gameDetails, isLoading } = useGameDetailsQuery(id || '');

  const autoGenerate = useMutation({
    mutationFn: () => teamsApi.autoGenerate(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSets', id] });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err?.error?.message || 'Failed to auto-generate teams');
    },
  });

  const latest = data?.[data.length - 1];
  const confirmedCount = gameDetails?.participants.filter((p) => p.inviteStatus === 'CONFIRMED').length || 0;
  const canAutoGenerate = [10, 11, 12, 15].includes(confirmedCount);

  useEffect(() => {
    if (!latest) return;
    const mapped = latest.teams.map((team) => ({
      id: team.id,
      name: team.name,
      players: team.players.map((p) => p.playerId),
    }));
    setBoardTeams(mapped);
  }, [latest?.id]);

  useEffect(() => {
    if (!gameDetails) return;
    const allowedIds = new Set(
      gameDetails.participants
        .filter((p) => p.inviteStatus === 'CONFIRMED')
        .map((p) => p.playerId),
    );
    setBoardTeams((prev) =>
      prev.map((team) => ({
        ...team,
        players: team.players.filter((playerId) => allowedIds.has(playerId)),
      })),
    );
  }, [gameDetails]);

  const manualSave = useMutation({
    mutationFn: () =>
      teamsApi.manual(latest?.id || '', {
        teams: boardTeams.map((team) => ({
          teamId: Number(team.id),
          playerIds: team.players.map((playerId) => Number(playerId)),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSets', id] });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err?.error?.message || 'Failed to save manual teams');
    },
  });

  const handleTabChange = (_: SyntheticEvent, value: string) => {
    if (!id) return;
    if (value === 'participants') navigate(`/app/games/${id}`);
    if (value === 'teams') navigate(`/app/games/${id}/teams`);
    if (value === 'result') navigate(`/app/games/${id}/result`);
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!gameDetails) return <EmptyState message="Game not found" />;

  const confirmedPlayers = (gameDetails.participants || [])
    .filter((p) => p.inviteStatus === 'CONFIRMED')
    .map((p) => ({
      id: p.playerId,
      nickname: p.player?.nickname,
      firstName: p.player?.firstName,
      lastName: p.player?.lastName,
      rating: p.player?.rating,
    }));

  const playersById = new Map(confirmedPlayers.map((p) => [p.id, p]));
  const assignedIds = new Set(boardTeams.flatMap((team) => team.players));
  const unassignedPlayers = confirmedPlayers.filter((p) => !assignedIds.has(p.id));

  const assignPlayerToTeam = (playerId: string, teamId: string) => {
    setBoardTeams((prev) =>
      prev.map((team) => {
        const without = team.players.filter((id) => id !== playerId);
        if (team.id === teamId) return { ...team, players: [...without, playerId] };
        return { ...team, players: without };
      }),
    );
  };

  return (
    <Box>
      <PageHeader
        title={`Game at ${gameDetails.game.location}`}
        subtitle={new Date(gameDetails.game.startsAt).toLocaleString()}
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Status</Typography>
          <StatusBadge value={gameDetails.game.status} />
          <Tabs
            value="teams"
            onChange={handleTabChange}
            sx={{ mt: 2 }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Participants" value="participants" />
            <Tab label="Teams" value="teams" />
            <Tab label="Result" value="result" />
          </Tabs>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={!canAutoGenerate} onClick={() => autoGenerate.mutate()}>
              Auto-generate
            </Button>
            <Button
              variant="contained"
              disabled={!latest || latest.status === 'LOCKED'}
              onClick={() => teamsApi.lock(latest?.id || '')}
            >
              Lock
            </Button>
            <Button
              variant="text"
              disabled={!latest || latest.status === 'LOCKED'}
              onClick={() => manualSave.mutate()}
            >
              Save Manual
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {!canAutoGenerate && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Auto-generate is available only when confirmed participants count is 10–12 or 15.
          Current confirmed: {confirmedCount}.
        </Alert>
      )}
      {gameDetails?.game.status !== 'CONFIRMED' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Game must be CONFIRMED before generating or locking teams.
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {!latest ? (
        <Typography>No team sets yet. Use Auto-generate to create teams.</Typography>
      ) : (
        <>
          {unassignedPlayers.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unassigned players
                </Typography>
                <Stack spacing={1}>
                  {unassignedPlayers.map((player) => (
                    <Box key={player.id} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {player.nickname || `Player ${player.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {player.firstName || 'Unknown'} {player.lastName || ''} · Rating {player.rating ?? 'N/A'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {boardTeams.map((team) => (
                          <Button
                            key={team.id}
                            size="small"
                            variant="outlined"
                            onClick={() => assignPlayerToTeam(player.id, team.id)}
                          >
                            Add to {team.name}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
          <TeamsBoard
            teams={boardTeams}
            playersById={playersById}
            onTeamsChange={setBoardTeams}
          />
        </>
      )}
    </Box>
  );
}
