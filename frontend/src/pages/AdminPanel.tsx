import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import BentoCard from "../components/BentoCard";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function AdminPanel() {
  const [account, setAccount] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [messageLog, setMessageLog] = useState<string[] | null>([]);

  const log = (t: string) => setMessageLog((s) => (s ? [t, ...s] : [t]));

  const connect = async () => {
    if (!window.ethereum) return alert("Cài MetaMask đã nhé");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);
  };

  const fingerprint = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

  const handleUpload = async () => {
    if (!account) return alert("Connect MetaMask");
    if (!file) return alert("Chọn file");
    if (!title.trim()) return alert("Nhập tiêu đề");

    setUploading(true);
    try {
      const ts = Date.now();
      const fp = fingerprint(file);
      const message = `Upload cert:${account}|${fp}|${title}|${ts}`;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("walletAddress", account);
      fd.append("message", message);
      fd.append("signature", signature);
      fd.append("timestamp", ts.toString());

      const res = await axios.post(`${API_BASE}/api/admin/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      log(`Uploaded: code=${res.data.code} cid=${res.data.cid}`);
      alert("Upload thành công. Mã: " + res.data.code);
      setTitle("");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert("Upload lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // delete by code
  const handleDelete = async () => {
    if (!account) return alert("Connect MetaMask");
    if (!deleteCode.trim()) return alert("Nhập mã cần xóa");
    try {
      const ts = Date.now();
      const message = `Delete cert:${deleteCode}|${account}|${ts}`;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const res = await axios.delete(`${API_BASE}/api/admin/${deleteCode.trim().toUpperCase()}`, {
        data: { walletAddress: account, message, signature }
      });
      log(`Deleted: ${deleteCode}`);
      alert("Deleted: " + deleteCode);
      setDeleteCode("");
    } catch (err: any) {
      console.error(err);
      alert("Delete lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <BentoCard title="Admin panel" subtitle="Chỉ admin ký bằng MetaMask mới upload / delete">
        {!account ? (
          <button onClick={connect} className="px-4 py-2 bg-indigo-600 text-white rounded">Connect MetaMask</button>
        ) : (
          <div className="mb-3">
            <div className="text-sm text-green-700">Admin: <span className="font-mono">{account}</span></div>
          </div>
        )}

        <div className="mt-3">
          <label className="block mb-1 text-sm">File chứng chỉ</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="mt-3">
          <label className="block mb-1 text-sm">Tiêu đề</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div className="mt-3 flex gap-2">
          <button disabled={!account || !file || uploading} onClick={handleUpload} className="px-4 py-2 bg-emerald-600 text-white rounded">Upload</button>
          <button onClick={() => { setTitle(""); setFile(null); }} className="px-4 py-2 border rounded">Reset</button>
        </div>

        <hr className="my-3" />

        <div>
          <label className="block mb-1 text-sm">Xóa theo mã</label>
          <div className="flex gap-2">
            <input value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} placeholder="Mã chứng chỉ..." className="flex-1 border p-2 rounded" />
            <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">Xóa</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500">Logs</div>
          <div className="mt-2 text-sm">
            {messageLog && messageLog.length > 0 ? messageLog.map((m, i) => <div key={i} className="text-xs text-gray-700 border-b py-1">{m}</div>) : <div className="text-sm text-gray-400">Chưa có hoạt động</div>}
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
