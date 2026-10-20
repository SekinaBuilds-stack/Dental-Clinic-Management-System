// frontend/src/components/scheduler/AppointmentStatusWidget.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle2, ChevronDown } from 'lucide-react';

interface AppointmentStatusWidgetProps {
  appointmentId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

const statuses = ['Booked', 'Confirmed', 'Checked-In', 'In Treatment', 'Completed', 'No-Show', 'Cancelled'];

export const AppointmentStatusWidget: React.FC<AppointmentStatusWidgetProps> = ({
  appointmentId,
  currentStatus,
  onStatusUpdated,
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/api/v1/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus(newStatus);
      onStatusUpdated();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Checked-In': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Treatment': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'No-Show': case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        disabled={updating}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`text-xs font-bold px-3 py-1.5 rounded-xl border appearance-none pr-8 cursor-pointer focus:outline-none transition ${getStatusColor(
          status
        )}`}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-current opacity-60">
        <ChevronDown size={14} />
      </div>
    </div>
  );
};