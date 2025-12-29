import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { playersApi } from '@shared/api/playersApi';
import { PageHeader } from '@shared/ui/PageHeader';
import { EmptyState } from '@shared/ui/EmptyState';
import { ErrorState } from '@shared/ui/ErrorState';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  nickname: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  shirtNumber: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(0).max(100),
  positionOnField: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function PlayersPage() {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['players', { all: true }],
    queryFn: () =>
      playersApi.list({
        page: 1,
        limit: 10000,
        sortBy: 'rating',
        order: 'desc',
        includeDeleted: 'true',
      }),
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => playersApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      reset();
      setSubmitError(null);
      setOpen(false);
      setEditingId(null);
    },
    onError: (err: any) => {
      setSubmitError(err?.error?.message || 'Failed to create player');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) => playersApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      reset();
      setSubmitError(null);
      setOpen(false);
      setEditingId(null);
    },
    onError: (err: any) => {
      setSubmitError(err?.error?.message || 'Failed to update player');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => playersApi.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const onSubmit = (values: FormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const openEdit = (player: any) => {
    setEditingId(player.id);
    reset({
      nickname: player.nickname,
      firstName: player.firstName,
      lastName: player.lastName,
      shirtNumber: player.shirtNumber,
      rating: player.rating,
      positionOnField: player.positionOnField ?? 'UNKNOWN',
    });
    setOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="Players"
        subtitle="Manage your roster"
        actions={
          <Button
            variant="contained"
            onClick={() => {
              setEditingId(null);
              reset({ positionOnField: 'UNKNOWN' });
              setOpen(true);
            }}
          >
            Add
          </Button>
        }
      />
      {isLoading && <Typography>Loading...</Typography>}
      {error && <ErrorState message="Failed to load players" />}
      {data && data.items.length === 0 && <EmptyState message="No players yet" />}
      <Stack spacing={1}>
        {data?.items
          .slice()
          .sort((a, b) => {
            const aInactive = a.deletedAt ? 1 : 0;
            const bInactive = b.deletedAt ? 1 : 0;
            if (aInactive !== bInactive) return aInactive - bInactive;
            return b.rating - a.rating;
          })
          .map((player) => (
          <Card key={player.id} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {player.nickname}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {player.firstName} {player.lastName} · #{player.shirtNumber} · {player.rating} ·{' '}
                    {player.positionOnField || 'UNKNOWN'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={player.deletedAt ? 'Inactive' : 'Active'}
                    color={player.deletedAt ? 'default' : 'success'}
                  />
                  {player.deletedAt ? (
                    <Button size="small" variant="outlined" onClick={() => restoreMutation.mutate(player.id)}>
                      Restore
                    </Button>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => openEdit(player)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(player.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit player' : 'Add player'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1} component="form" id="player-form" onSubmit={handleSubmit(onSubmit)}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField label="Nickname" {...register('nickname')} error={!!formState.errors.nickname} />
            <TextField label="First name" {...register('firstName')} error={!!formState.errors.firstName} />
            <TextField label="Last name" {...register('lastName')} error={!!formState.errors.lastName} />
            <TextField label="Shirt number" type="number" {...register('shirtNumber')} error={!!formState.errors.shirtNumber} />
            <TextField label="Rating" type="number" {...register('rating')} error={!!formState.errors.rating} />
            <TextField
              label="Position on field"
              {...register('positionOnField')}
              error={!!formState.errors.positionOnField}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            form="player-form"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
