import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Shield, Upload, Settings } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { getCurrentAccount } from '../utils/metamask';
import { checkAdmin } from '../utils/api';

const Home = () => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const account = await getCurrentAccount();
                if (account) {
                    const result = await checkAdmin(account);
                    setIsAdmin(result.isAdmin);
                }
            } catch (error) {
                console.error('Check admin error:', error);
            }
        };

        checkAdminStatus();
    }, []);

    return (
        <div className="min-h-screen bg-neutral-cream">
            {/* Header */}
            <header className="border-b-2 border-neutral-dark bg-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-dark">
                                Digital Certificate Storing by DNC
                            </h1>
                            <p className="text-neutral-gray mt-2">
                                Blockchain-powered certificate verification on Cronos
                            </p>
                        </div>
                        {isAdmin && (
                            <Link to="/admin">
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Settings size={20} />
                                    Admin Dashboard
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold text-neutral-dark mb-4">
                        Secure, Transparent, Immutable
                    </h2>
                    <p className="text-lg text-neutral-gray">
                        Issue and verify educational certificates on the blockchain.
                        Prevent fraud, ensure authenticity, and maintain trust.
                    </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                    <Card>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 border-2 border-primary">
                                <Upload size={48} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-dark">
                                Issue Certificates
                            </h3>
                            <p className="text-neutral-gray">
                                Upload existing certificates or create new ones with our
                                template. AI-powered data extraction makes it easy.
                            </p>
                            <Link to="/issue" className="mt-4">
                                <Button>Issue Certificate</Button>
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 border-2 border-primary">
                                <Shield size={48} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-dark">
                                Verify Certificates
                            </h3>
                            <p className="text-neutral-gray">
                                Instantly verify any certificate by ID or by uploading the
                                file. Blockchain ensures tamper-proof verification.
                            </p>
                            <Link to="/verify" className="mt-4">
                                <Button>Verify Certificate</Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* How It Works */}
                <Card className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-neutral-dark mb-6 text-center">
                        How It Works
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">Upload or Create</h4>
                            <p className="text-sm text-neutral-gray">
                                Upload an existing certificate or fill in the form to generate
                                a new one
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">
                                Sign with MetaMask
                            </h4>
                            <p className="text-sm text-neutral-gray">
                                Connect your wallet and sign the transaction to store the
                                certificate hash on blockchain
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-primary bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h4 className="font-bold text-neutral-dark mb-2">
                                Verify Anytime
                            </h4>
                            <p className="text-sm text-neutral-gray">
                                Anyone can verify the certificate's authenticity using the
                                certificate ID or file
                            </p>
                        </div>
                    </div>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-neutral-dark bg-white mt-16">
                <div className="container mx-auto px-4 py-6 text-center text-neutral-gray">
                    <p>© 2026 Digital Certificate Storing by DNC. Powered by Cronos Blockchain.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
