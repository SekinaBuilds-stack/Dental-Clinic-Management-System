// frontend/src/components/patients/PatientRegistrationForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientService } from '../../services/patient.service';

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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">New Patient Registration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
          <input type="text" {...register('fullName')} className="mt-1 w-full p-2 border rounded-lg" />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
          <input type="text" {...register('phoneNumber')} className="mt-1 w-full p-2 border rounded-lg" placeholder="+2519..." />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender *</label>
          <select {...register('gender')} className="mt-1 w-full p-2 border rounded-lg">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
          <input type="date" {...register('dateOfBirth')} className="mt-1 w-full p-2 border rounded-lg" />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" {...register('email')} className="mt-1 w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Referral Source</label>
          <input type="text" {...register('referralSource')} className="mt-1 w-full p-2 border rounded-lg" placeholder="Walk-in, Doctor, Online..." />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Residential Address</label>
        <textarea {...register('address')} rows={2} className="mt-1 w-full p-2 border rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
          <input type="text" {...register('emergencyContactName')} className="mt-1 w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
          <input type="text" {...register('emergencyContactPhone')} className="mt-1 w-full p-2 border rounded-lg" />
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <input type="checkbox" {...register('isPreRegistered')} id="preReg" className="h-4 w-4 text-blue-600 rounded" />
        <label htmlFor="preReg" className="text-sm font-medium text-gray-700">Mark as Pre-registered (Walk-in / Phone booking)</label>
      </div>

      {/* Medical Alerts Section */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-bold text-gray-800">Medical Alerts & Allergies</h3>
          <button
            type="button"
            onClick={() => append({ alertType: 'Allergy', severity: 'High', description: '' })}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-lg"
          >
            + Add Alert
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-center mb-2 bg-gray-50 p-3 rounded-lg">
            <input type="text" placeholder="Type (e.g. Allergy)" {...register(`medicalAlerts.${index}.alertType`)} className="p-2 border rounded w-1/4 text-sm" />
            <select {...register(`medicalAlerts.${index}.severity`)} className="p-2 border rounded w-1/4 text-sm">
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
            <input type="text" placeholder="Description (e.g. Penicillin)" {...register(`medicalAlerts.${index}.description`)} className="p-2 border rounded w-2/4 text-sm" />
            <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold px-2">×</button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          {submitting ? 'Saving...' : 'Register Patient'}
        </button>
      </div>
    </form>
  );
};