// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';

// Components
import Header from './components/Header';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UploadCertificate from './pages/UploadCertificate';
import VerifyCertificate from './pages/VerifyCertificate';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadCertificate />} />
              <Route path="/verify" element={<VerifyCertificate />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; 2024 CertChain. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;