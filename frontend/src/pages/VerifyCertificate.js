// frontend/src/pages/VerifyCertificate.js
import React, { useState } from 'react';
import { certificateAPI } from '../services/api';

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await certificateAPI.verify(certificateId.trim());
      setResult(response.data);
    } catch (err) {
      console.error('Verify error:', err);
      setError(err.response?.data?.error || 'Certificate not found or verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Verify Certificate
          </h1>
          <p className="text-lg text-gray-600">
            Enter the certificate ID to verify its authenticity on the blockchain
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8 animate-slide-up">
          <form onSubmit={handleVerify}>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g., CERT-2024-001)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Verification Result */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            {/* Status Banner */}
            <div className={`p-6 rounded-xl ${result.verified ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center justify-center">
                {result.verified ? (
                  <>
                    <svg className="w-12 h-12 text-green-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold text-green-800">✅ Certificate Verified</h2>
                      <p className="text-green-700">This certificate is authentic and valid</p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-red-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold text-red-800">❌ Verification Failed</h2>
                      <p className="text-red-700">This certificate could not be verified</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Certificate Details */}
            {result.certificate && (
              <div className="card">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                  Certificate Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Certificate ID</label>
                      <p className="text-lg font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded">{result.certificate.certificateId}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Student Name</label>
                      <p className="text-lg text-gray-800">{result.certificate.studentName}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Gender</label>
                      <p className="text-lg text-gray-800">{result.certificate.gender}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Date of Birth</label>
                      <p className="text-lg text-gray-800">{formatDate(result.certificate.dateOfBirth)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Course Name</label>
                      <p className="text-lg text-gray-800">{result.certificate.courseName}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Course Duration</label>
                      <p className="text-lg text-gray-800">{result.certificate.courseDuration} days</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Course Period</label>
                      <p className="text-lg text-gray-800">
                        {formatDate(result.certificate.courseStartDate)} - {formatDate(result.certificate.courseEndDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Location</label>
                      <p className="text-lg text-gray-800">{result.certificate.location}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Issue Date</label>
                      <p className="text-lg text-gray-800">{formatDate(result.certificate.issueDate)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-600">Registration Number</label>
                      <p className="text-lg text-gray-800">{result.certificate.registrationNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Student Photo */}
                {result.certificate.studentPhoto && (
                  <div className="mt-6 pt-6 border-t">
                    <label className="text-sm font-semibold text-gray-600 block mb-3">Student Photo</label>
                    <img 
                      src={result.certificate.studentPhoto} 
                      alt="Student" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}

                {/* Certificate Image */}
                {result.certificate.certificateImage && (
                  <div className="mt-6 pt-6 border-t">
                    <label className="text-sm font-semibold text-gray-600 block mb-3">Certificate Image</label>
                    <img 
                      src={result.certificate.certificateImage} 
                      alt="Certificate" 
                      className="w-full rounded-lg border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => window.open(result.certificate.certificateImage, '_blank')}
                    />
                    <p className="text-sm text-gray-500 mt-2">Click to view full size</p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-semibold text-gray-600 block mb-3">Status</label>
                  <span className={`badge ${
                    result.certificate.status === 'active' ? 'badge-success' : 
                    result.certificate.status === 'revoked' ? 'badge-error' : 'badge-warning'
                  }`}>
                    {result.certificate.status.toUpperCase()}
                  </span>
                </div>

                {/* Verification Count */}
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-600 block mb-2">Verification Count</label>
                  <p className="text-gray-800">{result.certificate.verificationCount} times verified</p>
                </div>
              </div>
            )}

            {/* Blockchain Info */}
            {result.blockchain && (
              <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Blockchain Information
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Block Index:</span>
                    <span className="font-mono font-semibold text-gray-800">{result.blockchain.blockIndex}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Block Hash:</span>
                    <span className="font-mono text-sm text-gray-800 break-all">{result.blockchain.blockHash}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Blockchain Status:</span>
                    <span className={`badge ${result.blockchain.isChainValid ? 'badge-success' : 'badge-error'}`}>
                      {result.blockchain.isChainValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="text-gray-800">{new Date(result.blockchain.timestamp).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                {/* Hash Verification */}
                {result.verification && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">Hash Verification:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Data Hash Match:</span>
                        <span className={`flex items-center ${result.verification.dataHashMatch ? 'text-green-600' : 'text-red-600'}`}>
                          {result.verification.dataHashMatch ? '✓ Verified' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Image Hash Match:</span>
                        <span className={`flex items-center ${result.verification.imageHashMatch ? 'text-green-600' : 'text-red-600'}`}>
                          {result.verification.imageHashMatch ? '✓ Verified' : '✗ Failed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Block Hash Match:</span>
                        <span className={`flex items-center ${result.verification.blockHashMatch ? 'text-green-600' : 'text-red-600'}`}>
                          {result.verification.blockHashMatch ? '✓ Verified' : '✗ Failed'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;