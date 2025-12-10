// frontend/src/pages/UploadCertificate.js
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { certificateAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const UploadCertificate = () => {
  const { isConnected, account } = useWallet();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    certificateId: '',
    studentName: '',
    gender: 'Nam',
    dateOfBirth: '',
    courseName: '',
    courseStartDate: '',
    courseEndDate: '',
    courseDuration: '',
    location: '',
    registrationNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
  });

  const [files, setFiles] = useState({
    studentPhoto: null,
    certificateImage: null,
  });

  const [previews, setPreviews] = useState({
    studentPhoto: null,
    certificateImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if not connected
  React.useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto calculate course duration
    if (name === 'courseStartDate' || name === 'courseEndDate') {
      const startDate = name === 'courseStartDate' ? value : formData.courseStartDate;
      const endDate = name === 'courseEndDate' ? value : formData.courseEndDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        setFormData(prev => ({
          ...prev,
          courseDuration: duration > 0 ? duration : ''
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${name} must be less than 10MB`);
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(`${name} must be an image (JPG, PNG) or PDF`);
        return;
      }

      setFiles(prev => ({
        ...prev,
        [name]: file
      }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [name]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => ({
          ...prev,
          [name]: 'PDF file selected'
        }));
      }

      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!files.studentPhoto || !files.certificateImage) {
      setError('Please upload both student photo and certificate image');
      return;
    }

    // Validate dates
    if (new Date(formData.courseStartDate) > new Date(formData.courseEndDate)) {
      setError('Course start date must be before end date');
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Append files
      submitData.append('studentPhoto', files.studentPhoto);
      submitData.append('certificateImage', files.certificateImage);

      // Submit to API
      const response = await certificateAPI.create(submitData);

      setSuccess(true);
      setError('');

      // Show success message
      alert(`Certificate created successfully!\nCertificate ID: ${response.data.certificate.certificateId}\nBlock Index: ${response.data.certificate.blockIndex}`);

      // Reset form
      setFormData({
        certificateId: '',
        studentName: '',
        gender: 'Nam',
        dateOfBirth: '',
        courseName: '',
        courseStartDate: '',
        courseEndDate: '',
        courseDuration: '',
        location: '',
        registrationNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
      });
      setFiles({ studentPhoto: null, certificateImage: null });
      setPreviews({ studentPhoto: null, certificateImage: null });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Upload Certificate
          </h1>
          <p className="text-lg text-gray-600">
            Fill in the certificate details and upload to blockchain
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Connected Wallet: <span className="font-mono font-semibold">{account}</span>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-slide-up">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Certificate uploaded successfully! Redirecting to dashboard...
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-slide-up">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card animate-slide-up">
          <div className="space-y-6">
            {/* Certificate ID (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificate ID (Optional)
                <span className="text-gray-500 font-normal ml-2">Leave blank for auto-generation</span>
              </label>
              <input
                type="text"
                name="certificateId"
                value={formData.certificateId}
                onChange={handleInputChange}
                placeholder="e.g., CERT-2024-001"
                className="input-field"
              />
            </div>

            {/* Student Information */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="Nam">Nam (Male)</option>
                    <option value="Nữ">Nữ (Female)</option>
                    <option value="Khác">Khác (Other)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Course Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    required
                    placeholder="Advanced Web Development"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="courseStartDate"
                      value={formData.courseStartDate}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="courseEndDate"
                      value={formData.courseEndDate}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="courseDuration"
                      value={formData.courseDuration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      placeholder="Auto-calculated"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Hanoi, Vietnam"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Certificate Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="REG-2024-001"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Files</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Photo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Photo (3x4) <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      name="studentPhoto"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png"
                      required
                      className="hidden"
                      id="studentPhoto"
                    />
                    <label htmlFor="studentPhoto" className="cursor-pointer">
                      {previews.studentPhoto ? (
                        <img src={previews.studentPhoto} alt="Student" className="w-32 h-40 object-cover mx-auto rounded border-2 border-gray-200" />
                      ) : (
                        <div className="text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Click to upload photo</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Certificate Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certificate Image/PDF <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      name="certificateImage"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      required
                      className="hidden"
                      id="certificateImage"
                    />
                    <label htmlFor="certificateImage" className="cursor-pointer">
                      {previews.certificateImage ? (
                        typeof previews.certificateImage === 'string' && previews.certificateImage.startsWith('data:') ? (
                          <img src={previews.certificateImage} alt="Certificate" className="w-full h-40 object-contain mx-auto rounded border-2 border-gray-200" />
                        ) : (
                          <div className="text-green-600">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold">PDF file uploaded</p>
                          </div>
                        )
                      ) : (
                        <div className="text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm">Click to upload certificate</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    Uploading to Blockchain...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Certificate to Blockchain
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadCertificate;