import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TeamsBoard } from './TeamsBoard';

describe('TeamsBoard', () => {
  it('sorts players by rating desc and shows average rating', () => {
    const teams = [
      { id: 't1', name: 'Team 1', players: ['p1', 'p2', 'p3'] },
      { id: 't2', name: 'Team 2', players: [] },
    ];
    const playersById = new Map([
      ['p1', { nickname: 'Alpha', firstName: 'A', lastName: 'One', rating: 60 }],
      ['p2', { nickname: 'Bravo', firstName: 'B', lastName: 'Two', rating: 80 }],
      ['p3', { nickname: 'Charlie', firstName: 'C', lastName: 'Three', rating: 70 }],
    ]);

    render(<TeamsBoard teams={teams} playersById={playersById} />);

    expect(screen.getByText(/avg 70\.0/i)).toBeInTheDocument();

    const teamCard = screen.getByText('Team 1').closest('.MuiCard-root');
    if (!teamCard) throw new Error('Team card not found');
    const teamScope = within(teamCard);
    const nameElements = teamScope.getAllByText(/Alpha|Bravo|Charlie/);

    expect(nameElements[0]).toHaveTextContent('Bravo');
    expect(nameElements[1]).toHaveTextContent('Charlie');
    expect(nameElements[2]).toHaveTextContent('Alpha');
  });
});
