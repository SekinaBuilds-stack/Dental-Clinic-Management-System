// frontend/src/services/patient.service.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface MedicalAlert {
  id?: string;
  alertType: string;
  severity: 'High' | 'Moderate' | 'Low';
  description: string;
}

export interface Patient {
  id: string;
  fileNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  referralSource?: string;
  isPreRegistered: boolean;
  medicalAlerts: MedicalAlert[];
  createdAt: string;
}

export const patientService = {
  async searchPatients(query: string): Promise<Patient[]> {
    const token = localStorage.getItem('dcms_token');
    const response = await axios.get(`${API_URL}/patients`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getPatientById(id: string): Promise<Patient> {
    const token = localStorage.getItem('dcms_token');
    const response = await axios.get(`${API_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createPatient(data: Omit<Patient, 'id' | 'fileNumber' | 'createdAt'>): Promise<Patient> {
    const token = localStorage.getItem('dcms_token');
    const response = await axios.post(`${API_URL}/patients`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};