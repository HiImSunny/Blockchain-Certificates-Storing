import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader, Trash2 } from 'lucide-react';
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
    listCertificates,
    revokeCertificate as apiRevokeCertificate,
    verifyCertificateById,
} from '../utils/api';
import {
    connectMetaMask,
    issueCertificate,
    getCurrentAccount,
    revokeCertificate as blockchainRevokeCertificate,
} from '../utils/metamask';

const IssueCertificate = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('issue'); // 'issue' or 'history'
    const [mode, setMode] = useState('upload'); // 'upload' or 'manual'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [account, setAccount] = useState(null);

    // Upload mode state
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadData, setUploadData] = useState(null);

    // Manual mode state
    const [formData, setFormData] = useState({
        studentName: '',
        studentId: '',
        courseName: '',
        courseCode: '',
        trainingType: 'Trực tuyến',
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

    // History state
    const [certificates, setCertificates] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'ISSUED', 'REVOKED'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [certsLoading, setCertsLoading] = useState(false);

    // Revoke modal
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [viewDetailsLoading, setViewDetailsLoading] = useState(false);

    // Track initial load
    const isFirstLoad = React.useRef(true);

    useEffect(() => {
        checkAccount();
    }, []);

    useEffect(() => {
        // Only load if in history tab AND account exists
        if (activeTab === 'history' && account) {
            loadCertificates();
        }
    }, [activeTab, account, page, statusFilter]);

    const checkAccount = async () => {
        const currentAccount = await getCurrentAccount();
        setAccount(currentAccount);
    };

    const loadCertificates = async () => {
        if (!account) return;

        try {
            setCertsLoading(true); // Use specific loading state
            const query = {
                page,
                limit: 10,
                issuerAddress: account.toLowerCase(), // Normalize to lowercase
            };

            if (statusFilter !== 'all') {
                query.status = statusFilter;
            }

            const result = await listCertificates(query);
            setCertificates(result.certificates);
            setTotalPages(result.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setCertsLoading(false);
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

            // Dictionary of data to match struct IssueData
            const issueData = {
                certHash: uploadData.certHash,
                certificateIdString: uploadData.certificateId,
                studentName: formData.studentName,
                courseName: formData.courseName,
                courseCode: formData.courseCode || "",
                trainingType: formData.trainingType || "",
                duration: formData.duration || "",
                result: formData.result || "",
                issuerName: formData.issuerName,
                issuerWebsite: formData.issuerWebsite || "",
                issuerContact: formData.issuerContact || "",
                fileUrl: uploadData.fileUrl,
                fileType: uploadData.fileType || "application/pdf"
            };

            // Issue certificate on blockchain
            const { txHash, certId } = await issueCertificate(
                signer,
                issueData
            );

            // Confirm with backend
            await confirmCertificate({
                certificateId: uploadData.certificateId,
                certHash: uploadData.certHash,
                txHash,
                issuerAddress: address.toLowerCase(), // Normalize to lowercase
                blockchainCertId: certId,
                fileUrl: uploadData.fileUrl,
                cloudinaryPublicId: uploadData.cloudinaryPublicId,
                fileType: uploadData.fileType,
                ...formData,
            });

            setSuccess(`Phát hành chứng chỉ thành công! Mã: ${uploadData.certificateId}`);
            setShowPreview(false);

            // Reset form
            setUploadData(null);
            setUploadedFile(null);
            setFormData({
                studentName: '',
                studentId: '',
                courseName: '',
                courseCode: '',
                trainingType: 'Trực tuyến',
                duration: '',
                result: '',
                issuedAt: new Date().toISOString().split('T')[0],
                issuerName: '',
                issuerWebsite: '',
                issuerContact: '',
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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

            // Reload certificates
            await loadCertificates();
        } catch (err) {
            setError(err.message);
        } finally {
            setRevokeLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-neutral-dark">Phát Hành Chứng Chỉ</h1>
                    <p className="text-neutral-gray mt-2">
                        {activeTab === 'issue' ? 'Tạo và phát hành chứng chỉ mới' : 'Quản lý chứng chỉ đã phát hành'}
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Tab Navigation */}
                <Card className="mb-8">
                    <div className="flex gap-4">
                        <Button
                            variant={activeTab === 'issue' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('issue')}
                            className="flex-1"
                        >
                            Phát Hành Mới
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('history')}
                            className="flex-1"
                        >
                            Chứng Chỉ Của Tôi
                        </Button>
                    </div>
                </Card>

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

                {/* Issue Tab */}
                {activeTab === 'issue' && (
                    <>
                        {/* Mode Selection */}
                        <Card className="mb-8">
                            <h3 className="font-bold text-neutral-dark mb-4">Chọn Phương Thức Nhập</h3>
                            <div className="flex gap-4">
                                <Button
                                    variant={mode === 'upload' ? 'primary' : 'outline'}
                                    onClick={() => setMode('upload')}
                                >
                                    Tải File Lên
                                </Button>
                                <Button
                                    variant={mode === 'manual' ? 'primary' : 'outline'}
                                    onClick={() => setMode('manual')}
                                >
                                    Nhập Thủ Công
                                </Button>
                            </div>
                        </Card>

                        {/* Upload Mode */}
                        {mode === 'upload' && (
                            <Card>
                                <h3 className="font-bold text-neutral-dark mb-4">Tải Lên Chứng Chỉ</h3>
                                <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
                                {loading && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Loader className="animate-spin" />
                                        <span>Đang xử lý file...</span>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Form (shown for both modes after upload or for manual) */}
                        {((mode === 'upload' && uploadData) || mode === 'manual') && (
                            <Card className="mt-8">
                                <h3 className="font-bold text-neutral-dark mb-4">Thông Tin Chứng Chỉ</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        label="Tên Sinh Viên"
                                        value={formData.studentName}
                                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Mã Sinh Viên"
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    />
                                    <Input
                                        label="Tên Khóa Học"
                                        value={formData.courseName}
                                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Mã Khóa Học"
                                        value={formData.courseCode}
                                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                                    />
                                    <div>
                                        <label className="text-sm font-medium text-neutral-dark block mb-1">
                                            Hình Thức Đào Tạo
                                        </label>
                                        <select
                                            value={formData.trainingType}
                                            onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                                            className="w-full px-4 py-2 border-2 border-neutral-dark bg-white"
                                        >
                                            <option value="Trực tuyến">Trực tuyến</option>
                                            <option value="Trực tiếp">Trực tiếp</option>
                                            <option value="Kết hợp">Kết hợp</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Thời Lượng"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="VD: 3 tháng, 120 giờ"
                                    />
                                    <Input
                                        label="Kết Quả"
                                        value={formData.result}
                                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                        placeholder="VD: Đạt, Xuất sắc, 8.5/10"
                                    />
                                    <Input
                                        label="Ngày Cấp"
                                        type="date"
                                        value={formData.issuedAt}
                                        onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Tên Đơn Vị Cấp"
                                        value={formData.issuerName}
                                        onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Website Đơn Vị"
                                        value={formData.issuerWebsite}
                                        onChange={(e) => setFormData({ ...formData, issuerWebsite: e.target.value })}
                                    />
                                    <Input
                                        label="Liên Hệ Đơn Vị"
                                        value={formData.issuerContact}
                                        onChange={(e) => setFormData({ ...formData, issuerContact: e.target.value })}
                                        placeholder="Email hoặc số điện thoại"
                                    />
                                </div>

                                <div className="flex gap-4 mt-6">
                                    {mode === 'manual' && (
                                        <Button onClick={handleManualCreate} disabled={loading}>
                                            {loading ? 'Đang tạo PDF...' : 'Tạo PDF Xem Trước'}
                                        </Button>
                                    )}
                                    {mode === 'upload' && uploadData && (
                                        <Button onClick={() => { setShowPreview(true); setPreviewData(uploadData); }}>
                                            Xem Trước & Phát Hành
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        )}
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <>
                        {!account ? (
                            <Card>
                                <div className="text-center py-8">
                                    <h3 className="text-xl font-bold text-neutral-dark mb-4">
                                        Kết Nối Ví Để Xem Lịch Sử
                                    </h3>
                                    <p className="text-neutral-gray mb-6">
                                        Vui lòng kết nối ví MetaMask để xem chứng chỉ bạn đã phát hành
                                    </p>
                                    <div className="flex justify-center">
                                        <MetaMaskConnect />
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <>
                                {/* Filter */}
                                <Card className="mb-6">
                                    <h3 className="font-bold text-neutral-dark mb-4">Lọc Theo Trạng Thái</h3>
                                    <div className="flex gap-4">
                                        <Button
                                            variant={statusFilter === 'all' ? 'primary' : 'outline'}
                                            onClick={() => { setStatusFilter('all'); setPage(1); }}
                                        >
                                            Tất Cả
                                        </Button>
                                        <Button
                                            variant={statusFilter === 'ISSUED' ? 'primary' : 'outline'}
                                            onClick={() => { setStatusFilter('ISSUED'); setPage(1); }}
                                        >
                                            Đã Cấp
                                        </Button>
                                        <Button
                                            variant={statusFilter === 'REVOKED' ? 'primary' : 'outline'}
                                            onClick={() => { setStatusFilter('REVOKED'); setPage(1); }}
                                        >
                                            Đã Thu Hồi
                                        </Button>
                                    </div>
                                </Card>

                                {/* Certificate List */}
                                <Card>
                                    <h3 className="font-bold text-neutral-dark mb-4">Danh Sách Chứng Chỉ</h3>
                                    {certsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader className="animate-spin text-primary mb-4" size={48} />
                                            <p className="text-neutral-gray">Đang tải danh sách...</p>
                                        </div>
                                    ) : certificates.length === 0 ? (
                                        <div className="text-center py-8 text-neutral-gray">
                                            Chưa có chứng chỉ nào
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
                                                        {certificates.map((cert) => (
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
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-center gap-4 mt-6">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                        disabled={page === 1}
                                                    >
                                                        Trước
                                                    </Button>
                                                    <span className="text-neutral-dark">
                                                        Trang {page} / {totalPages}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                        disabled={page === totalPages}
                                                    >
                                                        Sau
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Card>
                            </>
                        )}
                    </>
                )}
            </main>

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
                        {viewTarget.revokeTxHash && viewTarget.revokeTxHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
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

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Xem Trước Chứng Chỉ"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleIssueToBlockchain} disabled={loading}>
                            {loading ? 'Đang phát hành...' : 'Phát Hành Lên Blockchain'}
                        </Button>
                    </>
                }
            >
                {previewData && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-neutral-gray">Mã Chứng Chỉ</p>
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
                                Xem Chứng Chỉ
                            </a>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-sm text-neutral-gray mb-2">Thông Tin Sinh Viên</p>
                            <p><strong>Tên:</strong> {formData.studentName}</p>
                            <p><strong>Khóa học:</strong> {formData.courseName}</p>
                            <p><strong>Đơn vị cấp:</strong> {formData.issuerName}</p>
                        </div>
                    </div>
                )}
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
        </div>
    );
};

export default IssueCertificate;
