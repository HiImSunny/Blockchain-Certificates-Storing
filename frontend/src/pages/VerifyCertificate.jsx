import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import {
    verifyCertificateById,
    verifyCertificateByFile,
} from '../utils/api';

const VerifyCertificate = () => {
    const [mode, setMode] = useState('id'); // 'id' or 'file'
    const [certId, setCertId] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleVerifyById = async () => {
        if (!certId.trim()) {
            setError('Please enter a certificate ID');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await verifyCertificateById(certId);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyByFile = async (file) => {
        setUploadedFile(file);
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await verifyCertificateByFile(file);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const isValid = result?.blockchain?.valid && result?.certificate?.status === 'ISSUED';

    return (
        <div className="min-h-screen bg-neutral-cream">
            {/* Header */}
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-neutral-dark hover:text-primary mb-4">
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-dark">Verify Certificate</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Mode Selection */}
                <Card className="mb-8">
                    <h3 className="font-bold text-neutral-dark mb-4">Choose Verification Method</h3>
                    <div className="flex gap-4">
                        <Button
                            variant={mode === 'id' ? 'primary' : 'outline'}
                            onClick={() => { setMode('id'); setResult(null); setError(null); }}
                        >
                            By Certificate ID
                        </Button>
                        <Button
                            variant={mode === 'file' ? 'primary' : 'outline'}
                            onClick={() => { setMode('file'); setResult(null); setError(null); }}
                        >
                            By File Upload
                        </Button>
                    </div>
                </Card>

                {/* Verify by ID */}
                {mode === 'id' && (
                    <Card>
                        <h3 className="font-bold text-neutral-dark mb-4">Enter Certificate ID</h3>
                        <div className="flex gap-4">
                            <Input
                                placeholder="e.g., CERT-1738393200000-A1B2C3D4"
                                value={certId}
                                onChange={(e) => setCertId(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleVerifyById} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Verify by File */}
                {mode === 'file' && (
                    <Card>
                        <h3 className="font-bold text-neutral-dark mb-4">Upload Certificate File</h3>
                        <FileUpload onFileSelect={handleVerifyByFile} disabled={loading} />
                        {loading && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Loader className="animate-spin" />
                                <span>Verifying certificate...</span>
                            </div>
                        )}
                    </Card>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-8 p-6 border-2 border-red-500 bg-red-50">
                        <div className="flex items-center gap-3">
                            <XCircle size={32} className="text-red-500" />
                            <div>
                                <h3 className="font-bold text-red-700">Verification Failed</h3>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Result */}
                {result && (
                    <div className="mt-8">
                        {/* Status Banner */}
                        <div className={`p-6 border-2 mb-6 ${isValid
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                            }`}>
                            <div className="flex items-center gap-3">
                                {isValid ? (
                                    <>
                                        <CheckCircle size={32} className="text-green-500" />
                                        <div>
                                            <h3 className="font-bold text-green-700">Certificate is Valid</h3>
                                            <p className="text-green-600">
                                                This certificate is authentic and verified on the blockchain
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={32} className="text-red-500" />
                                        <div>
                                            <h3 className="font-bold text-red-700">Certificate is Invalid</h3>
                                            <p className="text-red-600">
                                                {result.certificate?.status === 'REVOKED'
                                                    ? 'This certificate has been revoked'
                                                    : 'This certificate could not be verified'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Certificate Details */}
                        <Card title="Certificate Details">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-neutral-gray">Certificate ID</p>
                                    <p className="font-medium">{result.certificate.certificateId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Status</p>
                                    <p className="font-medium">{result.certificate.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Student Name</p>
                                    <p className="font-medium">{result.certificate.studentName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Course Name</p>
                                    <p className="font-medium">{result.certificate.courseName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Issuer</p>
                                    <p className="font-medium">{result.certificate.issuerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Issued Date</p>
                                    <p className="font-medium">
                                        {new Date(result.certificate.issuedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {result.certificate.result && (
                                    <div>
                                        <p className="text-sm text-neutral-gray">Result</p>
                                        <p className="font-medium">{result.certificate.result}</p>
                                    </div>
                                )}
                                {result.certificate.duration && (
                                    <div>
                                        <p className="text-sm text-neutral-gray">Duration</p>
                                        <p className="font-medium">{result.certificate.duration}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-neutral-gray">
                                <p className="text-sm text-neutral-gray mb-2">File Hash (Blockchain)</p>
                                <p className="font-mono text-xs break-all">{result.certificate.certHash}</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-neutral-gray mb-2">Transaction Hash</p>
                                <p className="font-mono text-xs break-all">{result.certificate.txHash}</p>
                            </div>

                            <div className="mt-6 flex gap-4">
                                <a
                                    href={result.certificate.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button>Download Certificate</Button>
                                </a>
                            </div>
                        </Card>

                        {/* Blockchain Verification */}
                        {result.blockchain?.data && (
                            <Card title="Blockchain Verification" className="mt-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-neutral-gray">Issuer Address</p>
                                        <p className="font-mono text-xs break-all">
                                            {result.blockchain.data.issuer}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Blockchain Timestamp</p>
                                        <p className="font-medium">
                                            {new Date(result.blockchain.data.issuedAt * 1000).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Revoked</p>
                                        <p className="font-medium">
                                            {result.blockchain.data.revoked ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VerifyCertificate;
