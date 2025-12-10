// frontend/src/contexts/WalletContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { organizationAPI } from '../services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('Please install MetaMask to use this feature!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];

      setAccount(walletAddress);
      setIsConnected(true);

      // Check whitelist and login
      const response = await organizationAPI.login(walletAddress);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setOrganization(response.data.organization);
        setIsWhitelisted(true);
        return { success: true, organization: response.data.organization };
      }
    } catch (error) {
      console.error('Connect wallet error:', error);
      if (error.response?.status === 403) {
        setIsWhitelisted(false);
        alert('Your wallet is not authorized. Please contact the administrator.');
      }
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsWhitelisted(false);
    setOrganization(null);
    localStorage.removeItem('token');
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        
        if (accounts.length > 0 && localStorage.getItem('token')) {
          setAccount(accounts[0]);
          setIsConnected(true);
          
          // Get organization data
          try {
            const response = await organizationAPI.getProfile();
            setOrganization(response.data.organization);
            setIsWhitelisted(true);
          } catch (error) {
            console.error('Get profile error:', error);
            disconnectWallet();
          }
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          disconnectWallet();
          window.location.reload();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (isMetaMaskInstalled()) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [account]);

  const value = {
    account,
    isConnected,
    isWhitelisted,
    loading,
    organization,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};