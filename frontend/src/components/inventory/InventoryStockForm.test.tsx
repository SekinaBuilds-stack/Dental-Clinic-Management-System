import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GRNEntryView } from './GRNEntryView';

describe('GRNEntryView (FR-INV)', () => {
  it('renders goods receipt note entry form controls', () => {
    render(<GRNEntryView />);

    expect(screen.getByText(/supplier/i) || screen.getByRole('button')).toBeInTheDocument();
  });
});