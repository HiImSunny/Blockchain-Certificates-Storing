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
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [account, setAccount] = useState(null);
    const [stats, setStats] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Officer management
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [officerAction, setOfficerAction] = useState('add'); // 'add' or 'remove'
    const [officerAddress, setOfficerAddress] = useState('');
    const [officerLoading, setOfficerLoading] = useState(false);

    // Revoke modal
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const currentAccount = await getCurrentAccount();
            if (!currentAccount) {
                setError('Please connect MetaMask first');
                setLoading(false);
                return;
            }

            setAccount(currentAccount);

            const adminCheck = await checkAdmin(currentAccount);
            if (!adminCheck.isAdmin) {
                setError('Access Denied: You are not an admin');
                setLoading(false);
                return;
            }

            setIsAdmin(true);
            await loadData();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, certsData] = await Promise.all([
                getStats(),
                listCertificates({ page, limit: 10 }),
            ]);

            setStats(statsData.stats);
            setCertificates(certsData.certificates);
            setTotalPages(certsData.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOfficerAction = async () => {
        if (!officerAddress.trim()) {
            setError('Please enter officer address');
            return;
        }

        setOfficerLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { signer } = await connectMetaMask();

            let txHash;
            if (officerAction === 'add') {
                txHash = await blockchainAddOfficer(signer, officerAddress);
                setSuccess(`Officer added successfully! TX: ${txHash}`);
            } else {
                txHash = await blockchainRemoveOfficer(signer, officerAddress);
                setSuccess(`Officer removed successfully! TX: ${txHash}`);
            }

            setShowOfficerModal(false);
            setOfficerAddress('');
        } catch (err) {
            setError(err.message);
        } finally {
            setOfficerLoading(false);
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
                revokeTarget.blockchainCertId
            );

            // Update database
            await apiRevokeCertificate(revokeTarget.certificateId, txHash);

            setSuccess(`Certificate revoked successfully! TX: ${txHash}`);
            setShowRevokeModal(false);
            setRevokeTarget(null);

            // Reload data
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setRevokeLoading(false);
        }
    };

    if (loading) {
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
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8">
                    <Card>
                        <div className="text-center py-8">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                            <p className="text-neutral-gray">{error || 'You do not have admin privileges'}</p>
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
                            <span>Back to Home</span>
                        </Link>
                        <MetaMaskConnect />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-dark">Admin Dashboard</h1>
                    <p className="text-neutral-gray mt-2">Manage officers and certificates</p>
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
                {stats && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <div className="flex items-center gap-4">
                                <div className="p-3 border-2 border-primary">
                                    <FileText size={32} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Total</p>
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
                                    <p className="text-sm text-neutral-gray">Issued</p>
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
                                    <p className="text-sm text-neutral-gray">Revoked</p>
                                    <p className="text-2xl font-bold">{stats.revoked}</p>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center gap-4">
                                <div className="p-3 border-2 border-yellow-500">
                                    <Loader size={32} className="text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-gray">Pending</p>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Officer Management */}
                <Card className="mb-8">
                    <h3 className="font-bold text-neutral-dark mb-4">Officer Management</h3>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                setOfficerAction('add');
                                setShowOfficerModal(true);
                            }}
                        >
                            Add Officer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOfficerAction('remove');
                                setShowOfficerModal(true);
                            }}
                        >
                            Remove Officer
                        </Button>
                    </div>
                </Card>

                {/* Certificate List */}
                <Card>
                    <h3 className="font-bold text-neutral-dark mb-4">Certificates</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-neutral-dark">
                                    <th className="text-left py-3 px-2">ID</th>
                                    <th className="text-left py-3 px-2">Student</th>
                                    <th className="text-left py-3 px-2">Course</th>
                                    <th className="text-left py-3 px-2">Status</th>
                                    <th className="text-left py-3 px-2">Issued</th>
                                    <th className="text-left py-3 px-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certificates.map((cert) => (
                                    <tr key={cert._id} className="border-b border-neutral-gray">
                                        <td className="py-3 px-2 font-mono text-xs">
                                            {cert.certificateId.slice(0, 20)}...
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
                                            {new Date(cert.issuedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-2">
                                            {cert.status === 'ISSUED' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setRevokeTarget(cert);
                                                        setShowRevokeModal(true);
                                                    }}
                                                    className="text-sm px-3 py-1"
                                                >
                                                    Revoke
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
                                Previous
                            </Button>
                            <span className="text-neutral-dark">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </Card>
            </main>

            {/* Officer Modal */}
            <Modal
                isOpen={showOfficerModal}
                onClose={() => setShowOfficerModal(false)}
                title={officerAction === 'add' ? 'Add Officer' : 'Remove Officer'}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowOfficerModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleOfficerAction} disabled={officerLoading}>
                            {officerLoading ? 'Processing...' : officerAction === 'add' ? 'Add' : 'Remove'}
                        </Button>
                    </>
                }
            >
                <Input
                    label="Officer Address"
                    value={officerAddress}
                    onChange={(e) => setOfficerAddress(e.target.value)}
                    placeholder="0x..."
                />
            </Modal>

            {/* Revoke Modal */}
            <Modal
                isOpen={showRevokeModal}
                onClose={() => setShowRevokeModal(false)}
                title="Revoke Certificate"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRevoke} disabled={revokeLoading}>
                            {revokeLoading ? 'Revoking...' : 'Revoke'}
                        </Button>
                    </>
                }
            >
                {revokeTarget && (
                    <div className="space-y-4">
                        <p className="text-neutral-dark">
                            Are you sure you want to revoke this certificate? This action cannot be undone.
                        </p>
                        <div className="border-t pt-4">
                            <p><strong>Certificate ID:</strong> {revokeTarget.certificateId}</p>
                            <p><strong>Student:</strong> {revokeTarget.studentName}</p>
                            <p><strong>Course:</strong> {revokeTarget.courseName}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
