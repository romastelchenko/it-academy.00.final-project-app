import { Outlet, NavLink } from 'react-router-dom';
import { Box, Chip, Drawer, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useUiStore } from '@shared/store/uiStore';

const navItems = [
  { label: 'Players', to: '/app/players' },
  { label: 'Games', to: '/app/games' },
];

export function AppShell() {
  const { sidebarOpen } = useUiStore();
  return (
    <Box display="flex" minHeight="100vh">
      <Drawer
        variant="permanent"
        open={sidebarOpen}
        sx={{
          width: 240,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Football Club
            </Typography>
            <Chip label="v2" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Team Ops
          </Typography>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{ '&.active': { backgroundColor: 'rgba(27,77,62,0.12)' } }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, md: 4 },
          ml: { xs: 0, md: '240px' },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
