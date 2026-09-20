"use client";

import { useState } from "react";

type Row = {
  time: string;
  inclinometer: string;
  node: number;
  ax: number | null;
  ay: number | null;
  az: number | null;
};

export default function Page() {
  const [inclinometer, setInclinometer] = useState("I1");
  const [node, setNode] = useState(0);
  const [start, setStart] = useState("2025-04-01T09:00:00Z");
  const [stop, setStop] = useState("2025-04-01T09:10:00Z");
  const [limit, setLimit] = useState(200);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runQuery() {
    setLoading(true);
    setErr(null);

    try {
      const url =
        `/api/ipi?inclinometer=${encodeURIComponent(inclinometer)}` +
        `&node=${encodeURIComponent(String(node))}` +
        `&start=${encodeURIComponent(start)}` +
        `&stop=${encodeURIComponent(stop)}` +
        `&limit=${encodeURIComponent(String(limit))}`;

      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);

      const json = JSON.parse(text);
      if (!json.ok) throw new Error(json.error?.message ?? "Query failed");

      setRows(json.data);
    } catch (e: any) {
      setErr(e.message ?? "Unknown error");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>IPI Time Range Query</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Inclinometer
          <input
            value={inclinometer}
            onChange={(e) => setInclinometer(e.target.value)}
            style={{ display: "block", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Node
          <input
            type="number"
            value={node}
            onChange={(e) => setNode(Number(e.target.value))}
            style={{ display: "block", padding: 8, marginTop: 4, width: 100 }}
          />
        </label>

        <label>
          Start (ISO)
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ display: "block", padding: 8, marginTop: 4, width: 280 }}
          />
        </label>

        <label>
          Stop (ISO)
          <input
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            style={{ display: "block", padding: 8, marginTop: 4, width: 280 }}
          />
        </label>

        <label>
          Limit
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ display: "block", padding: 8, marginTop: 4, width: 120 }}
          />
        </label>
      </div>

      <button
        onClick={runQuery}
        disabled={loading}
        style={{
          padding: "10px 14px",
          border: "1px solid #888",
          borderRadius: 8,
          background: "#fff",
          color: "#000",
          cursor: "pointer",
        }}
      >
        {loading ? "Querying..." : "Run time-range query"}
      </button>

      {err && <p style={{ color: "tomato", marginTop: 12 }}>{err}</p>}

      {rows && (
        <div style={{ marginTop: 16 }}>
          <p>Returned: {rows.length} rows</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {["time", "ax", "ay", "az"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.inclinometer}-${r.node}-${r.time}`}>
                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.time}</td>
                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.ax ?? ""}</td>
                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.ay ?? ""}</td>
                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.az ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details style={{ marginTop: 12 }}>
            <summary>Raw JSON</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(rows, null, 2)}</pre>
          </details>
        </div>
      )}
    </main>
  );
}
