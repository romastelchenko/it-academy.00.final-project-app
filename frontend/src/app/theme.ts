import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1b4d3e',
    },
    secondary: {
      main: '#d3754a',
    },
    background: {
      default: '#f0f3f4',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: ['Space Grotesk', 'system-ui', 'sans-serif'].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
});
