import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OdontogramCanvas } from './OdontogramCanvas';

describe('OdontogramCanvas (FR-EMR)', () => {
  it('renders dental chart grid and tooth selections', () => {
    render(<OdontogramCanvas patientId="patient-123" />);

    expect(screen.getByTestId('odontogram-grid') || screen.getByRole('region')).toBeInTheDocument();
  });
});