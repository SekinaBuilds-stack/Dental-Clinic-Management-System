import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { patientService } from '../../services/patient.service';

vi.mock('../../services/patient.service', () => ({
  patientService: { createPatient: vi.fn() },
}));

describe('PatientRegistrationForm (FR-PAT-001 / TR-PAT-002)', () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  const createPatient = vi.mocked(patientService.createPatient);

  beforeEach(() => {
    vi.clearAllMocks();
    createPatient.mockReset();
    createPatient.mockResolvedValue({} as never);
  });

  const setup = () => render(<PatientRegistrationForm onSuccess={onSuccess} onCancel={onCancel} />);

  const fillValid = () => {
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Sekina Nesrie' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+251944112137' } });
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'Female' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-05-20' } });
  };

  it('renders the required input fields and submit button', () => {
    setup();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register patient/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty and does not call the service', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /register patient/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/valid phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
    expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    expect(createPatient).not.toHaveBeenCalled();
  });

  it('rejects a phone number shorter than 10 characters', async () => {
    setup();
    fillValid();
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /register patient/i }));

    expect(await screen.findByText(/valid phone number is required/i)).toBeInTheDocument();
    expect(createPatient).not.toHaveBeenCalled();
  });

  it('submits the payload and calls onSuccess on valid input', async () => {
    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /register patient/i }));

    await waitFor(() => expect(createPatient).toHaveBeenCalledTimes(1));
    expect(createPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Sekina Nesrie',
        phoneNumber: '+251944112137',
        gender: 'Female',
        dateOfBirth: '1990-05-20',
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('adds and removes a medical alert row (TR-PAT-003)', () => {
    setup();
    expect(screen.getByText(/no medical alerts added/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add alert/i }));
    expect(screen.getByPlaceholderText(/description \(e\.g\. penicillin\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/no medical alerts added/i)).not.toBeInTheDocument();

    const removeBtn = screen.getAllByRole('button').find((b) => b.className.includes('text-red-500'))!;
    fireEvent.click(removeBtn);
    expect(screen.getByText(/no medical alerts added/i)).toBeInTheDocument();
  });

  it('does not call onSuccess when the service fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createPatient.mockRejectedValue(new Error('boom'));

    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /register patient/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
    alertSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('calls onCancel when Cancel is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
