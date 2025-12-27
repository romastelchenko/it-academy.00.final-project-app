import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@shared/ui/PageHeader';
import { useGameDetailsQuery } from '@shared/hooks/useGameDetailsQuery';
import { EmptyState } from '@shared/ui/EmptyState';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsApi } from '@shared/api/resultsApi';

export function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: gameDetails, isLoading } = useGameDetailsQuery(id || '');
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [twoTeamScores, setTwoTeamScores] = useState({ scoreA: '', scoreB: '' });
  const [threeTeamLines, setThreeTeamLines] = useState<
    { teamAId: string; teamBId: string; scoreA: string; scoreB: string }[]
  >([]);

  const handleTabChange = (_: SyntheticEvent, value: string) => {
    if (!id) return;
    if (value === 'participants') navigate(`/app/games/${id}`);
    if (value === 'teams') navigate(`/app/games/${id}/teams`);
    if (value === 'result') navigate(`/app/games/${id}/result`);
  };

  const lockedTeamSet = gameDetails?.teams?.lockedTeamSet ?? null;
  const existingResult = gameDetails?.result ?? null;
  const teams = lockedTeamSet?.teams ?? [];
  const teamCount = teams.length;
  const teamOptions = useMemo(
    () => teams.map((team) => ({ id: team.id, name: team.name })),
    [teams],
  );

  const teamNameById = useMemo(() => new Map(teams.map((team) => [team.id, team.name])), [teams]);

  useEffect(() => {
    if (teamCount === 2) {
      setTwoTeamScores({ scoreA: '', scoreB: '' });
    }
    if (teamCount === 3) {
      const ordered = [...teams].sort((a, b) => a.orderIndex - b.orderIndex);
      if (ordered.length === 3) {
        setThreeTeamLines([
          { teamAId: ordered[0].id, teamBId: ordered[1].id, scoreA: '', scoreB: '' },
          { teamAId: ordered[0].id, teamBId: ordered[2].id, scoreA: '', scoreB: '' },
          { teamAId: ordered[1].id, teamBId: ordered[2].id, scoreA: '', scoreB: '' },
        ]);
      }
    }
  }, [teamCount, teams]);

  const saveResult = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing game id');
      if (teamCount === 2) {
        if (!teams[0] || !teams[1]) throw new Error('Teams not ready');
        const payload = {
          format: 'TWO_TEAMS',
          teamAId: Number(teams[0].id),
          teamBId: Number(teams[1].id),
          scoreA: Number(twoTeamScores.scoreA),
          scoreB: Number(twoTeamScores.scoreB),
        };
        return resultsApi.create(id, payload);
      }
      if (teamCount !== 3) {
        throw new Error('Invalid number of teams');
      }
      const payload = {
        format: 'THREE_TEAMS',
        lines: threeTeamLines.map((line) => ({
          teamAId: Number(line.teamAId),
          teamBId: Number(line.teamBId),
          scoreA: Number(line.scoreA),
          scoreB: Number(line.scoreB),
        })),
      };
      return resultsApi.create(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['results', id] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.error?.message || 'Failed to save result');
    },
  });

  const canSave =
    teamCount === 2 ||
    (teamCount === 3 && threeTeamLines.length === 3);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!gameDetails) return <EmptyState message="Game not found" />;

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
            value="result"
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
          <Stack spacing={2}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Result form appears when game is CONFIRMED and teams are LOCKED.
            </Typography>
            {existingResult && (
              <Alert severity="success">Result saved.</Alert>
            )}
            {!lockedTeamSet && !existingResult && (
              <Alert severity="info">Lock teams before entering results.</Alert>
            )}
            {existingResult && (
              <Stack spacing={2}>
                {existingResult.lines.map((line) => (
                  <Stack key={line.id} direction="row" spacing={2}>
                    <TextField
                      label="Team A"
                      value={teamNameById.get(line.teamAId) || line.teamAId}
                      fullWidth
                      disabled
                    />
                    <TextField
                      label="Team B"
                      value={teamNameById.get(line.teamBId) || line.teamBId}
                      fullWidth
                      disabled
                    />
                    <TextField label="Score A" value={line.scoreA} fullWidth disabled />
                    <TextField label="Score B" value={line.scoreB} fullWidth disabled />
                  </Stack>
                ))}
              </Stack>
            )}
            {!existingResult && lockedTeamSet && teamCount === 2 && (
              <>
                <Stack direction="row" spacing={2}>
                  <TextField label="Team A" value={teams[0]?.name || ''} fullWidth disabled />
                  <TextField label="Team B" value={teams[1]?.name || ''} fullWidth disabled />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Score A"
                    type="number"
                    fullWidth
                    value={twoTeamScores.scoreA}
                    onChange={(e) => setTwoTeamScores((prev) => ({ ...prev, scoreA: e.target.value }))}
                  />
                  <TextField
                    label="Score B"
                    type="number"
                    fullWidth
                    value={twoTeamScores.scoreB}
                    onChange={(e) => setTwoTeamScores((prev) => ({ ...prev, scoreB: e.target.value }))}
                  />
                </Stack>
              </>
            )}
            {!existingResult && lockedTeamSet && teamCount === 3 && (
              <Stack spacing={2}>
                {threeTeamLines.map((line, idx) => (
                  <Stack key={idx} direction="row" spacing={2}>
                    <TextField
                      select
                      label="Team A"
                      fullWidth
                      value={line.teamAId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setThreeTeamLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, teamAId: value } : item)),
                        );
                      }}
                    >
                      {teamOptions.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Team B"
                      fullWidth
                      value={line.teamBId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setThreeTeamLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, teamBId: value } : item)),
                        );
                      }}
                    >
                      {teamOptions.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Score A"
                      type="number"
                      fullWidth
                      value={line.scoreA}
                      onChange={(e) => {
                        const value = e.target.value;
                        setThreeTeamLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, scoreA: value } : item)),
                        );
                      }}
                    />
                    <TextField
                      label="Score B"
                      type="number"
                      fullWidth
                      value={line.scoreB}
                      onChange={(e) => {
                        const value = e.target.value;
                        setThreeTeamLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, scoreB: value } : item)),
                        );
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
            {!existingResult && (
              <Button
                variant="contained"
                disabled={!lockedTeamSet || !canSave || saveResult.isPending}
                onClick={() => saveResult.mutate()}
              >
                Save Result
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
