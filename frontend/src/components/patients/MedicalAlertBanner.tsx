// frontend/src/components/patients/MedicalAlertBanner.tsx
import React from 'react';
import type { MedicalAlert } from '../../services/patient.service';
import { AlertTriangle } from 'lucide-react';

interface MedicalAlertBannerProps {
  alerts: MedicalAlert[];
}

export const MedicalAlertBanner: React.FC<MedicalAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-red-500 mt-0.5">
          <AlertTriangle size={20} />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
            Critical Medical Alerts ({alerts.length})
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index}>
                  <span className="font-semibold">{alert.alertType}</span> ({alert.severity} Severity): {alert.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};