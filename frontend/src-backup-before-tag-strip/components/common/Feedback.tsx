import { AlertCircle, CheckCircle } from 'lucide-react';

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
      <AlertCircle size={16} /> {message}
    </div>
  );
}

export function SuccessNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="status" className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
      <CheckCircle size={16} /> {message}
    </div>
  );
}

export function EmptyRow({ cols, loading, text }: { cols: number; loading: boolean; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-8 text-center text-gray-400">
        {loading ? 'Loading…' : text}
      </td>
    </tr>
  );
}
