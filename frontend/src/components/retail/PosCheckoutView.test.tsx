import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { RetailPOSView } from './RetailPOSView';

describe('RetailPOSView (FR-SAL-001)', () => {
  const mockOnCheckout = vi.fn();

  const mockCartItems = [
    { id: 'item-001', name: 'Orthodontic Kit', price: 500, quantity: 2 },
  ];

  const RetailPOSViewWithCheckoutProps = RetailPOSView as unknown as ComponentType<{
    items: typeof mockCartItems;
    onCheckout: typeof mockOnCheckout;
  }>;

  it('calculates total price correctly based on item quantity', () => {
    render(<RetailPOSViewWithCheckoutProps items={mockCartItems} onCheckout={mockOnCheckout} />);

    expect(screen.getByText(/orthodontic kit/i)).toBeInTheDocument();
    expect(screen.getByText(/total: 1000/i)).toBeInTheDocument();
  });

  it('invokes onCheckout callback with active cart items on submit', () => {
    render(<RetailPOSViewWithCheckoutProps items={mockCartItems} onCheckout={mockOnCheckout} />);

    const checkoutBtn = screen.getByRole('button', { name: /complete checkout/i });
    fireEvent.click(checkoutBtn);

    expect(mockOnCheckout).toHaveBeenCalledWith(mockCartItems);
  });
});