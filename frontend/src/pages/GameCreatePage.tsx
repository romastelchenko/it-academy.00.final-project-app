import { Box, Button, Card, CardContent, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { gamesApi } from '@shared/api/gamesApi';
import { PageHeader } from '@shared/ui/PageHeader';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  startsAt: z.string().min(1),
  location: z.string().min(2),
});

type FormValues = z.infer<typeof schema>;

export function GameCreatePage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const game = await gamesApi.create(values);
    navigate(`/app/games/${game.id}`);
  };

  return (
    <Box>
      <PageHeader title="New Game" subtitle="Schedule the next match" />
      <Card>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Starts At"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('startsAt')}
              error={!!formState.errors.startsAt}
            />
            <TextField
              label="Location"
              {...register('location')}
              error={!!formState.errors.location}
            />
            <Button type="submit" variant="contained">Create</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
