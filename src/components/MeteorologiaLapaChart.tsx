"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SERIES_OPTIONS = [
  { id: "Precipitacao_horaria_mm", label: "Hourly precipitation (mm)" },
  { id: "Direcao_do_vento_horaria", label: "Hourly wind direction" },
  { id: "Velocidade_do_vento_horaria_m_s", label: "Hourly wind speed (m/s)" },
  {
    id: "Velocidade_do_vento_maxima_horaria_m_s",
    label: "Maximum hourly wind speed (m/s)",
  },
  {
    id: "Velocidade_do_vento_media_diaria_m_s",
    label: "Daily average wind speed (m/s)",
  },
  { id: "Precipitacao_diaria_mm", label: "Daily precipitation (mm)" },
  { id: "Precipitacao_mensal_mm", label: "Monthly precipitation (mm)" },
  { id: "Precipitacao_anual_mm", label: "Annual precipitation (mm)" },
  {
    id: "Precipitacao_diaria_maxima_anual_mm",
    label: "Annual maximum daily precipitation (mm)",
  },
];

type Point = {
  timestamp: string;
  value: number | null;
};

type MeteorologiaLapaChartProps = {
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  timelineValues?: [number, number] | null;
};

const METEOROLOGIA_LAPA_START_MS = Date.UTC(2015, 9, 1, 0, 0, 0);
const METEOROLOGIA_LAPA_END_MS = Date.UTC(2021, 8, 14, 7, 0, 0);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatRangeDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function mapTimelineValueToMeteorologiaDate(value: number) {
  const t = clamp(value, 0, 100) / 100;
  const time =
    METEOROLOGIA_LAPA_START_MS +
    (METEOROLOGIA_LAPA_END_MS - METEOROLOGIA_LAPA_START_MS) * t;

  return new Date(time);
}

function downsamplePoints(points: Point[], maxPoints = 1600) {
  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0);
}

export default function MeteorologiaLapaChart({
  selectedStartDate = null,
  selectedEndDate = null,
  timelineValues = null,
}: MeteorologiaLapaChartProps) {
  const [series, setSeries] = useState("Precipitacao_horaria_mm");
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mappedMeteorologiaRange = useMemo(() => {
    if (!timelineValues) return null;

    const [startValue, endValue] =
      timelineValues[0] <= timelineValues[1]
        ? timelineValues
        : [timelineValues[1], timelineValues[0]];

    const start = mapTimelineValueToMeteorologiaDate(startValue);
    const end = mapTimelineValueToMeteorologiaDate(endValue);
    const stop = new Date(end.getTime() + 60 * 60 * 1000);

    if (stop.getTime() <= start.getTime()) {
      stop.setUTCHours(stop.getUTCHours() + 1);
    }

    return { start, end, stop, startValue, endValue };
  }, [timelineValues]);

  const rangeLabel = useMemo(() => {
    if (mappedMeteorologiaRange) {
      return `${formatRangeDate(mappedMeteorologiaRange.start)} → ${formatRangeDate(
        mappedMeteorologiaRange.end
      )} (${Math.round(mappedMeteorologiaRange.startValue)}% → ${Math.round(
        mappedMeteorologiaRange.endValue
      )}%)`;
    }

    if (!selectedStartDate || !selectedEndDate) return "Latest 500 records";

    return `${formatRangeDate(selectedStartDate)} → ${formatRangeDate(
      selectedEndDate
    )}`;
  }, [mappedMeteorologiaRange, selectedStartDate, selectedEndDate]);

  const chartData = useMemo(() => downsamplePoints(data), [data]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          series,
          limit: mappedMeteorologiaRange ? "50000" : "500",
        });

        if (mappedMeteorologiaRange) {
          params.set("start", mappedMeteorologiaRange.start.toISOString());
          params.set("stop", mappedMeteorologiaRange.stop.toISOString());
        }

        const res = await fetch(`/api/meteorologia_lapa?${params.toString()}`, {
          signal: controller.signal,
        });

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
  }, [series, mappedMeteorologiaRange]);

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <label className="mr-2 font-medium">Meteorology series:</label>
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="rounded border px-3 py-2"
          >
            {SERIES_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
          Meteorology range: {rangeLabel}
        </div>
      </div>

      {loading && <div className="shrink-0">Loading...</div>}
      {error && <div className="shrink-0 text-red-600">{error}</div>}
      {!loading && !error && data.length > chartData.length && (
        <div className="mb-2 shrink-0 text-xs text-neutral-500">
          Showing {chartData.length} sampled points from {data.length} rows.
        </div>
      )}

      {!loading && !error && (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                    year: "2-digit",
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
