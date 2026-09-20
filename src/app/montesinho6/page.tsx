"use client";

import * as React from "react";
import { MonitoringDateSlider } from "@/components/MonitoringDateSlider";

type WaterLevelRow = {
  timestamp: string;
  level: number | null;
};

type ApiResponse =
  | {
      ok: true;
      data: WaterLevelRow[];
    }
  | {
      ok: false;
      error: string;
    };

const PLAYBACK_INTERVAL_MS = 25;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

export default function TimelinePreviewPage() {
  const [selectedStartDate, setSelectedStartDate] =
    React.useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] =
    React.useState<Date | null>(null);

  const [waterLevels, setWaterLevels] = React.useState<WaterLevelRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackIndex, setPlaybackIndex] = React.useState(0);

  const handleSelectedRangeChange = React.useCallback(
    (fromDate: Date, toDate: Date) => {
      setSelectedStartDate(fromDate);
      setSelectedEndDate(toDate);
    },
    []
  );

  React.useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsPlaying(false);
        setPlaybackIndex(0);

        const params = new URLSearchParams({
          start: selectedStartDate.toISOString(),
          stop: addOneDay(selectedEndDate).toISOString(),
          limit: "5000",
        });

        const response = await fetch(
          `/api/baells-water-level?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        const json = (await response.json()) as ApiResponse;

        if (!response.ok || !json.ok) {
          throw new Error(
            json.ok === false ? json.error : "Failed to load water levels"
          );
        }

        setWaterLevels(json.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Unknown error");
        setWaterLevels([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedStartDate, selectedEndDate]);

  React.useEffect(() => {
    if (!isPlaying || waterLevels.length === 0) return;

    const intervalId = window.setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev + 1;

        if (next >= waterLevels.length) {
          setIsPlaying(false);
          return waterLevels.length - 1;
        }

        return next;
      });
    }, PLAYBACK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, waterLevels.length]);

  const stats = React.useMemo(() => {
    const validLevels = waterLevels
      .map((row) => row.level)
      .filter((value): value is number => typeof value === "number");

    if (validLevels.length === 0) return null;

    return {
      count: validLevels.length,
      min: Math.min(...validLevels),
      max: Math.max(...validLevels),
      latest: validLevels[validLevels.length - 1],
    };
  }, [waterLevels]);

  const currentPlaybackRow = waterLevels[playbackIndex] ?? null;

  const playbackProgress =
    waterLevels.length <= 1
      ? 0
      : (playbackIndex / (waterLevels.length - 1)) * 100;

  function handlePlayPause() {
    if (waterLevels.length === 0 || isLoading) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (playbackIndex >= waterLevels.length - 1) {
      setPlaybackIndex(0);
    }

    setIsPlaying(true);
  }

  function handleResetPlayback() {
    setIsPlaying(false);
    setPlaybackIndex(0);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0,_#020617_48%,_#000_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-44 text-center">
        <h1 className="text-3xl font-bold">Water Level Query Preview</h1>

        <p className="mt-3 max-w-xl text-sm text-white/70">
          Drag the two slider handles to choose a date range. The page queries
          your Baells water level API route using that selected range.
        </p>

        <div className="mt-8 grid w-full max-w-4xl gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Selected range
            </div>

            <div className="mt-2 text-lg font-semibold">
              {selectedStartDate && selectedEndDate
                ? `${formatDate(selectedStartDate)} → ${formatDate(
                    selectedEndDate
                  )}`
                : "Move the slider"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Records loaded
            </div>

            <div className="mt-2 text-3xl font-semibold">
              {isLoading ? "Loading..." : waterLevels.length}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Latest level
            </div>

            <div className="mt-2 text-3xl font-semibold">
              {stats ? stats.latest.toFixed(3) : "-"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Min level
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {stats ? stats.min.toFixed(3) : "-"}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Max level
            </div>

            <div className="mt-2 text-2xl font-semibold">
              {stats ? stats.max.toFixed(3) : "-"}
            </div>
          </div>
        </div>

        <div className="mt-4 w-full max-w-4xl rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <div className="text-xs uppercase tracking-wide text-white/60">
                Timelapse playback value
              </div>

              <div className="mt-2 text-4xl font-bold">
                {currentPlaybackRow &&
                typeof currentPlaybackRow.level === "number"
                  ? currentPlaybackRow.level.toFixed(3)
                  : "-"}
              </div>

              <div className="mt-1 text-sm text-white/60">
                {currentPlaybackRow
                  ? formatDateTime(currentPlaybackRow.timestamp)
                  : "No playback row selected"}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={waterLevels.length === 0 || isLoading}
                className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                type="button"
                onClick={handleResetPlayback}
                disabled={waterLevels.length === 0 || isLoading}
                className="rounded-lg border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>
                Row {waterLevels.length > 0 ? playbackIndex + 1 : 0} of{" "}
                {waterLevels.length}
              </span>

              <span>{Math.round(playbackProgress)}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 max-w-4xl rounded-xl border border-red-400/30 bg-red-500/20 px-5 py-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mt-6 w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold">
            Water level rows
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-black/80 text-white/70">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">
                    Timestamp
                  </th>
                  <th className="px-4 py-2 text-right font-medium">Level</th>
                </tr>
              </thead>

              <tbody>
                {waterLevels.slice(0, 30).map((row, index) => (
                  <tr
                    key={row.timestamp}
                    className={`border-t border-white/5 text-white/85 ${
                      index === playbackIndex
                        ? "bg-white/15"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-2">
                      {formatDateTime(row.timestamp)}
                    </td>

                    <td className="px-4 py-2 text-right">
                      {typeof row.level === "number"
                        ? row.level.toFixed(3)
                        : "-"}
                    </td>
                  </tr>
                ))}

                {!isLoading && waterLevels.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-white/50"
                    >
                      No rows found for this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {waterLevels.length > 30 && (
            <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
              Showing first 30 of {waterLevels.length} rows.
            </div>
          )}
        </div>
      </div>

      <MonitoringDateSlider
        onSelectedRangeChange={handleSelectedRangeChange}
      />
    </main>
  );
}