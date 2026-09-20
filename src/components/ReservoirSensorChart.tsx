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

const SENSOR_OPTIONS = [
  { id: "082687-001-ANA015", label: "Baells level" },
  { id: "080581-002-ANA006", label: "Foix level" },
  { id: "081419-003-ANA005", label: "Llosa del Cavall level" },
  { id: "083036-001-ANA023", label: "083036-001-ANA023" },
  { id: "170600-001-ANA021", label: "170600-001-ANA021" },
  { id: "171899-003-ANA007", label: "171899-003-ANA007" },
  { id: "250753-004-ANA010", label: "250753-004-ANA010" },
  { id: "430430-001-ANA002", label: "430430-001-ANA002" },
  { id: "430496-001-ANA001", label: "430496-001-ANA001" },
  { id: "430537-001-ANA006", label: "430537-001-ANA006" },
  { id: "CALC000004", label: "CALC000004" },
  { id: "CALC000005", label: "CALC000005" },
  { id: "CALC000041", label: "CALC000041" },
  { id: "CALC000046", label: "CALC000046" },
  { id: "CALC000092", label: "CALC000092" },
  { id: "CALC000103", label: "CALC000103" },
  { id: "CALC000108", label: "CALC000108" },
  { id: "CALC000120", label: "CALC000120" },
  { id: "CALC000123", label: "CALC000123" },
  { id: "CALC000125", label: "CALC000125" },
  { id: "CALC000126", label: "CALC000126" },
  { id: "CALC000143", label: "CALC000143" },
  { id: "CALC000145", label: "CALC000145" },
  { id: "CALC000152", label: "CALC000152" },
  { id: "CALC000713", label: "CALC000713" },
  { id: "CALC000722", label: "CALC000722" },
  { id: "CALC000735", label: "CALC000735" },
  { id: "CALC000698", label: "CALC000698" },
  { id: "CALC000697", label: "CALC000697" },
  { id: "CALC000699", label: "CALC000699" },
  { id: "171169-001-ANA009", label: "171169-001-ANA009" },
  { id: "CALC000168", label: "CALC000168" },
  { id: "CALC000158", label: "CALC000158" },
];

type Point = {
  timestamp: string;
  value: number | null;
};

export default function ReservoirSensorChart() {
  const [sensor, setSensor] = useState("082687-001-ANA015");
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/reservoir-series?sensor=${encodeURIComponent(sensor)}&limit=1000`,
          { signal: controller.signal }
        );

        const json = await res.json();

        if (!json.ok) {
          setData([]);
          setError(json.error ?? "Failed to load series");
          return;
        }

        setData(json.data ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setData([]);
          setError("Failed to load series");
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [sensor]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mr-2 font-medium">Reservoir series:</label>
        <select
          value={sensor}
          onChange={(e) => setSensor(e.target.value)}
          className="rounded border px-3 py-2"
        >
          {SENSOR_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                minTickGap={30}
                tickFormatter={(value) =>
                  new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "UTC",
                  }).format(new Date(value))
                }
              />
              <YAxis domain={["auto", "auto"]} width={80} />
              <Tooltip
                labelFormatter={(value) =>
                  new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "UTC",
                  }).format(new Date(value))
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}