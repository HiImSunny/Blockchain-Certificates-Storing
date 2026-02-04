import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader, Shield } from 'lucide-react';
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

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'certificate.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab
            window.open(url, '_blank');
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
                                <Button
                                    onClick={() => handleDownload(
                                        result.certificate.fileUrl,
                                        `certificate-${result.certificate.certificateId}.png`
                                    )}
                                >
                                    Download Certificate ⬇️
                                </Button>
                            </div>
                        </Card>

                        {/* Blockchain Verification */}
                        {result.blockchain?.data && (
                            <Card className="mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="text-blue-600" size={24} />
                                    <h3 className="text-xl font-bold text-neutral-dark">
                                        Blockchain Verification
                                    </h3>
                                </div>

                                <div className="p-4 bg-blue-50 border-2 border-blue-200 mb-4">
                                    <p className="text-sm text-blue-700">
                                        <strong>🔗 Verified on Cronos Blockchain</strong> - This certificate has been verified on a public,
                                        transparent, and immutable blockchain. Anyone can verify this information independently.
                                    </p>
                                </div>

                                {/* Hash Comparison - PROOF */}
                                <div className="mb-4 p-4 bg-green-50 border-2 border-green-500">
                                    <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                        ✓ Proof: Hash Match Verification (Keccak-256)
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-green-700 font-medium mb-1">
                                                📄 Keccak-256 Hash of this certificate file:
                                            </p>
                                            <p className="font-mono text-xs break-all bg-white p-2 border border-green-400">
                                                {result.certificate.certHash}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="text-2xl text-green-600">⬇️</div>
                                        </div>
                                        <div>
                                            <p className="text-green-700 font-medium mb-1">
                                                🔗 Keccak-256 Hash stored on Blockchain:
                                            </p>
                                            <p className="font-mono text-xs break-all bg-white p-2 border border-green-400">
                                                {result.blockchain.data.certHash}
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-green-400">
                                            <p className="text-xs text-green-800 font-medium">
                                                {result.certificate.certHash === result.blockchain.data.certHash ? (
                                                    <>
                                                        ✅ <strong>MATCH!</strong> Both hashes are identical, proving that this file
                                                        is exactly the same file stored on the blockchain. The transaction cannot be faked!
                                                    </>
                                                ) : (
                                                    <>
                                                        ❌ <strong>MISMATCH!</strong> Hashes don't match - the file may have been altered!
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-neutral-gray">Issuer Address (Blockchain)</p>
                                        <p className="font-mono text-xs break-all bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                            {result.blockchain.data.issuer}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Blockchain Timestamp</p>
                                        <p className="font-medium bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                            {new Date(result.blockchain.data.issuedAt * 1000).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Revoked Status</p>
                                        <p className="font-medium bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                            {result.blockchain.data.revoked ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Transaction Hash</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="font-mono text-xs break-all bg-neutral-cream p-2 border border-neutral-dark flex-1">
                                                {result.certificate.txHash?.slice(0, 20)}...
                                            </p>
                                            <a
                                                href={`https://explorer.cronos.org/testnet/tx/${result.certificate.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-primary text-white text-xs hover:bg-opacity-90 whitespace-nowrap border-2 border-neutral-dark"
                                            >
                                                View on Explorer 🔍
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300">
                                    <p className="text-xs text-yellow-800">
                                        💡 <strong>Transparency Note:</strong> Click "View on Explorer" to see this transaction on the public Cronos blockchain.
                                        You can independently verify that the cert hash in the transaction matches the cert hash of this file.
                                    </p>
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
