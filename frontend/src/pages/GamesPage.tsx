import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { gamesApi } from '@shared/api/gamesApi';
import { PageHeader } from '@shared/ui/PageHeader';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

export function GamesPage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: () => gamesApi.list(),
  });

  const sorted = (data || []).slice().sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return (
    <Box>
      <PageHeader
        title="Games"
        subtitle="Upcoming and past matches"
        actions={<Button variant="contained" onClick={() => navigate('/app/games/new')}>New Game</Button>}
      />
      <Stack spacing={2}>
        {sorted.map((game) => (
          <Card key={game.id} onClick={() => navigate(`/app/games/${game.id}`)} sx={{ cursor: 'pointer' }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {game.location}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(game.startsAt).toLocaleString()}
              </Typography>
              <StatusBadge value={game.status} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
