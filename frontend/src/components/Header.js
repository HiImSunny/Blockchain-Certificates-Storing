// frontend/src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Header = () => {
  const { account, isConnected, connectWallet, disconnectWallet, loading, organization } = useWallet();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600';
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">CertChain</h1>
              <p className="text-xs text-gray-500">Blockchain Certificate System</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`pb-2 transition-all duration-200 ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/verify" className={`pb-2 transition-all duration-200 ${isActive('/verify')}`}>
              Verify Certificate
            </Link>
            {isConnected && (
              <>
                <Link to="/upload" className={`pb-2 transition-all duration-200 ${isActive('/upload')}`}>
                  Upload Certificate
                </Link>
                <Link to="/dashboard" className={`pb-2 transition-all duration-200 ${isActive('/dashboard')}`}>
                  My Certificates
                </Link>
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">{organization?.name}</p>
                  <p className="text-xs text-gray-500">{formatAddress(account)}</p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex space-x-4 pb-3 overflow-x-auto">
          <Link to="/" className={`whitespace-nowrap pb-2 text-sm ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/verify" className={`whitespace-nowrap pb-2 text-sm ${isActive('/verify')}`}>
            Verify
          </Link>
          {isConnected && (
            <>
              <Link to="/upload" className={`whitespace-nowrap pb-2 text-sm ${isActive('/upload')}`}>
                Upload
              </Link>
              <Link to="/dashboard" className={`whitespace-nowrap pb-2 text-sm ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;