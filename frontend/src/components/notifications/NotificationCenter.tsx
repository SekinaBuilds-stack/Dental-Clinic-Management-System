import { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">System Notification Center</h1>
          <p className="text-xs text-gray-500">Automated alerts for appointment reminders, recalls, and inventory expiry scans (TR-COR-006)</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-2xl">
          <Bell size={16} /> BullMQ + Redis Active
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No notifications currently pending.</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`p-4 rounded-2xl border transition flex items-start justify-between ${notif.isRead ? 'bg-gray-50/50 border-gray-100' : 'bg-purple-50/30 border-purple-100'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px]">{notif.type}</span>
                  <h3 className="text-xs font-bold text-gray-900">{notif.title}</h3>
                </div>
                <p className="text-xs text-gray-600">{notif.message}</p>
                <span className="text-[10px] text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
              {!notif.isRead && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold shadow-sm transition flex items-center gap-1"
                >
                  <CheckCircle size={12} /> Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}