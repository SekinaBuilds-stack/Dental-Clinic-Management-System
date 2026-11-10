import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AppointmentBookingModal } from './AppointmentBookingModal';

describe('AppointmentBookingModal (FR-APT-003)', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  it('renders modal controls and select options', () => {
    render(<AppointmentBookingModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select doctor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select chair/i)).toBeInTheDocument();
  });

  it('triggers onClose when cancel button is clicked', () => {
    render(<AppointmentBookingModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});