import React from 'react';
import { Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { AppointmentStatusWidget } from './AppointmentStatusWidget';

interface Appointment {
  id: string;
  patient: { firstName: string; lastName: string; fileNumber: string };
  chair: { name: string };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  selectedDate: string;
  onRefresh: () => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading,
  selectedDate,
  onRefresh,
}) => {
  return (
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
                  {apt.status === 'COMPLETED' || apt.status === 'CONFIRMED' ? (
                    <CheckCircle size={18} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-500" />
                  )}

                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    {apt.patient?.firstName} {apt.patient?.lastName}
                  </span>

                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                    File #{apt.patient?.fileNumber}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-4 pl-7">
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Clock size={13} className="text-blue-600" />
                    {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Chair: <strong className="text-gray-800">{apt.chair?.name || 'Assigned Chair'}</strong></span>
                </div>
                {apt.notes && <p className="text-xs text-gray-600 italic mt-1 pl-7">Note: {apt.notes}</p>}
              </div>

              <div className="flex items-center gap-3">
                <AppointmentStatusWidget appointmentId={apt.id} currentStatus={apt.status} onStatusUpdated={onRefresh} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};