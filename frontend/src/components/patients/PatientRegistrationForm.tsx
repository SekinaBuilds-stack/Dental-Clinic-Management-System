// frontend/src/components/patients/PatientRegistrationForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientService } from '../../services/patient.service';
import { UserPlus, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const patientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  referralSource: z.string().optional(),
  isPreRegistered: z.boolean().default(false),
  medicalAlerts: z.array(
    z.object({
      alertType: z.string().min(1, 'Type required'),
      severity: z.enum(['High', 'Moderate', 'Low']),
      description: z.string().min(1, 'Description required'),
    })
  ),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      isPreRegistered: false,
      medicalAlerts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicalAlerts',
  });

  const onSubmit = async (data: PatientFormValues) => {
    setSubmitting(true);
    try {
      await patientService.createPatient(data);
      onSuccess();
    } catch (err) {
      console.error('Failed to register patient', err);
      alert('Error registering patient. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border border-gray-100">
      <div className="flex items-center gap-3 border-b pb-4 mb-6">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <UserPlus size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">New Patient Registration</h2>
          <p className="text-xs text-gray-500">Capture demographics, contact details, and medical alerts (TR-PAT-002).</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
          <input type="text" {...register('fullName')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Abebe Bikila" />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
          <input type="text" {...register('phoneNumber')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+2519..." />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
          <select {...register('gender')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
          <input type="date" {...register('dateOfBirth')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
          <input type="email" {...register('email')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="patient@example.com" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Referral Source</label>
          <input type="text" {...register('referralSource')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Walk-in, Doctor, Online..." />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address</label>
        <textarea {...register('address')} rows={2} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Street, City, Subcity..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact Name</label>
          <input type="text" {...register('emergencyContactName')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact Phone</label>
          <input type="text" {...register('emergencyContactPhone')} className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="mt-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center space-x-3">
        <input type="checkbox" {...register('isPreRegistered')} id="preReg" className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
        <label htmlFor="preReg" className="text-sm font-medium text-blue-900 cursor-pointer">
          Mark as Pre-registered (Walk-in or phone booking before full file creation - TR-PAT-001)
        </label>
      </div>

      {/* Medical Alerts Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <h3 className="text-md font-bold text-gray-900">Medical Alerts & Allergies (TR-PAT-003)</h3>
          </div>
          <button
            type="button"
            onClick={() => append({ alertType: 'Allergy', severity: 'High', description: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition"
          >
            <Plus size={14} /> Add Alert
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic mb-2">No medical alerts added. Click "+ Add Alert" if patient has known allergies or sensitivities.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-center mb-3 bg-red-50/30 p-3.5 rounded-xl border border-red-100">
            <input type="text" placeholder="Type (e.g. Allergy)" {...register(`medicalAlerts.${index}.alertType`)} className="p-2.5 border border-gray-300 rounded-lg w-1/4 text-sm bg-white" />
            <select {...register(`medicalAlerts.${index}.severity`)} className="p-2.5 border border-gray-300 rounded-lg w-1/4 text-sm bg-white">
              <option value="High">High Severity</option>
              <option value="Moderate">Moderate Severity</option>
              <option value="Low">Low Severity</option>
            </select>
            <input type="text" placeholder="Description (e.g. Penicillin)" {...register(`medicalAlerts.${index}.description`)} className="p-2.5 border border-gray-300 rounded-lg w-2/4 text-sm bg-white" />
            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-1">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-semibold transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-lg shadow-blue-500/20 transition">
          <CheckCircle2 size={16} /> {submitting ? 'Saving...' : 'Register Patient'}
        </button>
      </div>
    </form>
  );
};