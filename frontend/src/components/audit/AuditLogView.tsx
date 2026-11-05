import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, User, FileText, AlertCircle } from 'lucide-react';

interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityName: string;
  entityId: string;
  afterValue: any;
  ipAddress: string;
  createdAt: string;
}

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/v1/audit-logs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">System Audit Trail & Security Logs</h1>
          <p className="text-xs text-gray-500">Immutable record of all critical modifications and state updates (TR-COR-005)</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-2xl">
          <ShieldCheck size={16} /> Global Interceptor Active
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">User</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Entity</th>
              <th className="pb-3">Entity ID</th>
              <th className="pb-3 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50/50">
                <td className="py-3 font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="py-3 font-bold text-gray-900">{log.userEmail || log.userId}</td>
                <td className="py-3">
                  <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] ${
                    log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                    log.action === 'REVERSAL' || log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-3 font-semibold text-gray-700">{log.entityName}</td>
                <td className="py-3 font-mono text-gray-400">{log.entityId ? log.entityId.slice(0, 8) + '...' : 'N/A'}</td>
                <td className="py-3 font-mono text-right text-gray-500">{log.ipAddress || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}