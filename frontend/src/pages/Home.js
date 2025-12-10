// frontend/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { certificateAPI } from '../services/api';
import { useWallet } from '../contexts/WalletContext';

const Home = () => {
  const { isConnected } = useWallet();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await certificateAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Secure Certificate Verification
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Powered by Blockchain
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Upload, verify, and manage educational certificates with the security and transparency of blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/verify" className="btn-primary text-lg">
              Verify Certificate
            </Link>
            {isConnected ? (
              <Link to="/upload" className="btn-secondary text-lg">
                Upload Certificate
              </Link>
            ) : (
              <Link to="/verify" className="btn-secondary text-lg">
                Learn More
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {!loading && stats && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {stats.database?.totalCertificates || 0}
              </h3>
              <p className="text-gray-600">Total Certificates</p>
            </div>

            <div className="card text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {stats.blockchain?.totalBlocks || 0}
              </h3>
              <p className="text-gray-600">Blockchain Blocks</p>
            </div>

            <div className="card text-center transform hover:scale-105 transition-all duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {stats.blockchain?.isValid ? 'Valid' : 'Invalid'}
              </h3>
              <p className="text-gray-600">Blockchain Status</p>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Why Choose CertChain?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Secure & Immutable</h3>
            <p className="text-gray-600 leading-relaxed">
              Certificates are stored on private blockchain, ensuring they cannot be altered or forged once issued.
            </p>
          </div>

          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Instant Verification</h3>
            <p className="text-gray-600 leading-relaxed">
              Verify the authenticity of any certificate in seconds by simply entering the certificate ID.
            </p>
          </div>

          <div className="card hover:shadow-2xl transition-all duration-300">
            <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Trusted by Institutions</h3>
            <p className="text-gray-600 leading-relaxed">
              Only authorized training organizations can issue certificates, ensuring credibility and trust.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="card max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            {isConnected 
              ? 'Upload your first certificate and experience the power of blockchain.'
              : 'Connect your wallet to start issuing blockchain-verified certificates.'
            }
          </p>
          {isConnected ? (
            <Link to="/upload" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-block shadow-lg hover:shadow-xl">
              Upload Certificate Now
            </Link>
          ) : (
            <Link to="/verify" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-block shadow-lg hover:shadow-xl">
              Verify a Certificate
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;