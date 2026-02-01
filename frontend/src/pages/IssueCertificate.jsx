import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import MetaMaskConnect from '../components/MetaMaskConnect';
import Modal from '../components/ui/Modal';
import {
    uploadCertificate,
    createCertificate,
    confirmCertificate,
} from '../utils/api';
import { connectMetaMask, issueCertificate } from '../utils/metamask';

const IssueCertificate = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('upload'); // 'upload' or 'manual'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Upload mode state
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadData, setUploadData] = useState(null);

    // Manual mode state
    const [formData, setFormData] = useState({
        studentName: '',
        studentId: '',
        courseName: '',
        courseCode: '',
        trainingType: 'Online',
        duration: '',
        result: '',
        issuedAt: new Date().toISOString().split('T')[0],
        issuerName: '',
        issuerWebsite: '',
        issuerContact: '',
    });

    // Preview modal
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const handleFileSelect = async (file) => {
        setUploadedFile(file);
        setLoading(true);
        setError(null);

        try {
            const result = await uploadCertificate(file);
            setUploadData(result);

            // Pre-fill form with extracted data
            if (result.extractedData) {
                setFormData((prev) => ({
                    ...prev,
                    ...result.extractedData,
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualCreate = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await createCertificate(formData);
            setUploadData(result);
            setShowPreview(true);
            setPreviewData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueToBlockchain = async () => {
        setLoading(true);
        setError(null);

        try {
            // Connect MetaMask
            const { signer, address } = await connectMetaMask();

            // Issue certificate on blockchain
            const { txHash, certId } = await issueCertificate(
                signer,
                uploadData.certHash
            );

            // Confirm with backend
            await confirmCertificate({
                certificateId: uploadData.certificateId,
                certHash: uploadData.certHash,
                txHash,
                issuerAddress: address,
                blockchainCertId: certId,
                fileUrl: uploadData.fileUrl,
                cloudinaryPublicId: uploadData.cloudinaryPublicId,
                fileType: uploadData.fileType,
                ...formData,
            });

            setSuccess(`Certificate issued successfully! ID: ${uploadData.certificateId}`);
            setShowPreview(false);

            // Redirect to certificate detail page after 2 seconds
            setTimeout(() => {
                navigate(`/certificate/${uploadData.certificateId}`);
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-cream">
            {/* Header */}
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-neutral-dark hover:text-primary mb-4">
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-dark">Issue Certificate</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* MetaMask Connection */}
                <Card className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-neutral-dark mb-1">Wallet Connection</h3>
                            <p className="text-sm text-neutral-gray">
                                Connect your wallet to issue certificates on blockchain
                            </p>
                        </div>
                        <MetaMaskConnect />
                    </div>
                </Card>

                {/* Mode Selection */}
                <Card className="mb-8">
                    <h3 className="font-bold text-neutral-dark mb-4">Choose Input Method</h3>
                    <div className="flex gap-4">
                        <Button
                            variant={mode === 'upload' ? 'primary' : 'outline'}
                            onClick={() => setMode('upload')}
                        >
                            Upload File
                        </Button>
                        <Button
                            variant={mode === 'manual' ? 'primary' : 'outline'}
                            onClick={() => setMode('manual')}
                        >
                            Manual Input
                        </Button>
                    </div>
                </Card>

                {/* Upload Mode */}
                {mode === 'upload' && (
                    <Card>
                        <h3 className="font-bold text-neutral-dark mb-4">Upload Certificate</h3>
                        <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
                        {loading && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Loader className="animate-spin" />
                                <span>Processing file...</span>
                            </div>
                        )}
                    </Card>
                )}

                {/* Form (shown for both modes after upload or for manual) */}
                {((mode === 'upload' && uploadData) || mode === 'manual') && (
                    <Card className="mt-8">
                        <h3 className="font-bold text-neutral-dark mb-4">Certificate Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Student Name"
                                value={formData.studentName}
                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                required
                            />
                            <Input
                                label="Student ID"
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            />
                            <Input
                                label="Course Name"
                                value={formData.courseName}
                                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                required
                            />
                            <Input
                                label="Course Code"
                                value={formData.courseCode}
                                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                            />
                            <div>
                                <label className="text-sm font-medium text-neutral-dark block mb-1">
                                    Training Type
                                </label>
                                <select
                                    value={formData.trainingType}
                                    onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-neutral-dark bg-white"
                                >
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                            <Input
                                label="Duration"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="e.g., 3 months, 120 hours"
                            />
                            <Input
                                label="Result"
                                value={formData.result}
                                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                placeholder="e.g., Pass, Distinction, 8.5/10"
                            />
                            <Input
                                label="Issued Date"
                                type="date"
                                value={formData.issuedAt}
                                onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                                required
                            />
                            <Input
                                label="Issuer Name"
                                value={formData.issuerName}
                                onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                                required
                            />
                            <Input
                                label="Issuer Website"
                                value={formData.issuerWebsite}
                                onChange={(e) => setFormData({ ...formData, issuerWebsite: e.target.value })}
                            />
                            <Input
                                label="Issuer Contact"
                                value={formData.issuerContact}
                                onChange={(e) => setFormData({ ...formData, issuerContact: e.target.value })}
                                placeholder="Email or phone"
                            />
                        </div>

                        <div className="flex gap-4 mt-6">
                            {mode === 'manual' && (
                                <Button onClick={handleManualCreate} disabled={loading}>
                                    {loading ? 'Generating PDF...' : 'Generate PDF Preview'}
                                </Button>
                            )}
                            {mode === 'upload' && uploadData && (
                                <Button onClick={() => { setShowPreview(true); setPreviewData(uploadData); }}>
                                    Preview & Issue
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {/* Error/Success Messages */}
                {error && (
                    <div className="mt-4 p-4 border-2 border-red-500 bg-red-50 text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-4 p-4 border-2 border-green-500 bg-green-50 text-green-700">
                        {success}
                    </div>
                )}
            </main>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Certificate Preview"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleIssueToBlockchain} disabled={loading}>
                            {loading ? 'Issuing...' : 'Issue to Blockchain'}
                        </Button>
                    </>
                }
            >
                {previewData && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-neutral-gray">Certificate ID</p>
                            <p className="font-medium">{previewData.certificateId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-gray">File Hash</p>
                            <p className="font-mono text-xs break-all">{previewData.certHash}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-gray">File URL</p>
                            <a
                                href={previewData.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline text-sm"
                            >
                                View Certificate
                            </a>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-sm text-neutral-gray mb-2">Student Information</p>
                            <p><strong>Name:</strong> {formData.studentName}</p>
                            <p><strong>Course:</strong> {formData.courseName}</p>
                            <p><strong>Issuer:</strong> {formData.issuerName}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default IssueCertificate;
