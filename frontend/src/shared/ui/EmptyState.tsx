import { Box, Typography } from '@mui/material';

export function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ p: 4, border: '1px dashed #c6ccd1', borderRadius: 3, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
