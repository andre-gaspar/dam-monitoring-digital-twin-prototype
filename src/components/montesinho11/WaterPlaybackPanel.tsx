"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WaterLevelRow } from "./types";
import { formatPanelDate, formatPanelDateTime } from "./utils";
import {
  montesinhoCopy,
  type MontesinhoLanguage,
} from "./i18n";

type WaterPlaybackPanelProps = {
  isVisible: boolean;
  mobileMode?: boolean;
  raiseAboveOverlays?: boolean;
  language: MontesinhoLanguage;
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
  mobileMode = false,
  raiseAboveOverlays = false,
  language,
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
  const copy = montesinhoCopy[language];

  return (
    <Card
      data-mobile-water-playback={mobileMode ? "" : undefined}
      data-overlay-focus-scope={raiseAboveOverlays ? "" : undefined}
      className={cn(
        "absolute gap-0 rounded-xl border-black/10 bg-white/95 text-black shadow-2xl backdrop-blur-md transition-all duration-300 ease-out",
        raiseAboveOverlays ? "z-[75]" : "z-10",
        mobileMode
          ? "w-auto overflow-y-auto overscroll-contain p-3 py-3"
          : "right-5 top-1/2 w-80 p-3.5 py-3.5",
        isVisible
          ? mobileMode
            ? "translate-y-0 opacity-100"
            : "-translate-y-1/2 opacity-100"
          : mobileMode
            ? "pointer-events-none -translate-y-3 opacity-0"
            : "pointer-events-none -translate-y-[55%] opacity-0"
      )}
      style={{
        fontFamily: "system-ui, sans-serif",
        top: mobileMode
          ? "calc(env(safe-area-inset-top, 0px) + 72px)"
          : undefined,
        left: mobileMode
          ? "calc(env(safe-area-inset-left, 0px) + 12px)"
          : undefined,
        right: mobileMode
          ? "calc(env(safe-area-inset-right, 0px) + 12px)"
          : undefined,
        maxWidth: mobileMode ? 340 : undefined,
        maxHeight: mobileMode
          ? "max(96px, calc(50dvh - env(safe-area-inset-top, 0px) - 84px))"
          : undefined,
        marginLeft: mobileMode ? "auto" : undefined,
        marginRight: mobileMode ? "auto" : undefined,
      }}
      aria-hidden={!isVisible}
      inert={!isVisible ? true : undefined}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            {copy.playback.title}
          </div>
          <div style={{ fontSize: 11, opacity: 0.68, marginTop: 2 }}>
            {selectedStartDate && selectedEndDate
              ? `${formatPanelDate(selectedStartDate, language)} → ${formatPanelDate(
                  selectedEndDate,
                  language
                )}`
              : copy.playback.selectRange}
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
          {isWaterLoading
            ? copy.playback.loading
            : `${waterLevels.length} ${copy.rows.toLowerCase()}`}
        </div>
      </div>

      <div
        style={{
          marginBottom: 12,
          borderRadius: 10,
          background: "rgba(0,0,0,0.055)",
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 10, opacity: 0.58, fontWeight: 700 }}>
          {copy.playback.currentReadTime}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>
          {currentPlaybackRow
            ? formatPanelDateTime(currentPlaybackRow.timestamp, language)
            : waterError
            ? waterError
            : copy.playback.noRowSelected}
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
            {copy.playback.row} {waterLevels.length > 0 ? playbackIndex + 1 : 0}{" "}
            {copy.playback.of}{" "}
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
          className={cn(
            "flex-1 bg-black font-extrabold text-white hover:bg-black/90",
            mobileMode && "h-11"
          )}
        >
          {isPlaying ? copy.playback.pause : copy.playback.play}
        </Button>

        <Button
          type="button"
          onClick={onResetPlayback}
          disabled={disabled}
          variant="outline"
          className={cn(
            "flex-1 border-black/10 bg-white font-extrabold text-black hover:bg-neutral-100",
            mobileMode && "h-11"
          )}
        >
          {copy.playback.reset}
        </Button>
      </div>
    </Card>
  );
}
