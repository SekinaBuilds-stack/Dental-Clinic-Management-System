// frontend/src/components/scheduler/DoctorSchedulerView.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Clock, Plus, CheckCircle, AlertCircle, ShieldAlert, Radio } from 'lucide-react';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { AppointmentStatusWidget } from './AppointmentStatusWidget';
import { useSocket } from '../../context/SocketContext'; // <-- Added Socket Context

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
}

interface Appointment {
  id: string;
  patient: { firstName: string; lastName: string; fileNumber: string };
  chair: { name: string };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

export const DoctorSchedulerView: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [error, setError] = useState('');

  // Real-time socket integration
  const { socket, isConnected } = useSocket();

  // Fetch doctors on mount (mock or API)
  useEffect(() => {
    setDoctors([
      { id: 'doc-uuid-1', fullName: 'Dr. Sarah Jenkins', specialization: 'Orthodontics' },
      { id: 'doc-uuid-2', fullName: 'Dr. Michael Chen', specialization: 'Oral Surgery' },
    ]);
  }, []);

  // Set default doctor once doctors list is populated
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctor]);

  const fetchAppointments = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:3000/api/v1/appointments/doctor/${selectedDoctor}?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(res.data);
    } catch (err: any) {
      console.error('Failed to fetch doctor schedule', err);
      setError('Failed to load appointments. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      fetchAppointments();
    }
  }, [selectedDoctor, selectedDate]);

  // TR-APT-007: Listen for real-time WebSocket events to refresh grid instantly
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = (data: any) => {
      console.log('Real-time appointment event received via WebSocket:', data);
      fetchAppointments();
    };

    socket.on('appointment:updated', handleRefresh);
    socket.on('appointment:created', handleRefresh);

    return () => {
      socket.off('appointment:updated', handleRefresh);
      socket.off('appointment:created', handleRefresh);
    };
  }, [socket, selectedDoctor, selectedDate]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-blue-600" size={28} /> Doctor Appointment Schedule
            </h1>
            {/* Live WebSocket Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <Radio size={14} className={isConnected ? "animate-pulse text-emerald-600" : "text-gray-400"} />
              {isConnected ? "Live WebSockets Active" : "Connecting..."}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage doctor availability, view active bookings, and initiate time-slot allocations (`TR-APT-001`)[cite: 3, 18].
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName} ({doc.specialization})
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
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition text-sm"
          >
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-sm text-red-700 flex items-center gap-2">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* Appointment Grid View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Bookings for {selectedDate} ({appointments.length} scheduled)
          </span>
          {loading && <span className="text-xs text-blue-600 animate-pulse font-medium">Syncing schedule...</span>}
        </div>

        {appointments.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Clock size={36} className="mx-auto text-gray-300" />
            <p className="text-sm font-medium">No appointments scheduled for this doctor on selected date.</p>
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
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                      File #{apt.patient?.fileNumber}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-4">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Clock size={13} className="text-blue-600" />
                      {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>Chair: <strong className="text-gray-800">{apt.chair?.name || 'Assigned Chair'}</strong></span>
                  </div>
                  {apt.notes && <p className="text-xs text-gray-600 italic mt-1">Note: {apt.notes}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <AppointmentStatusWidget appointmentId={apt.id} currentStatus={apt.status} onStatusUpdated={fetchAppointments} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <AppointmentBookingModal
          defaultDoctorId={selectedDoctor}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            setIsBookingOpen(false);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};