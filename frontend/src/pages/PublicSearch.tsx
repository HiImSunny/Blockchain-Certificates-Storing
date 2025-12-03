import React, { useState } from "react";
import axios from "axios";
import BentoCard from "../components/BentoCard";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function PublicSearch() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/certificates/code/${code.trim().toUpperCase()}`);
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.response?.data?.message || "Không tìm thấy" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <BentoCard title="Tìm chứng chỉ" subtitle="Nhập mã chứng chỉ (ví dụ: A1B2C3D4)">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Mã chứng chỉ..."
            className="flex-1 border rounded p-2"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!code || loading}>
            {loading ? "Đang tìm..." : "Tìm"}
          </button>
        </div>

        <div className="mt-4">
          {result ? (
            result.error ? (
              <div className="text-sm text-red-600">{result.error}</div>
            ) : (
              <div className="bento-grid">
                <div className="col-span-1">
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="font-semibold">{result.title}</div>
                    <div className="text-xs text-gray-500 mb-2">Code: {result.code}</div>
                    <div className="text-sm text-gray-700">Uploaded: {new Date(result.timestamp).toLocaleString()}</div>
                    <a className="mt-3 inline-block text-blue-600 underline" href={`https://ipfs.io/ipfs/${result.cid}`} target="_blank">Mở file</a>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-sm text-gray-500">Nhập mã và bấm Tìm để xem chứng chỉ</div>
          )}
        </div>
      </BentoCard>
    </div>
  );
}
