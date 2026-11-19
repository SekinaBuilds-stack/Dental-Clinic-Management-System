import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { AppointmentBookingModal } from './AppointmentBookingModal';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

describe('AppointmentBookingModal (FR-APT-003)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const post = vi.mocked(axios.post);

  beforeEach(() => {
    vi.clearAllMocks();
    post.mockReset();
    post.mockResolvedValue({ data: {} });
  });

  const setup = (props: { defaultDoctorId?: string } = {}) =>
    render(<AppointmentBookingModal onClose={onClose} onSuccess={onSuccess} {...props} />);

  const fillValid = () => {
    fireEvent.change(screen.getByLabelText(/patient uuid/i), { target: { value: 'pat-1' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '2026-12-01T09:00' } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '2026-12-01T09:30' } });
  };

  it('renders the modal controls and select options', () => {
    setup();
    expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/doctor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/treatment chair/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /dr\. sarah jenkins/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /chair 2 - surgery suite/i })).toBeInTheDocument();
  });

  it('preselects the default doctor when provided', () => {
    setup({ defaultDoctorId: 'doc-uuid-2' });
    expect(screen.getByLabelText(/doctor/i)).toHaveValue('doc-uuid-2');
  });

  it('triggers onClose when Cancel is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('posts the booking and calls onSuccess', async () => {
    setup();
    fillValid();
    fireEvent.change(screen.getByLabelText(/treatment chair/i), { target: { value: 'chair-uuid-2' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toMatch(/\/appointments$/);
    expect(body).toMatchObject({
      patientId: 'pat-1',
      doctorId: 'doc-uuid-1',
      chairId: 'chair-uuid-2',
      startTime: new Date('2026-12-01T09:00').toISOString(),
      endTime: new Date('2026-12-01T09:30').toISOString(),
    });
  });

  it('shows the server conflict message (TR-APT-003) and does not call onSuccess', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    post.mockRejectedValue({ response: { data: { message: 'Chair already booked' } } });

    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText('Chair already booked')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('falls back to the default conflict message when the error has no body', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    post.mockRejectedValue(new Error('network'));

    setup();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText(/conflict detected/i)).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
