// frontend/src/components/emr/ImagingUploader.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Image as ImageIcon, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface ImagingUploaderProps {
  patientId: string;
  onUploadSuccess?: () => void;
}

export const ImagingUploader: React.FC<ImagingUploaderProps> = ({ patientId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [imagingType, setImagingType] = useState('Periapical X-Ray');
  const [toothNumber, setToothNumber] = useState<number | ''>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an X-ray or photo file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('imagingType', imagingType);
      if (toothNumber !== '') formData.append('toothNumber', toothNumber.toString());

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/v1/emr/imaging', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setFile(null);
      setToothNumber('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload imaging file to MinIO storage.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
          <ImageIcon size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Imaging & X-Ray Attachments (`TR-EMR-007`)</h2>
          <p className="text-xs text-gray-500">Secure MinIO S3 object storage for dental radiographs and photos</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Imaging Type</label>
            <select
              value={imagingType}
              onChange={(e) => setImagingType(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none"
            >
              <option value="Periapical X-Ray">Periapical X-Ray</option>
              <option value="Bitewing X-Ray">Bitewing X-Ray</option>
              <option value="Panoramic OPG">Panoramic (OPG)</option>
              <option value="Intraoral Photo">Intraoral Photo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tooth Number (Optional)</label>
            <input
              type="number"
              placeholder="e.g., 46"
              value={toothNumber}
              onChange={(e) => setToothNumber(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* File Dropzone */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-purple-400 transition bg-gray-50/50">
          <input type="file" onChange={handleFileChange} className="hidden" id="imaging-file-input" accept="image/*,.dcm" />
          <label htmlFor="imaging-file-input" className="cursor-pointer space-y-2 block">
            <Upload size={32} className="mx-auto text-purple-600" />
            <p className="text-sm font-bold text-gray-700">{file ? file.name : 'Click to select or drag X-ray image here'}</p>
            <p className="text-xs text-gray-400">Supports PNG, JPEG, DICOM up to 50MB</p>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-500/25 transition flex items-center gap-2"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {uploading ? 'Uploading to MinIO...' : 'Upload Imaging File'}
          </button>
        </div>
      </form>
    </div>
  );
};