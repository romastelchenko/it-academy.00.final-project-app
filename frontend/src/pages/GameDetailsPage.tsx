import { Alert, Autocomplete, Box, Button, Card, CardContent, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameDetailsQuery } from '@shared/hooks/useGameDetailsQuery';
import { PageHeader } from '@shared/ui/PageHeader';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { EmptyState } from '@shared/ui/EmptyState';
import { SyntheticEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@shared/api/gamesApi';
import { playersApi } from '@shared/api/playersApi';
import { useQuery } from '@tanstack/react-query';

export function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGameDetailsQuery(id || '');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const playersQuery = useQuery({
    queryKey: ['players', { search: playerSearch }],
    queryFn: () =>
      playersApi.list({
        page: 1,
        limit: 100,
        sortBy: 'rating',
        order: 'desc',
        includeDeleted: 'false',
        search: playerSearch.trim(),
      }),
    enabled: true,
  });

  const addParticipants = useMutation({
    mutationFn: (playerIds: number[]) => gamesApi.addParticipants(id || '', playerIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameDetails', id] }),
  });

/*   const updateStatus = useMutation({
    mutationFn: ({ playerId, status }: { playerId: string; status: 'INVITED' | 'CONFIRMED' | 'DECLINED' }) =>
    gamesApi.updateInviteStatus(id || '', playerId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameDetails', id] }),
  }); */

  const removeParticipant = useMutation({
    mutationFn: (playerId: string) => gamesApi.removeParticipant(id || '', playerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameDetails', id] }),
  });

  const confirmGame = useMutation({
    mutationFn: () => gamesApi.confirm(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDetails', id] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.error?.message || 'Failed to confirm game');
    },
  });

  const cancelGame = useMutation({
    mutationFn: () => gamesApi.cancel(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDetails', id] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.error?.message || 'Failed to cancel game');
    },
  });

  const reopenGame = useMutation({
    mutationFn: () => gamesApi.reopen(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDetails', id] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.error?.message || 'Failed to reopen game');
    },
  });
  const participants = data?.participants ?? [];
  const participantIds = new Set(participants.map((p) => p.playerId));
  const availablePlayers = (playersQuery.data?.items || []).filter((p) => !participantIds.has(p.id));
  const confirmedCount = participants.filter((p) => p.inviteStatus === 'CONFIRMED').length;
  const canConfirm = [10, 11, 12, 15].includes(confirmedCount);

  const handleTabChange = (_: SyntheticEvent, value: string) => {
    if (!id) return;
    if (value === 'participants') navigate(`/app/games/${id}`);
    if (value === 'teams') navigate(`/app/games/${id}/teams`);
    if (value === 'result') navigate(`/app/games/${id}/result`);
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!data) return <EmptyState message="Game not found" />;


  return (
    <Box>
      <PageHeader
        title={`Game at ${data.game.location}`}
        subtitle={new Date(data.game.startsAt).toLocaleString()}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={!canConfirm || data.game.status === 'CONFIRMED'}
              onClick={() => confirmGame.mutate()}
            >
              Confirm Game
            </Button>
            <Button
              variant="text"
              color="error"
              disabled={data.game.status === 'CANCELLED'}
              onClick={() => cancelGame.mutate()}
            >
              Cancel
            </Button>
            <Button
              variant="text"
              disabled={data.game.status !== 'CANCELLED'}
              onClick={() => reopenGame.mutate()}
            >
              Reopen
            </Button>
          </Stack>
        }
      />
      {actionError && (
        <Box mb={2}>
          <Alert severity="error">{actionError}</Alert>
        </Box>
      )}
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="h6">Status</Typography>
            <StatusBadge value={data.game.status} />
            <Tabs
              value="participants"
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
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Participants
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={2}>
              <Autocomplete
                options={availablePlayers}
                loading={playersQuery.isFetching}
                openOnFocus
                getOptionLabel={(option) =>
                  `${option.nickname} · ${option.firstName} ${option.lastName} (${option.rating})`
                }
                value={selectedPlayer}
                inputValue={playerSearch}
                onChange={(_, value) => {
                  setSelectedPlayer(value);
                  if (value) {
                    addParticipants.mutate([parseInt(value.id, 10)]);
                    setSelectedPlayer(null);
                    setPlayerSearch('');
                  }
                }}
                onInputChange={(_, value) => setPlayerSearch(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search players by nickname or name"
                    helperText="Type at least 2 characters"
                  />
                )}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack spacing={1}>
              {data.participants.map((p) => (
                <Box key={p.playerId} display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {p.player?.nickname || `Player ${p.playerId}`}
                    </Typography>
                    {p.player ? (
                      <Typography variant="caption" color="text.secondary">
                        {p.player.firstName} {p.player.lastName} · Rating {p.player.rating}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Player details unavailable
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeParticipant.mutate(p.playerId)}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
