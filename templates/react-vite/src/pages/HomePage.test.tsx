import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '@/test/utils';
import { HomePage } from './HomePage';

// Using renderWithRouter establishes the pattern for when you add Link components.
// It works fine for components without routing too.

describe('HomePage', () => {
  it('renders the main heading', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderWithRouter(<HomePage />);

    const cards = screen.getAllByTestId('feature-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders the getting started section', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByRole('heading', { name: /getting started/i })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
