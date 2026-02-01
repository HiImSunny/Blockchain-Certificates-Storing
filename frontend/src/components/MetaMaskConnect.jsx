import React, { useState, useEffect } from 'react';
import { Wallet, Lock } from 'lucide-react';
import Button from './ui/Button';
import {
    connectMetaMask,
    isMetaMaskInstalled,
    getCurrentAccount,
    onAccountsChanged,
    onChainChanged,
} from '../utils/metamask';

const MetaMaskConnect = () => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if already connected
        const checkConnection = async () => {
            const currentAccount = await getCurrentAccount();
            if (currentAccount) {
                setAccount(currentAccount);
            }
        };

        checkConnection();

        // Listen for account changes
        onAccountsChanged((accounts) => {
            if (accounts.length === 0) {
                setAccount(null);
            } else {
                setAccount(accounts[0]);
            }
        });

        // Listen for chain changes
        onChainChanged(() => {
            window.location.reload();
        });
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);

        try {
            const { address } = await connectMetaMask();
            setAccount(address);
        } catch (err) {
            setError(err.message);
            console.error('Connection error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isMetaMaskInstalled()) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 bg-red-50">
                <Lock size={20} className="text-red-500" />
                <span className="text-sm text-red-700">
                    MetaMask not installed.{' '}
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                    >
                        Install here
                    </a>
                </span>
            </div>
        );
    }

    if (account) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-primary bg-white">
                <Wallet size={20} className="text-primary" />
                <span className="text-sm font-medium text-neutral-dark">
                    {account.slice(0, 6)}...{account.slice(-4)}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Button onClick={handleConnect} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
            {error && (
                <span className="text-sm text-red-500">{error}</span>
            )}
        </div>
    );
};

export default MetaMaskConnect;
