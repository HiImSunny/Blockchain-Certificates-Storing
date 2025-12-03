import React from "react";
import PublicSearch from "./pages/PublicSearch";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Certificates — Viewer & Admin</h1>
          <p className="text-sm text-gray-600">Public can search by code. Admin signs with MetaMask to upload/delete.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-4 rounded shadow">
            <PublicSearch />
          </section>

          <section className="bg-white p-4 rounded shadow">
            <AdminPanel />
          </section>
        </main>

        <footer className="mt-6 text-xs text-gray-500">Designed for coursework — backend stores files on IPFS via Web3.Storage.</footer>
      </div>
    </div>
  );
}
