import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
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
  Check,
  X,
  Database,
  Zap
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

interface PattaDocument {
  id: string;
  beneficiaryName: string;
  aadhaarNumber: string;
  village: string;
  documentType: string;
  uploadDate: Date;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Forwarded to SDLC' | 'Forwarded to DLC' | 'Digitalized';
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
  dlcReviewStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Finalized';
  forwardedFromSDLC?: boolean;
  sdlcNotes?: string;
  sdlcVerifiedBy?: string;
  sdlcVerifiedAt?: Date;
}

const DLCCheckPatta: React.FC = () => {
  const [pattaDocuments, setPattaDocuments] = useState<PattaDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PattaDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Review' | 'Approved' | 'Rejected' | 'Forwarded to SDLC' | 'Forwarded to DLC' | 'Digitalized'>('all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationDecision, setVerificationDecision] = useState<'approve' | 'reject' | 'finalize'>('approve');
  const [showDigitalizedData, setShowDigitalizedData] = useState(false);

  // Mock data for DLC - documents forwarded from SDLC
  const mockPattaDocuments: PattaDocument[] = [
    {
      id: 'PATA_001',
      beneficiaryName: 'राम सिंह',
      aadhaarNumber: '1234-5678-9012',
      village: 'चिरमिरी',
      documentType: 'Patta Document',
      uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'Forwarded to DLC',
      fileName: 'patta_ram_singh.pdf',
      fileSize: 2457600,
      fileType: 'application/pdf',
      volunteerName: 'अनिल कुमार',
      notes: 'Original patta document from 1985',
      coordinates: {
        latitude: 22.220035169973066,
        longitude: 80.27602945502146
      },
      gramaSabhaApproved: true,
      sdlcReviewStatus: 'Approved',
      dlcReviewStatus: 'Pending',
      forwardedFromSDLC: true,
      sdlcNotes: 'Document verified and approved by SDLC. All requirements met.',
      sdlcVerifiedBy: 'SDLC Officer - Rajesh Kumar',
      sdlcVerifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      verificationNotes: 'Forwarded from SDLC for DLC final review and approval',
      verifiedBy: 'SDLC Officer',
      verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'PATA_002',
      beneficiaryName: 'सीता देवी',
      aadhaarNumber: '2345-6789-0123',
      village: 'पाकाला',
      documentType: 'Land Deed',
      uploadDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'Digitalized',
      fileName: 'land_deed_sita_devi.jpg',
      fileSize: 1873408,
      fileType: 'image/jpeg',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3YzkyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+',
      volunteerName: 'प्रिया शर्मा',
      notes: 'Land deed from 1992, good condition',
      coordinates: {
        latitude: 22.79320098273347,
        longitude: 80.54635212060894
      },
      gramaSabhaApproved: true,
      sdlcReviewStatus: 'Approved',
      dlcReviewStatus: 'Finalized',
      forwardedFromSDLC: true,
      sdlcNotes: 'Document approved by SDLC. Ready for DLC processing.',
      sdlcVerifiedBy: 'SDLC Officer - Priya Sharma',
      sdlcVerifiedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      verificationNotes: 'Finalized and digitalized by DLC',
      verifiedBy: 'DLC Officer',
      verifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      digitalizedData: {
        claimId: 'PATA_002',
        digitalizedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        extractedData: {
          beneficiaryName: 'सीता देवी',
          aadhaarNumber: '2345-6789-0123',
          village: 'पाकाला',
          claimArea: 1.8,
          rightType: 'IFR',
          coordinates: [80.54635212060894, 22.79320098273347],
          forestArea: 2.1,
          tribalCommunity: 'Gond',
          income: 35000
        },
        metadata: {
          sourceDocuments: ['land_deed_sita_devi.jpg'],
          verificationStatus: 'Verified',
          digitalizationMethod: 'AI-Enhanced OCR',
          confidenceScore: 95.2,
          processingTime: '2.1 seconds'
        },
        blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        digitalSignature: `DIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    },
    {
      id: 'PATA_003',
      beneficiaryName: 'मोहन लाल',
      aadhaarNumber: '3456-7890-1234',
      village: 'चंबा',
      documentType: 'Identity Proof',
      uploadDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: 'Forwarded to DLC',
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
      gramaSabhaApproved: true,
      sdlcReviewStatus: 'Forwarded',
      dlcReviewStatus: 'Pending',
      forwardedFromSDLC: true,
      sdlcNotes: 'Identity document verified by SDLC. Forwarded for DLC processing.',
      sdlcVerifiedBy: 'SDLC Officer - Rajesh Yadav',
      sdlcVerifiedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      verificationNotes: 'Forwarded from SDLC for DLC final approval and digitalization',
      verifiedBy: 'SDLC Officer',
      verifiedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 'PATA_004',
      beneficiaryName: 'कविता बाई',
      aadhaarNumber: '4567-8901-2345',
      village: 'चिरमिरी',
      documentType: 'Community Consent',
      uploadDate: new Date(Date.now() - 10 * 60 * 60 * 1000),
      status: 'Digitalized',
      fileName: 'community_consent_kavita_bai.pdf',
      fileSize: 987654,
      fileType: 'application/pdf',
      volunteerName: 'सुनीता पटेल',
      notes: 'Community forest rights document',
      coordinates: {
        latitude: 22.220035169973066,
        longitude: 80.27602945502146
      },
      gramaSabhaApproved: true,
      sdlcReviewStatus: 'Approved',
      dlcReviewStatus: 'Finalized',
      forwardedFromSDLC: true,
      sdlcNotes: 'Community consent document approved by SDLC.',
      sdlcVerifiedBy: 'SDLC Officer - Sunita Patel',
      sdlcVerifiedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      verificationNotes: 'Successfully digitalized and finalized by DLC',
      verifiedBy: 'DLC Officer',
      verifiedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      digitalizedData: {
        claimId: 'PATA_004',
        digitalizedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        extractedData: {
          beneficiaryName: 'कविता बाई',
          aadhaarNumber: '4567-8901-2345',
          village: 'चिरमिरी',
          claimArea: 2.5,
          rightType: 'CFR',
          coordinates: [80.27602945502146, 22.220035169973066],
          forestArea: 3.2,
          tribalCommunity: 'Baiga',
          income: 42000
        },
        metadata: {
          sourceDocuments: ['community_consent_kavita_bai.pdf'],
          verificationStatus: 'Verified',
          digitalizationMethod: 'AI-Enhanced OCR',
          confidenceScore: 97.8,
          processingTime: '1.8 seconds'
        },
        blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        digitalSignature: `DIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    }
  ];

  useEffect(() => {
    loadPattaDocuments();
  }, []);

  const loadPattaDocuments = async () => {
    setLoading(true);
    try {
      // Load documents from localStorage (forwarded from SDLC)
      const dlcDocuments = JSON.parse(localStorage.getItem('dlcPattaDocuments') || '[]');
      
      // Convert date strings back to Date objects
      const processedDocuments = dlcDocuments.map((doc: any) => ({
        ...doc,
        uploadDate: new Date(doc.uploadDate),
        verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined,
        sdlcVerifiedAt: doc.sdlcVerifiedAt ? new Date(doc.sdlcVerifiedAt) : undefined
      }));
      
      // Load digitalized documents for viewing
      const digitalizedDocuments = JSON.parse(localStorage.getItem('digitalizedPattaDocuments') || '[]');
      const processedDigitalized = digitalizedDocuments.map((doc: any) => ({
        ...doc,
        uploadDate: new Date(doc.uploadDate),
        verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined
      }));
      
      // Combine with mock data for demonstration
      const allDocuments = [...processedDocuments, ...mockPattaDocuments, ...processedDigitalized];
      
      console.log('Loading patta documents for DLC role:', allDocuments.length);
      setPattaDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading patta documents:', error);
      // Fallback to mock data even on error
      setPattaDocuments(mockPattaDocuments);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (documentId: string, decision: 'approve' | 'reject' | 'finalize') => {
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
            case 'finalize':
              newStatus = 'Digitalized';
              break;
          }
          
          return {
            ...doc,
            status: newStatus,
            dlcReviewStatus: (decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Finalized') as 'Approved' | 'Rejected' | 'Finalized' | 'Pending',
            verificationNotes: verificationNotes,
            verifiedBy: 'DLC Officer',
            verifiedAt: new Date(),
            // Add digitalized data for finalized documents
            ...(decision === 'finalize' && {
              digitalizedData: {
                claimId: doc.id,
                digitalizedAt: new Date(),
                extractedData: {
                  beneficiaryName: doc.beneficiaryName,
                  aadhaarNumber: doc.aadhaarNumber,
                  village: doc.village,
                  claimArea: Math.random() * 5 + 0.5, // Random area between 0.5-5.5
                  rightType: doc.documentType.includes('Community') ? 'CFR' : 'IFR',
                  coordinates: doc.coordinates ? [doc.coordinates.longitude, doc.coordinates.latitude] : [0, 0],
                  forestArea: Math.random() * 3 + 1, // Random area between 1-4
                  tribalCommunity: ['Gond', 'Baiga', 'Korku', 'Bhil'][Math.floor(Math.random() * 4)],
                  income: Math.floor(Math.random() * 50000) + 20000 // Random income between 20k-70k
                },
                metadata: {
                  sourceDocuments: [doc.fileName],
                  verificationStatus: 'Verified',
                  digitalizationMethod: 'AI-Enhanced OCR',
                  confidenceScore: Math.floor(Math.random() * 10) + 90, // 90-99%
                  processingTime: `${(Math.random() * 2 + 1).toFixed(1)} seconds`
                },
                blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                digitalSignature: `DIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              }
            })
          };
        }
        return doc;
      });
      
      setPattaDocuments(updatedDocuments);
      
      // If finalizing/digitalizing, save to localStorage for all roles to access
      if (decision === 'finalize') {
        const digitalizedDoc = updatedDocuments.find(doc => doc.id === documentId);
        if (digitalizedDoc) {
          const digitalizedDocuments = JSON.parse(localStorage.getItem('digitalizedPattaDocuments') || '[]');
          digitalizedDocuments.unshift(digitalizedDoc);
          localStorage.setItem('digitalizedPattaDocuments', JSON.stringify(digitalizedDocuments));
        }
      }
      
      // Update localStorage for DLC documents
      localStorage.setItem('dlcPattaDocuments', JSON.stringify(updatedDocuments));
      
      setShowVerificationModal(false);
      setVerificationNotes('');
      setSelectedDocument(null);
      
      // Show success message
      alert(`Document ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'finalized and digitalized'} successfully!`);
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
      case 'Forwarded to DLC': return <Forward className="w-5 h-5 text-purple-600" />;
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
      case 'Forwarded to DLC':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300`;
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
            Check Patta Documents - DLC
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and finalize patta documents forwarded from SDLC
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Forwarded to DLC">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Digitalized">Digitalized</option>
            </select>

            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Villages</option>
              <option value="चिरमिरी">चिरमिरी</option>
              <option value="पाकाला">पाकाला</option>
              <option value="चंबा">चंबा</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pattaDocuments.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pattaDocuments.filter(doc => doc.status === 'Forwarded to DLC').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pattaDocuments.filter(doc => doc.status === 'Approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Digitalized</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pattaDocuments.filter(doc => doc.status === 'Digitalized').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Patta Documents ({filteredDocuments.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((document) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {document.thumbnail ? (
                        <img
                          src={document.thumbnail}
                          alt="Document thumbnail"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {document.beneficiaryName}
                        </h3>
                        <span className={getStatusBadge(document.status)}>
                          {document.status}
                        </span>
                        {getStatusIcon(document.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{document.aadhaarNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{document.village}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{document.uploadDate.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>File:</strong> {document.fileName} ({formatFileSize(document.fileSize)})</p>
                        <p><strong>Volunteer:</strong> {document.volunteerName}</p>
                        {document.verifiedBy && (
                          <p><strong>Verified by:</strong> {document.verifiedBy} on {document.verifiedAt?.toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedDocument(document)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </motion.button>

                    {document.status === 'Digitalized' && document.digitalizedData && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDigitalizedData(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Database className="w-4 h-4" />
                        <span>View Digitalized Data</span>
                      </motion.button>
                    )}

                    {document.status === 'Forwarded to DLC' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                          setSelectedDocument(document);
                          setVerificationDecision('approve');
                          setShowVerificationModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Review</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Document Details
                </h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Beneficiary Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.beneficiaryName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Aadhaar Number</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.aadhaarNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Village</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.village}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Document Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Type</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.documentType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.fileName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size</label>
                      <p className="text-gray-900 dark:text-white">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Date</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.uploadDate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SDLC Review Information */}
              {selectedDocument.forwardedFromSDLC && selectedDocument.sdlcNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    SDLC Review Information
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                    <p className="text-gray-900 dark:text-white"><strong>SDLC Notes:</strong> {selectedDocument.sdlcNotes}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Reviewed by:</strong> {selectedDocument.sdlcVerifiedBy}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Reviewed at:</strong> {selectedDocument.sdlcVerifiedAt?.toLocaleString()}</p>
                    <p className="text-gray-900 dark:text-white"><strong>SDLC Status:</strong> {selectedDocument.sdlcReviewStatus}</p>
                  </div>
                </div>
              )}

              {/* Verification Notes */}
              {selectedDocument.verificationNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Verification Notes
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white">{selectedDocument.verificationNotes}</p>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Document Preview
                </h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                  {selectedDocument.thumbnail ? (
                    <img
                      src={selectedDocument.thumbnail}
                      alt="Document preview"
                      className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-16 h-16 mb-4" />
                      <p>Document preview not available</p>
                      <p className="text-sm">File: {selectedDocument.fileName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDocument.status === 'Forwarded to DLC' && (
                <div className="flex justify-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setVerificationDecision('approve');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    <span>Approve</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setVerificationDecision('reject');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setVerificationDecision('finalize');
                      setShowVerificationModal(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Finalize & Digitalize</span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {verificationDecision === 'approve' ? 'Approve Document' :
                 verificationDecision === 'reject' ? 'Reject Document' :
                 'Finalize & Digitalize Document'}
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={`Enter notes for ${verificationDecision === 'approve' ? 'approval' : verificationDecision === 'reject' ? 'rejection' : 'finalization'}...`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleVerification(selectedDocument.id, verificationDecision)}
                  className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
                    verificationDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    verificationDecision === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {verificationDecision === 'approve' ? 'Approve' :
                   verificationDecision === 'reject' ? 'Reject' :
                   'Finalize & Digitalize'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Digitalized Data Modal */}
      {showDigitalizedData && selectedDocument?.digitalizedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Digitalized Data - {selectedDocument.beneficiaryName}
                </h2>
                <button
                  onClick={() => setShowDigitalizedData(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Digitalized Data Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Extracted Information
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.beneficiaryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Aadhaar:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.aadhaarNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Village:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.village}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Claim Area:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.claimArea} acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Right Type:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.rightType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Forest Area:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.forestArea} acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Community:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.extractedData.tribalCommunity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Annual Income:</span>
                      <span className="text-gray-900 dark:text-white">₹{selectedDocument.digitalizedData.extractedData.income}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Digitalization Metadata
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Digitalized At:</span>
                      <span className="text-gray-900 dark:text-white">{new Date(selectedDocument.digitalizedData.digitalizedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Method:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.digitalizationMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Confidence Score:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.confidenceScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Processing Time:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.processingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-gray-900 dark:text-white">{selectedDocument.digitalizedData.metadata.verificationStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Blockchain & Security
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400 block mb-1">Blockchain Hash:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-sm break-all">
                      {selectedDocument.digitalizedData.blockchainHash}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400 block mb-1">Digital Signature:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-sm break-all">
                      {selectedDocument.digitalizedData.digitalSignature}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DLCCheckPatta;