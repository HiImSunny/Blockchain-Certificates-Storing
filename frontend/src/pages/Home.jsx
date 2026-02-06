import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Upload, Settings, FileCheck, Search,
    ArrowLeft, CheckCircle, XCircle, Loader
} from 'lucide-react';
import { CONTRACT_ADDRESS } from '../config/contract';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import FileUpload from '../components/FileUpload';
import MetaMaskConnect from '../components/MetaMaskConnect';
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
    const [isDownloading, setIsDownloading] = useState(false);

    // Check local storage for cached roles on mount
    useEffect(() => {
        const cachedRole = localStorage.getItem('user_role');
        if (cachedRole) {
            try {
                const { address, isAdmin: cachedAdmin, isOfficer: cachedOfficer } = JSON.parse(cachedRole);
                // We don't have current account yet, but we can optimistically set if we find a match later
                // actually, we can't really verify address match until we get the account. 
                // But we can store it in a ref or temp state if needed. 
                // Better strategy: Wait for account, then check cache.
            } catch (e) {
                console.error("Error parsing cached role", e);
            }
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 10; // 5 seconds total (500ms * 10)

        const init = async () => {
            // 1. Wait for MetaMask to be injected (fix race condition)
            const checkMetaMask = () => {
                if (window.ethereum) {
                    return true;
                }
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(checkMetaMask, 500);
                    return false;
                }
                return false;
            };

            // Simple polling for window.ethereum
            const waitForEthereum = () => new Promise((resolve) => {
                const check = () => {
                    if (window.ethereum) {
                        resolve(true);
                    } else if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(check, 500);
                    } else {
                        resolve(false);
                    }
                };
                check();
            });

            const ethereumReady = await waitForEthereum();

            if (!mounted) return;

            if (ethereumReady) {
                checkUserRole();
                window.ethereum.on('accountsChanged', checkUserRole);
            } else {
                console.warn("MetaMask not detected after retries");
            }
        };

        init();

        return () => {
            mounted = false;
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', checkUserRole);
            }
        };
    }, []);

    const checkUserRole = async (accounts) => {
        try {
            // Get account (either from event args or request)
            let currentAccount = null;
            if (accounts && accounts.length > 0) {
                currentAccount = accounts[0];
            } else {
                currentAccount = await getCurrentAccount();
            }

            if (currentAccount) {
                setAccount(currentAccount);

                // 1. FAST PATH: Check Cache
                const cachedRole = localStorage.getItem('user_role');
                if (cachedRole) {
                    try {
                        const parsed = JSON.parse(cachedRole);
                        if (parsed.address.toLowerCase() === currentAccount.toLowerCase()) {
                            console.log("⚡ [Cache] Role loaded from cache");
                            setIsAdmin(parsed.isAdmin);
                            setIsOfficer(parsed.isOfficer);
                        }
                    } catch (e) {
                        console.error("Cache parse error", e);
                    }
                }

                // 2. SLOW PATH: Verify with Blockchain (Background update)
                // We use Promise.allSettled to ensure one failure doesn't block the other check
                // but Promise.all is fine here as we want both.

                checkAdmin(currentAccount).then((adminResult) => {
                    checkOfficer(currentAccount).then((officerResult) => {
                        const newIsAdmin = adminResult.isAdmin;
                        const newIsOfficer = officerResult.isOfficer || adminResult.isAdmin;

                        // Only update state if changed (to avoid re-renders)
                        setIsAdmin(prev => {
                            if (prev !== newIsAdmin) return newIsAdmin;
                            return prev;
                        });
                        setIsOfficer(prev => {
                            if (prev !== newIsOfficer) return newIsOfficer;
                            return prev;
                        });

                        // Update Cache
                        const roleData = {
                            address: currentAccount,
                            isAdmin: newIsAdmin,
                            isOfficer: newIsOfficer,
                            timestamp: Date.now()
                        };
                        localStorage.setItem('user_role', JSON.stringify(roleData));
                    });
                }).catch(err => console.error("Background role check failed", err));

            } else {
                setAccount(null);
                setIsAdmin(false);
                setIsOfficer(false);
                // Clear sensitive cache on disconnect (optional, but safer)
                // localStorage.removeItem('user_role'); 
            }
        } catch (error) {
            console.error('Lỗi kiểm tra quyền:', error);
        }
    };

    const handleVerify = async () => {
        console.time("⏱️ Thời gian xác thực (Verify Time)");
        const startTime = performance.now();
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
                console.log(`[Performance] Bắt đầu xác thực ID: ${certId}`);
                result = await verifyCertificateById(certId);
            } else {
                if (!verifyFile) {
                    setVerifyError('Vui lòng chọn file chứng chỉ');
                    return;
                }
                console.log(`[Performance] Bắt đầu xác thực File: ${verifyFile.name}`);
                result = await verifyCertificateByFile(verifyFile);
            }

            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            console.log(`✅ [Performance] Xác thực hoàn tất trong: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

            setVerifyResult(result);
        } catch (error) {
            console.error('[Performance] Lỗi xác thực:', error);
            setVerifyError(error.response?.data?.error || error.message || 'Lỗi xác thực chứng chỉ');
        } finally {
            console.timeEnd("⏱️ Thời gian xác thực (Verify Time)");
            setVerifying(false);
        }
    };

    const handleDownload = async (url, filename) => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);
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
        } finally {
            setIsDownloading(false);
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
                            <MetaMaskConnect />
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
                        <div className="mt-8">
                            {/* Status Banner */}
                            <div className={`p-6 border-2 mb-6 ${verifyResult.blockchain?.valid && verifyResult.certificate?.status === 'ISSUED'
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {verifyResult.blockchain?.valid && verifyResult.certificate?.status === 'ISSUED' ? (
                                        <>
                                            <CheckCircle size={32} className="text-green-500" />
                                            <div>
                                                <h3 className="font-bold text-green-700">Chứng Chỉ Hợp Lệ</h3>
                                                <p className="text-green-600">
                                                    Chứng chỉ này là xác thực và đã được kiểm tra trên blockchain
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={32} className="text-red-500" />
                                            <div>
                                                <h3 className="font-bold text-red-700">Chứng Chỉ Không Hợp Lệ</h3>
                                                <p className="text-red-600">
                                                    {verifyResult.certificate?.status === 'REVOKED'
                                                        ? 'Chứng chỉ này đã bị thu hồi'
                                                        : 'Không thể xác thực chứng chỉ này'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Certificate Details */}
                            <Card title="Chi Tiết Chứng Chỉ">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-neutral-gray">Mã Chứng Chỉ</p>
                                        <p className="font-medium">{verifyResult.certificate.certificateId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Trạng Thái</p>
                                        <p className="font-medium">
                                            {verifyResult.certificate.status === 'ISSUED' ? 'Đã Cấp' : 'Đã Thu Hồi'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Tên Sinh Viên</p>
                                        <p className="font-medium">{verifyResult.certificate.studentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Tên Khóa Học</p>
                                        <p className="font-medium">{verifyResult.certificate.courseName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Đơn Vị Cấp</p>
                                        <p className="font-medium">{verifyResult.certificate.issuerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Ngày Cấp</p>
                                        <p className="font-medium">
                                            {new Date(verifyResult.certificate.issuedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    {verifyResult.certificate.result && (
                                        <div>
                                            <p className="text-sm text-neutral-gray">Kết Quả</p>
                                            <p className="font-medium">{verifyResult.certificate.result}</p>
                                        </div>
                                    )}
                                    {verifyResult.certificate.duration && (
                                        <div>
                                            <p className="text-sm text-neutral-gray">Thời Lượng</p>
                                            <p className="font-medium">{verifyResult.certificate.duration}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-neutral-gray">
                                    <p className="text-sm text-neutral-gray mb-2">File Hash (Blockchain)</p>
                                    <p className="font-mono text-xs break-all">{verifyResult.certificate.certHash}</p>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-neutral-gray mb-2">Transaction Hash</p>
                                    <p className="font-mono text-xs break-all">{verifyResult.certificate.txHash}</p>
                                </div>

                                <div className="mt-6 flex gap-4">
                                    <Button
                                        onClick={() => handleDownload(
                                            verifyResult.certificate.fileUrl,
                                            `chung-chi-${verifyResult.certificate.certificateId}.png`
                                        )}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader size={16} className="animate-spin" />
                                                <span>Đang tải...</span>
                                            </div>
                                        ) : (
                                            'Tải Xuống Chứng Chỉ ⬇️'
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Blockchain Verification */}
                            {verifyResult.blockchain?.data && (
                                <Card className="mt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="text-blue-600" size={24} />
                                        <h3 className="text-xl font-bold text-neutral-dark">
                                            Xác Thực Blockchain
                                        </h3>
                                    </div>

                                    <div className="p-4 bg-blue-50 border-2 border-blue-200 mb-4">
                                        <p className="text-sm text-blue-700">
                                            <strong>🔗 Đã xác thực trên Cronos Blockchain</strong> - Chứng chỉ này đã được xác thực trên blockchain công khai,
                                            minh bạch và không thể thay đổi. Bất kỳ ai cũng có thể xác minh thông tin này độc lập.
                                        </p>
                                    </div>

                                    {/* Hash Comparison - PROOF */}
                                    <div className="mb-4 p-4 bg-green-50 border-2 border-green-500">
                                        <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                            ✓ Bằng Chứng: Xác Thực Hash (Keccak-256)
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
                                                            ✅ <strong>KHỚP!</strong> Hai mã hash giống hệt nhau, chứng minh rằng file này
                                                            chính xác là file đã được lưu trên blockchain. Giao dịch không thể bị làm giả!
                                                        </>
                                                    ) : (
                                                        <>
                                                            ❌ <strong>KHÔNG KHỚP!</strong> Mã hash không trùng khớp - file có thể đã bị chỉnh sửa!
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-neutral-gray">Địa chỉ Người Cấp (Blockchain)</p>
                                            <p className="font-mono text-xs break-all bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                                {verifyResult.blockchain.data.issuer}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-gray">Thời gian ghi nhận (Timestamp)</p>
                                            <p className="font-medium bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                                {new Date(verifyResult.blockchain.data.issuedAt * 1000).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-gray">Trạng thái thu hồi</p>
                                            <p className="font-medium bg-neutral-cream p-2 border border-neutral-dark mt-1">
                                                {verifyResult.blockchain.data.revoked ? 'Có (Đã thu hồi)' : 'Không (Hợp lệ)'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-gray">Transaction Hash</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="font-mono break-all bg-neutral-cream p-2 border border-neutral-dark flex-1">
                                                    {verifyResult.certificate.txHash?.slice(0, 8)}...{verifyResult.certificate.txHash?.slice(-3)}
                                                </p>
                                                <a
                                                    href={`https://explorer.cronos.org/testnet/tx/${verifyResult.certificate.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 bg-primary text-white hover:bg-opacity-90 whitespace-nowrap border-2 border-neutral-dark flex items-center justify-center"
                                                >
                                                    Xem trên Explorer 🔍
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {verifyResult.certificate.status === 'REVOKED' && verifyResult.certificate.revokeTxHash && (
                                        <div>
                                            <p className="text-sm text-neutral-gray text-red-600 font-bold mt-4">Transaction Hash Thu Hồi</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="font-mono break-all bg-red-50 p-2 border border-red-200 flex-1 text-red-700">
                                                    {verifyResult.certificate.revokeTxHash?.slice(0, 25)}...{verifyResult.certificate.revokeTxHash?.slice(-3)}
                                                </p>
                                                <a
                                                    href={`https://explorer.cronos.org/testnet/tx/${verifyResult.certificate.revokeTxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 bg-red-600 text-white hover:bg-opacity-90 whitespace-nowrap border-2 border-neutral-dark flex items-center justify-center"
                                                >
                                                    Xem Lệnh Thu Hồi 🔍
                                                </a>
                                            </div>
                                        </div>
                                    )}




                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300">
                                        <p className="text-xs text-yellow-800">
                                            💡 <strong>Ghi chú minh bạch:</strong> Nhấn "Xem trên Explorer" để kiểm tra giao dịch này trên blockchain Cronos công khai.
                                            Bạn có thể tự mình xác minh rằng mã hash trong giao dịch khớp với mã hash của file này.
                                        </p>
                                    </div>
                                </Card>
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
