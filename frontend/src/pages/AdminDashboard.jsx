import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, FileText, TrendingUp, Loader, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import MetaMaskConnect from '../components/MetaMaskConnect';
import {
    checkAdmin,
    getStats,
    listCertificates,
    revokeCertificate as apiRevokeCertificate,
    listOfficers,
    verifyCertificateById,
} from '../utils/api';
import {
    getCurrentAccount,
    connectMetaMask,
    revokeCertificate as blockchainRevokeCertificate,
    addOfficer as blockchainAddOfficer,
    removeOfficer as blockchainRemoveOfficer,
} from '../utils/metamask';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Separate loading states
    const [statsLoading, setStatsLoading] = useState(false);
    const [certsLoading, setCertsLoading] = useState(false);
    const [officersLoading, setOfficersLoading] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);
    // Use a ref to track if data has been initiated to prevent double-fetch in StrictMode
    const dataInitiated = React.useRef(false);

    const [account, setAccount] = useState(null);
    const [stats, setStats] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Officer management
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [officerAction, setOfficerAction] = useState('add'); // 'add' or 'remove'
    const [officerAddress, setOfficerAddress] = useState('');
    const [officerName, setOfficerName] = useState('');
    const [officerLoading, setOfficerLoading] = useState(false);

    // Revoke modal
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [viewDetailsLoading, setViewDetailsLoading] = useState(false); // Lazy load state

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    // Re-check when account changes (MetaMask connection)
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    // Optionally re-check admin here if needed, but usually redundant if cached
                    // For safety, we can just reload the page or let the user re-connect
                } else {
                    setIsAdmin(false);
                    setAccount(null);
                }
            });
        }
    }, []);

    const checkAdminAccess = async () => {
        try {
            const currentAccount = await getCurrentAccount();
            if (!currentAccount) {
                setCheckingAuth(false);
                return;
            }

            setAccount(currentAccount);

            // Fast check from cache or backend
            const adminCheck = await checkAdmin(currentAccount);
            if (!adminCheck.isAdmin) {
                setError('Truy cập bị từ chối: Bạn không phải admin');
                setCheckingAuth(false);
                return;
            }

            setIsAdmin(true);
            setCheckingAuth(false);

            // TRIGGERS DATA LOADING ONLY ONCE
            if (!dataInitiated.current) {
                dataInitiated.current = true;
                loadDashboardData();
            }
        } catch (err) {
            setError(err.message);
            setCheckingAuth(false);
        }
    };

    const loadDashboardData = () => {
        // Load independent parts in parallel (Progressive Rendering)
        loadStats();
        loadOfficers();
        loadCertificates();
    };

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const data = await getStats();
            setStats(data.stats);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const loadOfficers = async () => {
        try {
            setOfficersLoading(true);
            const data = await listOfficers();
            setOfficers(data.officers);
        } catch (err) {
            console.error("Failed to load officers", err);
        } finally {
            setOfficersLoading(false);
        }
    };

    const loadCertificates = async () => {
        try {
            setCertsLoading(true);
            const data = await listCertificates({ page, limit: 10 });
            setCertificates(data.certificates);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load certificates", err);
            setError("Lỗi tải danh sách chứng chỉ: " + err.message);
        } finally {
            setCertsLoading(false);
        }
    };

    const handleOfficerAction = async () => {
        if (!officerAddress.trim()) {
            setError('Vui lòng nhập địa chỉ officer');
            return;
        }

        if (officerAction === 'add' && !officerName.trim()) {
            setError('Vui lòng nhập tên officer');
            return;
        }

        setOfficerLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { signer } = await connectMetaMask();

            let txHash;
            if (officerAction === 'add') {
                txHash = await blockchainAddOfficer(signer, officerAddress, officerName);
                setSuccess(`Thêm officer thành công! TX: ${txHash}`);
            } else {
                txHash = await blockchainRemoveOfficer(signer, officerAddress);
                setSuccess(`Xóa officer thành công! TX: ${txHash}`);
            }

            setShowOfficerModal(false);
            setOfficerAddress('');
            setOfficerName('');
            // Reload data after delay
            setTimeout(() => {
                loadOfficers();
                loadStats(); // Officer count might change
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setOfficerLoading(false);
        }
    };

    const handleViewDetails = async (cert) => {
        setViewTarget(cert);
        setShowViewModal(true);

        // Lazy load TxHash if missing (because we optimized /list to skip it)
        // Checks if Issuance Hash is missing OR if it's Revoked but missing Revoke Hash
        const isMissingData = !cert.txHash || (cert.status === 'REVOKED' && !cert.revokeTxHash);

        if (isMissingData) {
            try {
                setViewDetailsLoading(true);
                // Use backend verification API to fetch full details including TxHash
                const response = await verifyCertificateById(cert.certificateId);

                if (response.certificate) {
                    // Update view target with full details
                    setViewTarget(prev => ({
                        ...prev,
                        ...response.certificate
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch additional details", err);
            } finally {
                setViewDetailsLoading(false);
            }
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;

        setRevokeLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { signer } = await connectMetaMask();

            // Revoke on blockchain
            const txHash = await blockchainRevokeCertificate(
                signer,
                revokeTarget.certId
            );

            // Update database
            await apiRevokeCertificate(revokeTarget.certificateId, txHash);

            setSuccess(`Thu hồi chứng chỉ thành công! TX: ${txHash}`);
            setShowRevokeModal(false);
            setRevokeTarget(null);

            // Reload data
            loadCertificates();
            loadStats(); // Revoke count changes
        } catch (err) {
            setError(err.message);
        } finally {
            setRevokeLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-neutral-cream">
                <header className="border-b-2 border-neutral-dark bg-white">
                    <div className="container mx-auto px-4 py-6">
                        <Link to="/" className="inline-flex items-center gap-2 text-neutral-dark hover:text-primary">
                            <ArrowLeft size={20} />
                            <span>Về Trang Chủ</span>
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-2xl">
                    <Card>
                        <div className="text-center py-8">
                            {error ? (
                                <>
                                    <h2 className="text-2xl font-bold text-red-600 mb-4">Truy Cập Bị Từ Chối</h2>
                                    <p className="text-neutral-gray mb-6">{error}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-neutral-dark mb-4">Trang Quản Trị</h2>
                                    <p className="text-neutral-gray mb-6">
                                        Vui lòng kết nối ví MetaMask để truy cập trang quản trị
                                    </p>
                                    <div className="flex justify-center">
                                        <MetaMaskConnect />
                                    </div>
                                    <p className="text-sm text-neutral-gray mt-4">
                                        Sau khi kết nối, trang sẽ tự động kiểm tra quyền admin của bạn
                                    </p>
                                </>
                            )}
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-cream">
            {/* Header */}
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/" className="inline-flex items-center gap-2 text-neutral-dark hover:text-primary">
                            <ArrowLeft size={20} />
                            <span>Về Trang Chủ</span>
                        </Link>
                        <MetaMaskConnect />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-dark">Bảng Điều Khiển Quản Trị</h1>
                    <p className="text-neutral-gray mt-2">Quản lý officers và chứng chỉ</p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 border-2 border-green-500 bg-green-50 text-green-700">
                        {success}
                    </div>
                )}

                {/* Statistics */}
                {statsLoading ? (
                    <div className="flex justify-center py-8 mb-8">
                        <Loader className="animate-spin text-neutral-gray" size={32} />
                    </div>
                ) : (
                    stats && (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <Card>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 border-2 border-primary">
                                        <FileText size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Tổng Số</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 border-2 border-green-500">
                                        <TrendingUp size={32} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Đã Cấp</p>
                                        <p className="text-2xl font-bold">{stats.issued}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 border-2 border-red-500">
                                        <Trash2 size={32} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-gray">Đã Thu Hồi</p>
                                        <p className="text-2xl font-bold">{stats.revoked}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                )}

                {/* Officer Management */}
                <Card className="mb-8">
                    <h3 className="font-bold text-neutral-dark mb-4">Quản Lý Officers</h3>
                    <div className="flex gap-4 mb-6">
                        <Button
                            onClick={() => {
                                setOfficerAction('add');
                                setOfficerAddress('');
                                setOfficerName('');
                                setShowOfficerModal(true);
                            }}
                        >
                            Thêm Officer
                        </Button>
                    </div>

                    {officersLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader className="animate-spin text-neutral-gray" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-neutral-dark">
                                        <th className="text-left py-3 px-2">STT</th>
                                        <th className="text-left py-3 px-2">Tên Officer</th>
                                        <th className="text-left py-3 px-2">Địa Chỉ Ví</th>
                                        <th className="text-left py-3 px-2">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officers.length > 0 ? (
                                        officers.filter(o => o.isActive).map((officer, index) => (
                                            <tr key={index} className="border-b border-neutral-gray/10 hover:bg-neutral-gray/5">
                                                <td className="py-2 px-2 text-sm text-neutral-dark">{index + 1}</td>
                                                <td className="py-2 px-2 text-sm font-semibold text-neutral-dark bg-neutral-100 rounded-md px-2 w-fit">{officer.name}</td>
                                                <td className="py-2 px-2 text-sm font-mono text-neutral-dark">{officer.address}</td>
                                                <td className="py-2 px-2 text-sm">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setOfficerAction('remove');
                                                            setOfficerAddress(officer.address);
                                                            setOfficerName(officer.name);
                                                            setShowOfficerModal(true);
                                                        }}
                                                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1"
                                                    >
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-4 text-center text-sm text-neutral-gray">
                                                Chưa có officer nào được thêm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Certificate List */}
                <Card>
                    <h3 className="font-bold text-neutral-dark mb-4">Danh Sách Chứng Chỉ</h3>
                    {certsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="animate-spin text-primary mb-4" size={48} />
                            <p className="text-neutral-gray">Đang tải danh sách chứng chỉ...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-neutral-dark">
                                            <th className="text-left py-3 px-2">Mã</th>
                                            <th className="text-left py-3 px-2">Sinh Viên</th>
                                            <th className="text-left py-3 px-2">Khóa Học</th>
                                            <th className="text-left py-3 px-2">Trạng Thái</th>
                                            <th className="text-left py-3 px-2">Ngày Cấp</th>
                                            <th className="text-left py-3 px-2">Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.length > 0 ? (
                                            certificates.map((cert) => (
                                                <tr key={cert.certId} className="border-b border-neutral-gray">
                                                    <td className="py-3 px-2 font-mono text-xs">
                                                        {cert.certificateId}
                                                    </td>
                                                    <td className="py-3 px-2">{cert.studentName}</td>
                                                    <td className="py-3 px-2">{cert.courseName}</td>
                                                    <td className="py-3 px-2">
                                                        <span
                                                            className={`px-2 py-1 text-xs border ${cert.status === 'ISSUED'
                                                                ? 'border-green-500 text-green-700 bg-green-50'
                                                                : cert.status === 'REVOKED'
                                                                    ? 'border-red-500 text-red-700 bg-red-50'
                                                                    : 'border-yellow-500 text-yellow-700 bg-yellow-50'
                                                                }`}
                                                        >
                                                            {cert.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-sm">
                                                        {new Date(cert.issuedAt * 1000).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-2 flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleViewDetails(cert)}
                                                            className="text-sm px-3 py-1"
                                                        >
                                                            Chi Tiết
                                                        </Button>
                                                        {cert.status === 'ISSUED' && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setRevokeTarget(cert);
                                                                    setShowRevokeModal(true);
                                                                }}
                                                                className="text-sm px-3 py-1 text-red-600 border-red-200 hover:bg-red-50"
                                                            >
                                                                Thu Hồi
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-sm text-neutral-gray">
                                                    Chưa có chứng chỉ nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const newPage = Math.max(1, page - 1);
                                            setPage(newPage);
                                            // We need to reload just certificates when page changes
                                            // Note: useEffect dependency on page would be better, but for now we manually trigger or add useEffect
                                        }}
                                        disabled={page === 1}
                                    >
                                        Trước
                                    </Button>
                                    <span className="text-neutral-dark">
                                        Trang {page} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const newPage = Math.min(totalPages, page + 1);
                                            setPage(newPage);
                                        }}
                                        disabled={page === totalPages}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </main>

            {/* Officer Modal */}
            <Modal
                isOpen={showOfficerModal}
                onClose={() => setShowOfficerModal(false)}
                title={officerAction === 'add' ? 'Thêm Officer' : 'Xóa Officer'}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowOfficerModal(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleOfficerAction} disabled={officerLoading} className={officerAction === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}>
                            {officerLoading ? 'Đang xử lý...' : officerAction === 'add' ? 'Thêm' : 'Xóa'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {officerAction === 'add' && (
                        <Input
                            label="Tên Officer"
                            value={officerName}
                            onChange={(e) => setOfficerName(e.target.value)}
                            placeholder="Nhập tên officer..."
                        />
                    )}
                    <Input
                        label="Địa Chỉ Officer"
                        value={officerAddress}
                        onChange={(e) => setOfficerAddress(e.target.value)}
                        placeholder="0x..."
                        disabled={officerAction === 'remove'}
                    />
                    {officerAction === 'remove' && (
                        <p className="text-red-600 text-sm">
                            Bạn có chắc chắn muốn xóa quyền officer của <strong>{officerName}</strong>?
                        </p>
                    )}
                </div>
            </Modal>

            {/* Revoke Modal */}
            <Modal
                isOpen={showRevokeModal}
                onClose={() => setShowRevokeModal(false)}
                title="Thu Hồi Chứng Chỉ"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleRevoke} disabled={revokeLoading}>
                            {revokeLoading ? 'Đang thu hồi...' : 'Thu Hồi'}
                        </Button>
                    </>
                }
            >
                {revokeTarget && (
                    <div className="space-y-4">
                        <p className="text-neutral-dark">
                            Bạn có chắc chắn muốn thu hồi chứng chỉ này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="border-t pt-4">
                            <p><strong>Mã chứng chỉ:</strong> {revokeTarget.certificateId}</p>
                            <p><strong>Sinh viên:</strong> {revokeTarget.studentName}</p>
                            <p><strong>Khóa học:</strong> {revokeTarget.courseName}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Chi Tiết Chứng Chỉ"
                footer={
                    <Button onClick={() => setShowViewModal(false)}>Đóng</Button>
                }
            >
                {viewTarget && (
                    <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Mã Chứng Chỉ:</span>
                            <span className="col-span-2">{viewTarget.certificateId}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Sinh Viên:</span>
                            <span className="col-span-2">{viewTarget.studentName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Khóa Học:</span>
                            <span className="col-span-2">{viewTarget.courseName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Kết Quả:</span>
                            <span className="col-span-2">{viewTarget.result}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Ngày Cấp:</span>
                            <span className="col-span-2">{new Date(viewTarget.issuedAt * 1000).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Trạng Thái:</span>
                            <span className={`col-span-2 font-bold ${viewTarget.status === 'ISSUED' ? 'text-green-600' : 'text-red-600'}`}>
                                {viewTarget.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2">
                            <span className="font-bold text-neutral-gray">Blockchain ID:</span>
                            <span className="col-span-2">{viewTarget.certId}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-b pb-2 items-center">
                            <span className="font-bold text-neutral-gray">Issuance Tx Hash:</span>
                            {viewDetailsLoading && !viewTarget.txHash ? (
                                <span className="col-span-2 flex items-center gap-2 text-neutral-gray italic">
                                    <Loader className="animate-spin" size={12} />
                                    Đang lấy từ Blockchain...
                                </span>
                            ) : (
                                <a href={`https://explorer.cronos.org/testnet/tx/${viewTarget.txHash}`} target="_blank" rel="noreferrer" className="col-span-2 text-blue-600 truncate hover:underline block">
                                    {viewTarget.txHash || "N/A"}
                                </a>
                            )}
                        </div>
                        {viewTarget.revokeTxHash && viewTarget.revokeTxHash !== '0x' && (
                            <div className="grid grid-cols-3 gap-2 border-b pb-2">
                                <span className="font-bold text-neutral-gray">Revoke Tx Hash:</span>
                                <a href={`https://explorer.cronos.org/testnet/tx/${viewTarget.revokeTxHash}`} target="_blank" rel="noreferrer" className="col-span-2 text-blue-600 truncate hover:underline">
                                    {viewTarget.revokeTxHash}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
