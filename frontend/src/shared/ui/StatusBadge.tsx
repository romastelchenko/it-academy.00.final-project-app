import { Chip } from '@mui/material';

const colors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  CONFIRMING: 'warning',
  CONFIRMED: 'success',
  FINISHED: 'success',
  CANCELLED: 'error',
  INVITED: 'default',
  DECLINED: 'error',
  LOCKED: 'success',
  IN_GAME: 'success',
};

export function StatusBadge({ value }: { value: string }) {
  return <Chip label={value} color={colors[value] || 'default'} size="small" />;
}
