import { useEffect, useState } from "react";

interface BlockchainStatus {
  success: boolean;
  blockNumber: number;
}

function App() {
  const [block, setBlock] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/blockchain/status")
      .then((res) => res.json() as Promise<BlockchainStatus>)
      .then((data) => {
        setBlock(data.blockNumber);
      })
      .catch((err) => {
        console.error("Failed to fetch blockchain status:", err);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Private Blockchain Status</h2>
      <p>
        Current block: {block !== null ? block : "Loading..."}
      </p>
    </div>
  );
}

export default App;
