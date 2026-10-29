// frontend/src/components/scheduler/ChairSchedulerView.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Armchair, Clock, ShieldAlert } from 'lucide-react';
import { AppointmentStatusWidget } from './AppointmentStatusWidget';

interface TreatmentChair {
  id: string;
  name: string;
  status: string;
}

interface Appointment {
  id: string;
  patient: { firstName: string; lastName: string; fileNumber: string };
  doctor: { fullName: string };
  startTime: string;
  endTime: string;
  status: string;
}

export const ChairSchedulerView: React.FC = () => {
  const [chairs, setChairs] = useState<TreatmentChair[]>([]);
  const [selectedChair, setSelectedChair] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mock or fetch from /api/v1/chairs
    setChairs([
      { id: 'chair-uuid-1', name: 'Chair 1 - Orthodontic Suite', status: 'Active' },
      { id: 'chair-uuid-2', name: 'Chair 2 - Surgery Suite', status: 'Active' },
      { id: 'chair-uuid-3', name: 'Chair 3 - General Hygiene', status: 'Active' },
    ]);
    if (chairs.length > 0) setSelectedChair(chairs[0].id);
  }, []);

  const fetchChairAppointments = async () => {
    if (!selectedChair) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:3000/api/v1/appointments/chair/${selectedChair}?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch chair schedule', err);
      setError('Failed to load chair schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChair) {
      fetchChairAppointments();
    }
  }, [selectedChair, selectedDate]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Armchair className="text-emerald-600" size={28} /> Treatment Chair Schedule
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time chair utilization and multi-chair operational monitoring (`TR-APT-002`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Chair</label>
            <select
              value={selectedChair}
              onChange={(e) => setSelectedChair(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {chairs.map((chair) => (
                <option key={chair.id} value={chair.id}>
                  {chair.name} ({chair.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-sm text-red-700 flex items-center gap-2">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Chair Allocations for {selectedDate}
          </span>
          {loading && <span className="text-xs text-emerald-600 animate-pulse font-medium">Loading chair data...</span>}
        </div>

        {appointments.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Armchair size={36} className="mx-auto text-gray-300" />
            <p className="text-sm font-medium">Chair is fully available throughout the day.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </span>
                    <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                      Attending: {apt.doctor?.fullName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock size={13} className="text-emerald-600" />
                    {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <AppointmentStatusWidget appointmentId={apt.id} currentStatus={apt.status} onStatusUpdated={fetchChairAppointments} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};