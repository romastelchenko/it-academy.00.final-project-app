import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { GameDetailsPage } from './GameDetailsPage';

vi.mock('@shared/hooks/useGameDetailsQuery', () => ({
  useGameDetailsQuery: () => ({
    data: {
      game: { id: '1', startsAt: '2025-01-01T10:00:00Z', location: 'Arena', status: 'DRAFT' },
      participants: [],
      teams: null,
      result: null,
      warnings: [],
    },
    isLoading: false,
  }),
}));

const gamesApiMock = vi.hoisted(() => ({
  addParticipants: vi.fn().mockResolvedValue({}),
  confirm: vi.fn().mockResolvedValue({}),
  cancel: vi.fn().mockResolvedValue({}),
  reopen: vi.fn().mockResolvedValue({}),
  updateInviteStatus: vi.fn().mockResolvedValue({}),
  removeParticipant: vi.fn().mockResolvedValue({}),
}));

vi.mock('@shared/api/gamesApi', () => ({
  gamesApi: gamesApiMock,
}));

const playersApiMock = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue({
    items: [
      {
        id: '11',
        nickname: 'neo',
        firstName: 'John',
        lastName: 'Doe',
        shirtNumber: 7,
        rating: 88,
        deletedAt: null,
      },
    ],
    total: 1,
    page: 1,
    limit: 100,
  }),
}));

vi.mock('@shared/api/playersApi', () => ({
  playersApi: playersApiMock,
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [{ path: '/app/games/:id', element: <GameDetailsPage /> }],
    {
      initialEntries: ['/app/games/1'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    },
  );
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('GameDetailsPage', () => {
  beforeEach(() => {
    gamesApiMock.addParticipants.mockClear();
    playersApiMock.list.mockClear();
  });

  it('adds a participant when selecting a player from search', async () => {
    renderPage();

    const input = screen.getByLabelText(/search players by nickname or name/i);
    fireEvent.focus(input);

    const option = await screen.findByText('neo · John Doe (88)');
    fireEvent.click(option);

    await waitFor(() => {
      expect(gamesApiMock.addParticipants).toHaveBeenCalledWith('1', [11]);
    });
  });
});
