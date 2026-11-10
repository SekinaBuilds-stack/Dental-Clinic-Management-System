import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BillManagementView } from './BillManagementView';

describe('BillManagementView (FR-BIL)', () => {
  it('renders the billing view', () => {
    const { container } = render(<BillManagementView patientId="patient-1" />);

    expect(container.firstChild).not.toBeNull();
  });
});