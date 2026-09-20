"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WaterLevelRow } from "./types";
import { formatPanelDate, formatPanelDateTime } from "./utils";

type WaterPlaybackPanelProps = {
  isVisible: boolean;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  isWaterLoading: boolean;
  waterLevels: WaterLevelRow[];
  currentPlaybackRow: WaterLevelRow | null;
  waterError: string | null;
  playbackIndex: number;
  playbackProgress: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onResetPlayback: () => void;
};

export function WaterPlaybackPanel({
  isVisible,
  selectedStartDate,
  selectedEndDate,
  isWaterLoading,
  waterLevels,
  currentPlaybackRow,
  waterError,
  playbackIndex,
  playbackProgress,
  isPlaying,
  onPlayPause,
  onResetPlayback,
}: WaterPlaybackPanelProps) {
  const disabled = waterLevels.length === 0 || isWaterLoading;

  return (
    <Card
      className={cn(
        "absolute inset-x-3 z-10 gap-0 rounded-xl border-black/10 bg-white/95 p-3 py-3 text-black shadow-2xl backdrop-blur-md transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-3 opacity-0"
      )}
      style={{
        fontFamily: "system-ui, sans-serif",
        top: "calc(env(safe-area-inset-top, 0px) + 116px)",
        maxWidth: 340,
        marginLeft: "auto",
        marginRight: "auto",
      }}
      aria-hidden={!isVisible}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
              marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            Water level timelapse
          </div>
          <div style={{ fontSize: 11, opacity: 0.68, marginTop: 2 }}>
            {selectedStartDate && selectedEndDate
              ? `${formatPanelDate(selectedStartDate)} → ${formatPanelDate(
                  selectedEndDate
                )}`
              : "Select a range"}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 999,
            background: "black",
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          {isWaterLoading ? "Loading" : `${waterLevels.length} rows`}
        </div>
      </div>

      <div
        style={{
          marginBottom: 10,
          borderRadius: 10,
          background: "rgba(0,0,0,0.055)",
            padding: "9px 10px",
        }}
      >
        <div style={{ fontSize: 10, opacity: 0.58, fontWeight: 700 }}>
          Current sensor read time
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>
          {currentPlaybackRow
            ? formatPanelDateTime(currentPlaybackRow.timestamp)
            : waterError
            ? waterError
            : "No playback row selected"}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            opacity: 0.72,
            marginBottom: 6,
          }}
        >
          <span>
            Row {waterLevels.length > 0 ? playbackIndex + 1 : 0} of{" "}
            {waterLevels.length}
          </span>
          <span>{Math.round(playbackProgress)}%</span>
        </div>

        <div
          style={{
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${playbackProgress}%`,
              borderRadius: 999,
              background: "black",
              transition: "width 120ms linear",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button
          type="button"
          onClick={onPlayPause}
          disabled={disabled}
          className="flex-1 bg-black font-extrabold text-white hover:bg-black/90"
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          type="button"
          onClick={onResetPlayback}
          disabled={disabled}
          variant="outline"
          className="flex-1 border-black/10 bg-white font-extrabold text-black hover:bg-neutral-100"
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}
