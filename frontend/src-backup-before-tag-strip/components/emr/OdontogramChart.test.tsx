import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { OdontogramCanvas } from './OdontogramCanvas';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('OdontogramCanvas (FR-EMR / TR-EMR-002)', () => {
  const get = vi.mocked(axios.get);
  const post = vi.mocked(axios.post);

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockReset();
    post.mockReset();
    get.mockResolvedValue({ data: [] });
    post.mockResolvedValue({ data: {} });
  });

  const tooth = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}(?!\\d)`) });

  it('renders both arches with 32 FDI-numbered teeth after loading', async () => {
    render(<OdontogramCanvas patientId="patient-123" />);

    expect(await screen.findByText(/upper arch/i)).toBeInTheDocument();
    expect(screen.getByText(/lower arch/i)).toBeInTheDocument();
    expect(tooth(18)).toBeInTheDocument();
    expect(tooth(48)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^\d\d(?!\d)/ })).toHaveLength(32);
  });

  it('loads the existing chart for the patient', async () => {
    get.mockResolvedValue({ data: [{ toothNumber: 16, condition: 'filled' }] });
    render(<OdontogramCanvas patientId="patient-123" />);

    await screen.findByText(/upper arch/i);
    expect(get.mock.calls[0][0]).toContain('/emr/odontogram/patient-123');
    expect(tooth(16)).toHaveTextContent(/filled/i);
  });

  it('applies the active condition to a clicked tooth and shows the inspector', async () => {
    render(<OdontogramCanvas patientId="patient-123" />);
    await screen.findByText(/upper arch/i);

    fireEvent.click(tooth(11)); // default tool: decayed
    expect(tooth(11)).toHaveTextContent(/decayed/i);
    expect(screen.getByText('#11')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'crown' }));
    fireEvent.click(tooth(21));
    expect(tooth(21)).toHaveTextContent(/crown/i);
  });

  it('resets the chart', async () => {
    render(<OdontogramCanvas patientId="patient-123" />);
    await screen.findByText(/upper arch/i);

    fireEvent.click(tooth(11));
    expect(tooth(11)).toHaveTextContent(/decayed/i);
    fireEvent.click(screen.getByRole('button', { name: /reset chart/i }));
    expect(tooth(11)).toHaveTextContent(/ok/i);
  });

  it('saves the chart and calls onSaveSuccess', async () => {
    const onSaveSuccess = vi.fn();
    render(<OdontogramCanvas patientId="patient-123" onSaveSuccess={onSaveSuccess} />);
    await screen.findByText(/upper arch/i);

    fireEvent.click(tooth(11));
    fireEvent.click(screen.getByRole('button', { name: /save odontogram/i }));

    await waitFor(() => expect(onSaveSuccess).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toMatch(/\/emr\/odontogram$/);
    expect(body).toEqual({ patientId: 'patient-123', conditions: [{ toothNumber: 11, condition: 'decayed' }] });
  });

  it('shows the server error when saving fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    post.mockRejectedValue({ response: { data: { message: 'Save exploded' } } });

    render(<OdontogramCanvas patientId="patient-123" />);
    await screen.findByText(/upper arch/i);
    fireEvent.click(screen.getByRole('button', { name: /save odontogram/i }));

    expect(await screen.findByText('Save exploded')).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it('still renders the chart when loading the existing records fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    get.mockRejectedValue(new Error('401'));

    render(<OdontogramCanvas patientId="patient-123" />);
    expect(await screen.findByText(/upper arch/i)).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
