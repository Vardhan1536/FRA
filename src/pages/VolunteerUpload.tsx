import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Camera,
  FileText,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface UploadFormData {
  beneficiaryName: string;
  aadhaarNumber: string;
  village: string;
  documentType: string;
  notes: string;
  files: File[];
}

const VolunteerUpload: React.FC = () => {
  const [formData, setFormData] = useState<UploadFormData>({
    beneficiaryName: '',
    aadhaarNumber: '',
    village: '',
    documentType: '',
    notes: '',
    files: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    setFormData({ ...formData, files: [...formData.files, ...files] });
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFormData({ ...formData, files: newFiles });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document.');
      return;
    }

    if (!formData.beneficiaryName || !formData.aadhaarNumber || !formData.village || !formData.documentType) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsUploading(true);

    try {
      // Get existing documents count to cycle through thumbnails
      const existingDocuments = JSON.parse(localStorage.getItem('volunteerUploadedPattas') || '[]');
      const thumbnailIndex = existingDocuments.length % 4;
      const thumbnailPath = `/images${thumbnailIndex + 1}${thumbnailIndex === 0 ? '.png' : '.jpeg'}`;

      // Create new patta document entry
      const newPattaDocument = {
        id: `PATA_${Date.now()}`,
        beneficiaryName: formData.beneficiaryName,
        aadhaarNumber: formData.aadhaarNumber,
        village: formData.village,
        documentType: formData.documentType,
        uploadDate: new Date().toISOString(),
        status: 'Pending Review',
        fileName: uploadedFiles[0]?.name || "uploaded_document.jpg",
        fileSize: uploadedFiles[0]?.size || 1024000,
        fileType: uploadedFiles[0]?.type || "image/jpeg",
        thumbnail: thumbnailPath,
        volunteerName: "Volunteer User",
        notes: formData.notes,
        coordinates: {
          latitude: 22.220035169973066 + (Math.random() - 0.5) * 0.01,
          longitude: 80.27602945502146 + (Math.random() - 0.5) * 0.01
        },
        gramaSabhaApproved: false,
        sdlcReviewStatus: 'Pending'
      };

      // Save to localStorage for GramaSabha to access
      existingDocuments.unshift(newPattaDocument);
      localStorage.setItem('volunteerUploadedPattas', JSON.stringify(existingDocuments));

      console.log('Document saved to localStorage:', newPattaDocument);
      console.log('All documents in localStorage:', existingDocuments);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowSuccess(true);
      
      // Reset form
      setFormData({
        beneficiaryName: '',
        aadhaarNumber: '',
        village: '',
        documentType: '',
        notes: '',
        files: []
      });
      setUploadedFiles([]);

    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patta Upload Portal</h1>
          <p className="text-gray-600">Upload land documents for verification</p>
        </div>

        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-gray-600 mb-4">Select patta documents to upload</p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Selected Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beneficiary Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter beneficiary name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number *
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234-5678-9012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village *
                </label>
                <select
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Village</option>
                  <option value="चिरमिरी">चिरमिरी</option>
                  <option value="पाकाला">पाकाला</option>
                  <option value="चंबा">चंबा</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Document Type</option>
                  <option value="Land Deed">Land Deed</option>
                  <option value="Patta Document">Patta Document</option>
                  <option value="Identity Proof">Identity Proof</option>
                  <option value="Community Consent">Community Consent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information about this document..."
              />
            </div>

            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={isUploading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Document</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600 mb-6">Your patta document has been uploaded and is pending review by GramaSabha officers.</p>
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerUpload;
