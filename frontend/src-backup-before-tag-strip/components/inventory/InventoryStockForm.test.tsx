import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { GRNEntryView } from './GRNEntryView';

const items = [{ id: 'item-1', name: 'Dental Floss', sku: 'FLS-1', unit: 'box' }];
const suppliers = [{ id: 'sup-1', name: 'Acme Dental' }];

const ok = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('GRNEntryView (FR-INV / TR-INV-002, TR-INV-005)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return ok({});
      return ok(url.includes('suppliers') ? suppliers : items);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the GRN form and loads suppliers', async () => {
    render(<GRNEntryView />);

    expect(screen.getByRole('heading', { name: /goods receipt note \(grn\) entry/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/grn-2026-001/i)).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Acme Dental' })).toBeInTheDocument();
  });

  it('disables commit until at least one line item is added', async () => {
    render(<GRNEntryView />);
    await screen.findByRole('option', { name: 'Acme Dental' });

    const commit = screen.getByRole('button', { name: /commit goods receipt note/i });
    expect(commit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /add item batch/i }));
    expect(screen.getByText('Batch Number')).toBeInTheDocument();
    expect(commit).toBeEnabled();
  });

  it('removes a line item row', async () => {
    render(<GRNEntryView />);
    await screen.findByRole('option', { name: 'Acme Dental' });

    fireEvent.click(screen.getByRole('button', { name: /add item batch/i }));
    expect(screen.getByPlaceholderText(/batch #/i)).toBeInTheDocument();

    const trash = screen.getAllByRole('button').find((b) => b.className.includes('text-red-400'))!;
    fireEvent.click(trash);
    expect(screen.queryByPlaceholderText(/batch #/i)).not.toBeInTheDocument();
  });

  it('posts the GRN and shows a success message', async () => {
    const { container } = render(<GRNEntryView />);
    await screen.findByRole('option', { name: 'Acme Dental' });

    fireEvent.change(screen.getByPlaceholderText(/grn-2026-001/i), { target: { value: 'GRN-2026-777' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'sup-1' } });
    fireEvent.click(screen.getByRole('button', { name: /add item batch/i }));
    fireEvent.change(screen.getByPlaceholderText(/batch #/i), { target: { value: 'B2026' } });
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: '2027-12-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: /commit goods receipt note/i }));

    expect(await screen.findByText(/recorded successfully/i)).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST')!;
    expect(post[0]).toContain('/inventory/grns');
    const body = JSON.parse((post[1] as RequestInit).body as string);
    expect(body).toMatchObject({ grnNumber: 'GRN-2026-777', supplierId: 'sup-1' });
    expect(body.items[0]).toMatchObject({ batchNumber: 'B2026', quantity: 1, expiryDate: '2027-12-31' });
  });

  it('alerts when the server rejects the GRN', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      return ok(url.includes('suppliers') ? suppliers : items);
    });

    const { container } = render(<GRNEntryView />);
    await screen.findByRole('option', { name: 'Acme Dental' });
    fireEvent.change(screen.getByPlaceholderText(/grn-2026-001/i), { target: { value: 'GRN-1' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'sup-1' } });
    fireEvent.click(screen.getByRole('button', { name: /add item batch/i }));
    fireEvent.change(screen.getByPlaceholderText(/batch #/i), { target: { value: 'B1' } });
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /commit goods receipt note/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to submit GRN'));
    alertSpy.mockRestore();
  });
});
