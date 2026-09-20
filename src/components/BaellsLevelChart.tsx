"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = {
  timestamp: string;
  level: number;
};

export default function BaellsLevelChart() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/baells-water-level?limit=500")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  const chartData = data.map((row) => ({
    ...row,
    label: new Date(row.timestamp).toLocaleDateString(),
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={30} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload;
              return row?.timestamp
                ? new Date(row.timestamp).toLocaleString()
                : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}