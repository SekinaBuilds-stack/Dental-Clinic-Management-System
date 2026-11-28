import { useState } from 'react';
import type { FormEvent } from 'react';

interface RecordPromptProps {
  title: string;
  description: string;
  idLabel: string;
  withAmount?: boolean;
  onOpen: (id: string, amount?: number) => void;
}

// Asks for the record (bill / payment) to work on when the page was opened
// without one, e.g. from the sidebar.
export function RecordPrompt({ title, description, idLabel, withAmount, onOpen }: RecordPromptProps) {
  const [id, setId] = useState('');
  const [amount, setAmount] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return;
    onOpen(id.trim(), withAmount ? Number(amount) || 0 : undefined);
  };

  const input = 'w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div>
        <label htmlFor="record-id" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">{idLabel}</label>
        <input id="record-id" required value={id} onChange={(e) => setId(e.target.value)} className={input} />
      </div>
      {withAmount && (
        <div>
          <label htmlFor="record-amount" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">Amount due</label>
          <input id="record-amount" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
        </div>
      )}
      <button type="submit" className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700">
        Open
      </button>
    </form>
  );
}
