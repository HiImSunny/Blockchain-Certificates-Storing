import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Upload, Settings, FileCheck, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import { getCurrentAccount } from '../utils/metamask';
import { checkAdmin, checkOfficer, verifyCertificateById, verifyCertificateByFile } from '../utils/api';

const Home = () => {
    const [account, setAccount] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOfficer, setIsOfficer] = useState(false);

    // Verify state
    const [verifyMode, setVerifyMode] = useState('id'); // 'id' or 'file'
    const [certId, setCertId] = useState('');
    const [verifyFile, setVerifyFile] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifyError, setVerifyError] = useState(null);

    useEffect(() => {
        checkUserRole();

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', checkUserRole);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', checkUserRole);
            }
        };
    }, []);

    const checkUserRole = async () => {
        try {
            const currentAccount = await getCurrentAccount();
            if (currentAccount) {
                setAccount(currentAccount);
                const [adminResult, officerResult] = await Promise.all([
                    checkAdmin(currentAccount),
                    checkOfficer(currentAccount)
                ]);
                setIsAdmin(adminResult.isAdmin);
                setIsOfficer(officerResult.isOfficer || adminResult.isAdmin);
            } else {
                setAccount(null);
                setIsAdmin(false);
                setIsOfficer(false);
            }
        } catch (error) {
            console.error('Lỗi kiểm tra quyền:', error);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        setVerifyError(null);
        setVerifyResult(null);

        try {
            let result;
            if (verifyMode === 'id') {
                if (!certId.trim()) {
                    setVerifyError('Vui lòng nhập mã chứng chỉ');
                    return;
                }
                result = await verifyCertificateById(certId);
            } else {
                if (!verifyFile) {
                    setVerifyError('Vui lòng chọn file chứng chỉ');
                    return;
                }
                result = await verifyCertificateByFile(verifyFile);
            }

            setVerifyResult(result);
        } catch (error) {
            setVerifyError(error.response?.data?.error || error.message || 'Lỗi xác thực chứng chỉ');
        } finally {
            setVerifying(false);
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'chung-chi.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-cream">
            {/* Header */}
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-dark">
                                Hệ Thống Chứng Chỉ Blockchain - DNC
                            </h1>
                            <p className="text-neutral-gray mt-2">
                                Xác thực chứng chỉ an toàn, minh bạch trên Cronos Blockchain
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {isOfficer && (
                                <Link to="/issue">
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Upload size={20} />
                                        Phát Hành
                                    </Button>
                                </Link>
                            )}
                            {isAdmin && (
                                <Link to="/admin">
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Settings size={20} />
                                        Quản Trị
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Verify Section */}
                <Card className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 border-2 border-primary">
                            <Shield size={32} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-dark">Xác Thực Chứng Chỉ</h2>
                            <p className="text-neutral-gray">Kiểm tra tính xác thực của chứng chỉ trên blockchain</p>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="flex gap-4 mb-6">
                        <Button
                            variant={verifyMode === 'id' ? 'primary' : 'outline'}
                            onClick={() => {
                                setVerifyMode('id');
                                setVerifyResult(null);
                                setVerifyError(null);
                            }}
                            className="flex-1"
                        >
                            <Search size={20} className="mr-2" />
                            Theo Mã Chứng Chỉ
                        </Button>
                        <Button
                            variant={verifyMode === 'file' ? 'primary' : 'outline'}
                            onClick={() => {
                                setVerifyMode('file');
                                setVerifyResult(null);
                                setVerifyError(null);
                            }}
                            className="flex-1"
                        >
                            <FileCheck size={20} className="mr-2" />
                            Tải File Lên
                        </Button>
                    </div>

                    {/* Verify by ID */}
                    {verifyMode === 'id' && (
                        <div className="space-y-4">
                            <Input
                                label="Mã Chứng Chỉ"
                                value={certId}
                                onChange={(e) => setCertId(e.target.value)}
                                placeholder="Ví dụ: CERT-1738393200000-A1B2C3D4"
                            />
                            <Button onClick={handleVerify} disabled={verifying} className="w-full">
                                {verifying ? 'Đang xác thực...' : 'Xác Thực'}
                            </Button>
                        </div>
                    )}

                    {/* Verify by File */}
                    {verifyMode === 'file' && (
                        <div className="space-y-4">
                            <FileUpload
                                onFileSelect={setVerifyFile}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <Button onClick={handleVerify} disabled={verifying || !verifyFile} className="w-full">
                                {verifying ? 'Đang xác thực...' : 'Xác Thực'}
                            </Button>
                        </div>
                    )}

                    {/* Error */}
                    {verifyError && (
                        <div className="mt-4 p-4 border-2 border-red-500 bg-red-50 text-red-700">
                            {verifyError}
                        </div>
                    )}

                    {/* Result */}
                    {verifyResult && (
                        <div className="mt-6 space-y-4">
                            {/* Status Banner */}
                            <div className="p-6 border-2 border-green-500 bg-green-50">
                                <h3 className="text-xl font-bold text-green-700 mb-4">
                                    ✅ Chứng Chỉ Hợp Lệ
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Mã chứng chỉ:</strong> {verifyResult.certificate.certificateId}</p>
                                    <p><strong>Tên sinh viên:</strong> {verifyResult.certificate.studentName}</p>
                                    <p><strong>Khóa học:</strong> {verifyResult.certificate.courseName}</p>
                                    <p><strong>Ngày cấp:</strong> {new Date(verifyResult.certificate.issuedAt).toLocaleDateString('vi-VN')}</p>
                                    <p><strong>Trạng thái:</strong>
                                        <span className={`ml-2 px-2 py-1 text-xs border ${verifyResult.certificate.status === 'ISSUED'
                                            ? 'border-green-500 bg-green-100 text-green-700'
                                            : 'border-red-500 bg-red-100 text-red-700'
                                            }`}>
                                            {verifyResult.certificate.status === 'ISSUED' ? 'Đã Cấp' : 'Đã Thu Hồi'}
                                        </span>
                                    </p>
                                    {verifyResult.certificate.fileUrl && (
                                        <button
                                            onClick={() => handleDownload(
                                                verifyResult.certificate.fileUrl,
                                                `chung-chi-${verifyResult.certificate.certificateId}.png`
                                            )}
                                            className="inline-block mt-2 text-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                                        >
                                            📄 Tải xuống chứng chỉ
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Blockchain Verification Proof */}
                            {verifyResult.blockchain?.valid && verifyResult.blockchain?.data && (
                                <div className="p-6 border-2 border-blue-500 bg-blue-50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="text-blue-600" size={24} />
                                        <h3 className="text-xl font-bold text-blue-700">
                                            🔗 Xác Thực Trên Blockchain
                                        </h3>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-4">
                                        Chứng chỉ này đã được xác thực trên <strong>Cronos Blockchain</strong> - một blockchain công khai,
                                        minh bạch và không thể thay đổi. Bất kỳ ai cũng có thể xác minh thông tin này.
                                    </p>

                                    {/* Hash Comparison - PROOF */}
                                    <div className="mb-4 p-4 bg-green-50 border-2 border-green-500">
                                        <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                            ✓ Bằng Chứng: Hash Khớp Nhau (Keccak-256)
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <p className="text-green-700 font-medium mb-1">
                                                    📄 Keccak-256 Hash của file chứng chỉ này:
                                                </p>
                                                <p className="font-mono text-xs break-all bg-white p-2 border border-green-400">
                                                    {verifyResult.certificate.certHash}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <div className="text-2xl text-green-600">⬇️</div>
                                            </div>
                                            <div>
                                                <p className="text-green-700 font-medium mb-1">
                                                    🔗 Keccak-256 Hash được lưu trên Blockchain:
                                                </p>
                                                <p className="font-mono text-xs break-all bg-white p-2 border border-green-400">
                                                    {verifyResult.blockchain.data.certHash}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-green-400">
                                                <p className="text-xs text-green-800 font-medium">
                                                    {verifyResult.certificate.certHash === verifyResult.blockchain.data.certHash ? (
                                                        <>
                                                            ✅ <strong>KHỚP!</strong> Hai hash giống hệt nhau, chứng minh rằng file này
                                                            chính xác là file đã được lưu trên blockchain. Transaction không thể giả mạo!
                                                        </>
                                                    ) : (
                                                        <>
                                                            ❌ <strong>KHÔNG KHỚP!</strong> Hash không giống nhau - file có thể đã bị thay đổi!
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-blue-600 font-medium">Địa chỉ đơn vị cấp (Blockchain):</p>
                                            <p className="font-mono text-xs break-all bg-white p-2 border border-blue-300 mt-1">
                                                {verifyResult.blockchain.data.issuer}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-medium">Thời gian ghi trên Blockchain:</p>
                                            <p className="bg-white p-2 border border-blue-300 mt-1">
                                                {new Date(verifyResult.blockchain.data.issuedAt * 1000).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-medium">Transaction Hash:</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="font-mono text-xs break-all bg-white p-2 border border-blue-300 flex-1">
                                                    {verifyResult.certificate.txHash}
                                                </p>
                                                <a
                                                    href={`https://explorer.cronos.org/testnet/tx/${verifyResult.certificate.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 bg-blue-600 text-white text-xs hover:bg-blue-700 whitespace-nowrap"
                                                >
                                                    Xem trên Explorer 🔍
                                                </a>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-blue-300">
                                            <p className="text-xs text-blue-600">
                                                💡 <strong>Lưu ý:</strong> Click vào "Xem trên Explorer" để xem giao dịch trên blockchain công khai.
                                                Bạn có thể tự mình verify rằng cert hash trong transaction khớp với cert hash của file này.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* How It Works */}
                <Card>
                    <h3 className="text-2xl font-bold text-neutral-dark mb-6 text-center">
                        Cách Hoạt Động
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">Phát Hành</h4>
                            <p className="text-sm text-neutral-gray">
                                Tải lên hoặc tạo chứng chỉ mới với AI tự động trích xuất thông tin
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">
                                Ký Bằng MetaMask
                            </h4>
                            <p className="text-sm text-neutral-gray">
                                Kết nối ví và ký giao dịch để lưu hash chứng chỉ lên blockchain
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">
                                Xác Thực Bất Kỳ Lúc Nào
                            </h4>
                            <p className="text-sm text-neutral-gray">
                                Bất kỳ ai cũng có thể xác thực chứng chỉ bằng mã hoặc file
                            </p>
                        </div>
                    </div>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-neutral-dark bg-white mt-16">
                <div className="container mx-auto px-4 py-6 text-center text-neutral-gray">
                    <p>© 2026 Hệ Thống Chứng Chỉ Blockchain - DNC. Powered by Cronos Blockchain.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
