import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Camera,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Forward,
  Search,
  Filter,
  AlertCircle,
  Shield,
  Building,
  File,
  Image as ImageIcon,
  Check,
  X,
  Zap,
  Database
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

interface PattaDocument {
  id: string;
  beneficiaryName: string;
  aadhaarNumber: string;
  village: string;
  documentType: string;
  uploadDate: Date;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Forwarded to SDLC' | 'Digitalized';
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnail?: string;
  volunteerName: string;
  notes?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  digitalizedData?: any;
  gramaSabhaApproved?: boolean;
  sdlcReviewStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Forwarded';
}

const CheckPatta: React.FC = () => {
  const { t } = useTranslation();
  const [pattaDocuments, setPattaDocuments] = useState<PattaDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PattaDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Review' | 'Approved' | 'Rejected' | 'Forwarded to SDLC' | 'Digitalized'>('all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationDecision, setVerificationDecision] = useState<'approve' | 'reject' | 'forward'>('approve');
  const [showDigitalizedData, setShowDigitalizedData] = useState(false);

  // Mock data for demonstration
  const mockPattaDocuments: PattaDocument[] = [
    {
      id: 'PATA_001',
      beneficiaryName: 'राम सिंह',
      aadhaarNumber: '1234-5678-9012',
      village: 'चिरमिरी',
      documentType: 'Patta Document',
      uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'Pending Review',
      fileName: 'patta_ram_singh.pdf',
      fileSize: 2457600,
      fileType: 'application/pdf',
      volunteerName: 'अनिल कुमार',
      notes: 'Original patta document from 1985',
      coordinates: {
        latitude: 22.220035169973066,
        longitude: 80.27602945502146
      }
    },
    {
      id: 'PATA_002',
      beneficiaryName: 'सीता देवी',
      aadhaarNumber: '2345-6789-0123',
      village: 'पाकाला',
      documentType: 'Land Deed',
      uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'Pending Review',
      fileName: 'land_deed_sita_devi.jpg',
      fileSize: 1873408,
      fileType: 'image/jpeg',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3YzkyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+',
      volunteerName: 'प्रिया शर्मा',
      notes: 'Land deed from 1992, good condition',
      coordinates: {
        latitude: 22.79320098273347,
        longitude: 80.54635212060894
      }
    },
    {
      id: 'PATA_003',
      beneficiaryName: 'मोहन लाल',
      aadhaarNumber: '3456-7890-1234',
      village: 'चंबा',
      documentType: 'Identity Proof',
      uploadDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'Approved',
      fileName: 'id_proof_mohan_lal.png',
      fileSize: 1234567,
      fileType: 'image/png',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3YzkyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+',
      volunteerName: 'राजेश यादव',
      notes: 'Aadhaar card verification completed',
      coordinates: {
        latitude: 22.75320098273347,
        longitude: 80.53635212060894
      },
      verificationNotes: 'Document verified and approved',
      verifiedBy: 'GramaSabha Officer',
      verifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'PATA_004',
      beneficiaryName: 'कविता बाई',
      aadhaarNumber: '4567-8901-2345',
      village: 'चिरमिरी',
      documentType: 'Community Consent',
      uploadDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: 'Forwarded to SDLC',
      fileName: 'community_consent_kavita_bai.pdf',
      fileSize: 987654,
      fileType: 'application/pdf',
      volunteerName: 'सुनीता पटेल',
      notes: 'Community forest rights document',
      coordinates: {
        latitude: 22.220035169973066,
        longitude: 80.27602945502146
      },
      verificationNotes: 'Forwarded to SDLC for further review',
      verifiedBy: 'GramaSabha Officer',
      verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    loadPattaDocuments();
  }, []);

  const loadPattaDocuments = async () => {
    setLoading(true);
    try {
      // Load documents from localStorage (uploaded by volunteers)
      const volunteerUploads = JSON.parse(localStorage.getItem('volunteerUploadedPattas') || '[]');
      
      // Convert date strings back to Date objects
      const processedUploads = volunteerUploads.map((doc: any) => ({
        ...doc,
        uploadDate: new Date(doc.uploadDate || new Date()),
        verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined
      }));
      
      // Load digitalized documents for viewing
      const digitalizedDocuments = JSON.parse(localStorage.getItem('digitalizedPattaDocuments') || '[]');
      const processedDigitalized = digitalizedDocuments.map((doc: any) => ({
        ...doc,
        uploadDate: new Date(doc.uploadDate || new Date()),
        verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined
      }));
      
      // Combine with mock data for demonstration
      const allDocuments = [...processedUploads, ...mockPattaDocuments, ...processedDigitalized];
      
      setPattaDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading patta documents:', error);
      // Fallback to mock data even on error
      setPattaDocuments(mockPattaDocuments);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (documentId: string, decision: 'approve' | 'reject' | 'forward') => {
    try {
      const updatedDocuments = pattaDocuments.map(doc => {
        if (doc.id === documentId) {
          let newStatus: PattaDocument['status'];
          switch (decision) {
            case 'approve':
              newStatus = 'Approved';
              break;
            case 'reject':
              newStatus = 'Rejected';
              break;
            case 'forward':
              newStatus = 'Forwarded to SDLC';
              break;
          }
          
          return {
            ...doc,
            status: newStatus,
            verificationNotes: verificationNotes,
            verifiedBy: 'GramaSabha Officer',
            verifiedAt: new Date()
          };
        }
        return doc;
      });
      
      setPattaDocuments(updatedDocuments);
      
      // If forwarding to SDLC, save to localStorage for SDLC to access
      if (decision === 'forward') {
        const forwardedDoc = updatedDocuments.find(doc => doc.id === documentId);
        if (forwardedDoc) {
          const sdlcDocuments = JSON.parse(localStorage.getItem('sdlcPattaDocuments') || '[]');
          sdlcDocuments.unshift(forwardedDoc);
          localStorage.setItem('sdlcPattaDocuments', JSON.stringify(sdlcDocuments));
        }
      }
      
      // Update localStorage for volunteer uploads
      localStorage.setItem('volunteerUploadedPattas', JSON.stringify(updatedDocuments.filter(doc => doc.id.startsWith('PATA_'))));
      
      setShowVerificationModal(false);
      setVerificationNotes('');
      setSelectedDocument(null);
      
      // Show success message
      alert(`Document ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'forwarded to SDLC'} successfully!`);
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Error updating document status. Please try again.');
    }
  };

  const filteredDocuments = pattaDocuments.filter(doc => {
    const matchesSearch = doc.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.aadhaarNumber.includes(searchTerm) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesVillage = villageFilter === 'all' || doc.village === villageFilter;
    
    return matchesSearch && matchesStatus && matchesVillage;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pending Review': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Forwarded to SDLC': return <Forward className="w-5 h-5 text-blue-600" />;
      case 'Digitalized': return <Zap className="w-5 h-5 text-green-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'Pending Review':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      case 'Forwarded to SDLC':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      case 'Digitalized':
        return `${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300`;
      default:
        return baseClasses;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Check Patta Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and verify patta documents uploaded by volunteers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={loadPattaDocuments}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by beneficiary name, Aadhaar, or file name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Forwarded to SDLC">Forwarded to SDLC</option>
              <option value="Digitalized">Digitalized</option>
            </select>

            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Villages</option>
              <option value="चिरमिरी">चिरमिरी</option>
              <option value="पाकाला">पाकाला</option>
              <option value="चंबा">चंबा</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No patta documents found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || villageFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No patta documents have been uploaded yet'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setSelectedDocument(document)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(document.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {document.documentType}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {document.id}
                    </p>
                  </div>
                </div>
                <span className={getStatusBadge(document.status)}>
                  {document.status}
                </span>
              </div>

              {/* Document Preview */}
              <div className="mb-4">
                {document.thumbnail ? (
                  <img 
                    src={document.thumbnail} 
                    alt="Document thumbnail" 
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    {document.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    ) : (
                      <FileText className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Beneficiary Information */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Beneficiary Details</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>Name: {document.beneficiaryName}</div>
                  <div>Aadhaar: {document.aadhaarNumber}</div>
                  <div>Village: {document.village}</div>
                </div>
              </div>

              {/* File Information */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <File className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">File Details</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>File: {document.fileName}</div>
                  <div>Size: {formatFileSize(document.fileSize)}</div>
                  <div>Type: {document.fileType}</div>
                </div>
              </div>

              {/* Volunteer Information */}
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Upload Details</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>Volunteer: {document.volunteerName}</div>
                  <div>Date: {document.uploadDate.toLocaleDateString()}</div>
                  <div>Time: {document.uploadDate.toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Notes */}
              {document.notes && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Notes</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{document.notes}</p>
                </div>
              )}

              {/* Verification Information */}
              {document.verifiedBy && (
                <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Verification</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>Verified by: {document.verifiedBy}</div>
                    <div>Date: {document.verifiedAt?.toLocaleDateString()}</div>
                    {document.verificationNotes && (
                      <div>Notes: {document.verificationNotes}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Uploaded {document.uploadDate.toLocaleDateString()}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click to view details
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Document Details - {selectedDocument.id}
              </h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </h3>
                  <span className={getStatusBadge(selectedDocument.status)}>
                    {selectedDocument.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload Date
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {selectedDocument.uploadDate.toLocaleDateString()} at {selectedDocument.uploadDate.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Document Preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Document Preview
                </h3>
                {selectedDocument.thumbnail ? (
                  <img 
                    src={selectedDocument.thumbnail} 
                    alt="Document preview" 
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    {selectedDocument.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    ) : (
                      <FileText className="w-16 h-16 text-gray-400" />
                    )}
                    <span className="ml-3 text-gray-500">Document Preview</span>
                  </div>
                )}
              </div>

              {/* Beneficiary Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    Beneficiary Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.beneficiaryName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Number</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.aadhaarNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Village</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.village}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.documentType}</p>
                  </div>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                    File Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Name</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.fileName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Size</h4>
                    <p className="text-gray-900 dark:text-white">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Type</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.fileType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Method</h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedDocument.fileName.includes('captured') ? 'Camera Capture' : 'File Upload'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                    Upload Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Volunteer Name</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.volunteerName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Date</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.uploadDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Time</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.uploadDate.toLocaleTimeString()}</p>
                  </div>
                  {selectedDocument.coordinates && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</h4>
                      <p className="text-gray-900 dark:text-white">
                        {selectedDocument.coordinates.latitude.toFixed(6)}, {selectedDocument.coordinates.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedDocument.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                      Volunteer Notes
                    </h3>
                  </div>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.notes}</p>
                </div>
              )}

              {/* Verification Information */}
              {selectedDocument.verifiedBy && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                      Verification Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verified By</h4>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.verifiedBy}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Date</h4>
                      <p className="text-gray-900 dark:text-white">
                        {selectedDocument.verifiedAt?.toLocaleDateString()} at {selectedDocument.verifiedAt?.toLocaleTimeString()}
                      </p>
                    </div>
                    {selectedDocument.verificationNotes && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Notes</h4>
                        <p className="text-gray-900 dark:text-white">{selectedDocument.verificationNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedDocument.status === 'Pending Review' && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setVerificationDecision('reject');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => {
                      setVerificationDecision('forward');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Forward className="w-4 h-4" />
                    <span>Forward to SDLC</span>
                  </button>
                  <button
                    onClick={() => {
                      setVerificationDecision('approve');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              )}

              {/* View Digitalized Data Button */}
              {selectedDocument.status === 'Digitalized' && selectedDocument.digitalizedData && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowDigitalizedData(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span>View Digitalized Data</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {verificationDecision === 'approve' ? 'Approve Document' : 
               verificationDecision === 'reject' ? 'Reject Document' : 'Forward to SDLC'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Notes
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={`Add notes for ${verificationDecision === 'approve' ? 'approval' : verificationDecision === 'reject' ? 'rejection' : 'forwarding'}...`}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationNotes('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedDocument && handleVerification(selectedDocument.id, verificationDecision)}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                  verificationDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  verificationDecision === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {verificationDecision === 'approve' ? 'Approve' : 
                 verificationDecision === 'reject' ? 'Reject' : 'Forward'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Digitalized Data Modal */}
      {showDigitalizedData && selectedDocument && selectedDocument.digitalizedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Digitalized Data - {selectedDocument.id}
              </h2>
              <button
                onClick={() => setShowDigitalizedData(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Metadata */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  Digitalization Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Digitalized At</h4>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedDocument.digitalizedData.digitalizedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.digitalizationMethod}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confidence Score</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.confidenceScore}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processing Time</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.processingTime}</p>
                  </div>
                </div>
              </div>

              {/* Extracted Data */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  Extracted Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beneficiary Name</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.beneficiaryName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Number</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.aadhaarNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Village</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.village}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Claim Area</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.claimArea} acres</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Right Type</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.rightType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forest Area</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.forestArea} acres</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tribal Community</h4>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.tribalCommunity}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Income</h4>
                    <p className="text-gray-900 dark:text-white">₹{selectedDocument.digitalizedData.extractedData.income.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                  Security & Verification
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blockchain Hash</h4>
                    <p className="text-gray-900 dark:text-white font-mono text-xs break-all">
                      {selectedDocument.digitalizedData.blockchainHash}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Digital Signature</h4>
                    <p className="text-gray-900 dark:text-white font-mono text-xs">
                      {selectedDocument.digitalizedData.digitalSignature}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDigitalizedData(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CheckPatta;

