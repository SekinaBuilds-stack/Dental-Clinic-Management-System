// frontend/src/components/scheduler/WaitlistModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, X, Calendar, ShieldAlert } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  patient: { firstName: string; lastName: string; fileNumber: string; phone: string };
  preferredDate: string;
  status: string;
  notes?: string;
}

export const WaitlistModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [patientId, setPatientId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/v1/appointments/waitlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWaitlist(res.data);
    } catch (err) {
      console.error('Failed to fetch waitlist', err);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/v1/appointments/waitlist',
        { patientId, preferredDate, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatientId('');
      setPreferredDate('');
      setNotes('');
      fetchWaitlist();
    } catch (err) {
      console.error('Failed to add to waitlist', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Clinic Waitlist Management</h2>
              <p className="text-xs text-gray-500">Reassign cancelled slots (`TR-APT-006`)[cite: 3, 18]</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
            <X size={20} />
          </button>
        </div>

        {/* Add Waitlist Form */}
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Add Patient to Waitlist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Patient UUID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="px-3 py-2 border rounded-xl text-xs bg-white"
            />
            <input
              type="date"
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="px-3 py-2 border rounded-xl text-xs bg-white"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Notes (e.g. Morning preference)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-xs bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-purple-500/20"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </form>

        {/* Waitlist Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Waitlist Queue</h3>
          {waitlist.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No patients currently on the waitlist.</p>
          ) : (
            <div className="divide-y border rounded-2xl overflow-hidden">
              {waitlist.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-900">
                      {item.patient?.firstName} {item.patient?.lastName}
                    </span>
                    <p className="text-gray-500">Preferred Date: {item.preferredDate} | Phone: {item.patient?.phone}</p>
                    {item.notes && <p className="text-purple-600 italic mt-0.5">{item.notes}</p>}
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};