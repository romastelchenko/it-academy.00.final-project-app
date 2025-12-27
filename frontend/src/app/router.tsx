import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { PlayersPage } from '@pages/PlayersPage';
import { GamesPage } from '@pages/GamesPage';
import { GameCreatePage } from '@pages/GameCreatePage';
import { GameDetailsPage } from '@pages/GameDetailsPage';
import { TeamsPage } from '@pages/TeamsPage';
import { ResultPage } from '@pages/ResultPage';

export const router = createBrowserRouter(
  [
    {
      path: '/app',
      element: <AppShell />,
      children: [
        { path: 'players', element: <PlayersPage /> },
        { path: 'games', element: <GamesPage /> },
        { path: 'games/new', element: <GameCreatePage /> },
        { path: 'games/:id', element: <GameDetailsPage /> },
        { path: 'games/:id/teams', element: <TeamsPage /> },
        { path: 'games/:id/result', element: <ResultPage /> },
      ],
    },
    {
      path: '*',
      element: <AppShell />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);
