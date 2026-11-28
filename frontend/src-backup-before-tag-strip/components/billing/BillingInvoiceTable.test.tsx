import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { BillManagementView } from './BillManagementView';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const partialBill = {
  id: 'abcdef1234567890',
  totalAmount: 1000,
  paidAmount: 200,
  status: 'PARTIAL',
  items: [{ description: 'Root Canal', quantity: 1, totalPrice: 1000 }],
};
const paidBill = { ...partialBill, id: 'ffff0000aaaa1111', status: 'PAID', paidAmount: 1000 };

describe('BillManagementView (FR-BIL / TR-BIL-002)', () => {
  const get = vi.mocked(axios.get);
  const post = vi.mocked(axios.post);

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockReset();
    post.mockReset();
    get.mockResolvedValue({ data: [partialBill] });
    post.mockResolvedValue({ data: {} });
  });

  it('shows a loading state, then requests bills for the patient', async () => {
    render(<BillManagementView patientId="patient-1" />);
    expect(screen.getByText(/loading bills/i)).toBeInTheDocument();
    await screen.findByText(/root canal/i);
    expect(get.mock.calls[0][0]).toContain('/billing/bills/patient-1');
  });

  it('shows an empty message when the patient has no bills', async () => {
    get.mockResolvedValue({ data: [] });
    render(<BillManagementView patientId="patient-1" />);
    expect(await screen.findByText(/no bills recorded/i)).toBeInTheDocument();
  });

  it('lists the bill, its items, totals and status', async () => {
    render(<BillManagementView patientId="patient-1" />);
    expect(await screen.findByText(/root canal/i)).toBeInTheDocument();
    expect(screen.getByText(/bill id: abcdef12/i)).toBeInTheDocument();
    expect(screen.getByText(/total: \$1000 \| paid: \$200/i)).toBeInTheDocument();
    expect(screen.getByText('PARTIAL')).toBeInTheDocument();
  });

  it('offers Pay Bill only for unpaid bills', async () => {
    get.mockResolvedValue({ data: [partialBill, paidBill] });
    render(<BillManagementView patientId="patient-1" />);
    await screen.findByText('PAID');
    expect(screen.getAllByRole('button', { name: /pay bill/i })).toHaveLength(1);
  });

  it('records a payment and refreshes the bills', async () => {
    render(<BillManagementView patientId="patient-1" />);
    fireEvent.click(await screen.findByRole('button', { name: /pay bill/i }));

    fireEvent.change(screen.getByPlaceholderText(/amount/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toMatch(/\/billing\/receipts$/);
    expect(body).toMatchObject({ billId: 'abcdef1234567890', amountPaid: 500, paymentMethod: 'CASH' });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('does not post a payment when the amount is empty', async () => {
    render(<BillManagementView patientId="patient-1" />);
    fireEvent.click(await screen.findByRole('button', { name: /pay bill/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(post).not.toHaveBeenCalled();
  });

  it('falls back to the empty state when loading fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    get.mockRejectedValue(new Error('401'));
    render(<BillManagementView patientId="patient-1" />);
    expect(await screen.findByText(/no bills recorded/i)).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
