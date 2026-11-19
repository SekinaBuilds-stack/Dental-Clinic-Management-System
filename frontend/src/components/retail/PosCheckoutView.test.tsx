import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { RetailPOSView } from './RetailPOSView';

const products = [
  { id: 'p1', sku: 'ORTHO-1', retailPrice: 500, inventoryItem: { name: 'Orthodontic Kit', currentStock: 10 } },
  { id: 'p2', sku: 'FLOSS-1', retailPrice: 20, inventoryItem: { name: 'Dental Floss', currentStock: 3 } },
];

const ok = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe('RetailPOSView (FR-SAL-001)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      init?.method === 'POST' ? ok({ receiptNumber: 'RCPT-1' }) : ok(products),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and lists the product catalog', async () => {
    render(<RetailPOSView />);
    expect(await screen.findByText('Orthodontic Kit')).toBeInTheDocument();
    expect(screen.getByText('Dental Floss')).toBeInTheDocument();
    expect(screen.getByText(/stock: 10/i)).toBeInTheDocument();
  });

  it('starts with an empty cart and a disabled checkout button', async () => {
    render(<RetailPOSView />);
    await screen.findByText('Orthodontic Kit');
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete checkout/i })).toBeDisabled();
  });

  it('calculates subtotal, 15% VAT and total from item quantity', async () => {
    render(<RetailPOSView />);
    fireEvent.click(await screen.findByText('Orthodontic Kit'));
    fireEvent.click(screen.getAllByText('Orthodontic Kit')[0]); // second click on the catalog card -> qty 2

    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // VAT 15%
    expect(screen.getByText('$1150.00')).toBeInTheDocument(); // total due
  });

  it('filters the catalog by search text', async () => {
    render(<RetailPOSView />);
    await screen.findByText('Orthodontic Kit');
    fireEvent.change(screen.getByPlaceholderText(/search sku or product/i), { target: { value: 'floss' } });
    expect(screen.queryByText('Orthodontic Kit')).not.toBeInTheDocument();
    expect(screen.getByText('Dental Floss')).toBeInTheDocument();
  });

  it('posts the sale on checkout and shows the receipt number', async () => {
    render(<RetailPOSView />);
    fireEvent.click(await screen.findByText('Orthodontic Kit'));
    fireEvent.click(screen.getByRole('button', { name: /complete checkout/i }));

    expect(await screen.findByText(/receipt: rcpt-1/i)).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST')!;
    expect(post[0]).toMatch(/\/retail-sales$/);
    expect(JSON.parse((post[1] as RequestInit).body as string)).toEqual({
      items: [{ retailProductId: 'p1', quantity: 1 }],
      paymentMethod: 'CASH',
    });
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });
});
