import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { CalendarPlus, ListPlus } from 'lucide-react';
import api from '../../services/api';
import { AppointmentList } from './AppointmentList';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { WaitlistModal } from './WaitlistModal';

type Appointments = ComponentProps<typeof AppointmentList>['appointments'];

// Replaces the old inline layout, which rendered both modals permanently and
// so covered the whole page with a full-screen overlay.
export function AppointmentsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointments>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [waitlist, setWaitlist] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/appointments', { params: { date } });
      setAppointments(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch {
      setAppointments([]);
      setError('Could not load appointments for this date.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="appt-date" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</label>
          <input
            id="appt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setWaitlist(true)} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50">
            <ListPlus size={15} /> Waitlist
          </button>
          <button onClick={() => setBooking(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700">
            <CalendarPlus size={15} /> Book appointment
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-2xl border-l-4 border-red-500 bg-red-50 p-3.5 text-xs text-red-700">{error}</div>}

      <AppointmentList appointments={appointments} loading={loading} selectedDate={date} onRefresh={load} />

      {booking && (
        <AppointmentBookingModal
          onClose={() => setBooking(false)}
          onSuccess={() => {
            setBooking(false);
            load();
          }}
        />
      )}
      {waitlist && <WaitlistModal onClose={() => setWaitlist(false)} />}
    </div>
  );
}
