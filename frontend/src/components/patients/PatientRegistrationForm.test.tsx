import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatientRegistrationForm } from './PatientRegistrationForm';

describe('PatientRegistrationForm (FR-PAT-001)', () => {
  const mockOnSubmit = vi.fn();

  it('renders required input fields correctly', () => {
    render(<PatientRegistrationForm {...({ onSubmit: mockOnSubmit } as any)} />);

    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /register patient/i })).toBeTruthy();
  });

  it('shows validation errors when submitted with empty fields', async () => {
    render(<PatientRegistrationForm {...({ onSubmit: mockOnSubmit } as any)} />);

    const submitBtn = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeTruthy();
      expect(screen.getByText(/phone number is required/i)).toBeTruthy();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form payload successfully on valid input', async () => {
    render(<PatientRegistrationForm {...({ onSubmit: mockOnSubmit } as any)} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Sekina Nesrie' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+251944112137' } });

    const submitBtn = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Sekina Nesrie',
          phone: '+251944112137',
        }),
      );
    });
  });
});