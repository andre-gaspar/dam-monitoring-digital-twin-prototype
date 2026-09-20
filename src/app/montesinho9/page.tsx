"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

import { ResizableDemo } from "@/components/Spliter3";
import { initialSensors } from "@/components/montesinho9/initialSensors";
import { MontesinhoScene } from "@/components/montesinho9/Scene";
import { OverlayModal } from "@/components/montesinho9/OverlayModal";
import { RainControlPanel } from "@/components/montesinho9/RainControlPanel";
import { SensorSidebar } from "@/components/montesinho9/SensorSidebar";
import { TimelineDock } from "@/components/montesinho9/TimelineDock";
import { WaterPlaybackPanel } from "@/components/montesinho9/WaterPlaybackPanel";
import {
  PLAYBACK_INTERVAL_MS,
} from "@/components/montesinho9/constants";
import type {
  ApiResponse,
  MonitoringSensorItem,
  WaterLevelRow,
  WaterStats,
} from "@/components/montesinho9/types";
import {
  addOneDay,
  mapWaterLevelToSceneY,
} from "@/components/montesinho9/utils";

export default function Page() {
  const controlsRef = useRef<any>(null);

  const [showCountup] = useState(false);
  const [showTwoTiles, setShowTwoTiles] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(0.65);
  const [isRainPanelOpen, setIsRainPanelOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isSensorSidebarOpen, setIsSensorSidebarOpen] = useState(true);
  const [isSlipterOpen, setIsSlipterOpen] = useState(false);
  const [focusedSensor, setFocusedSensor] =
    useState<MonitoringSensorItem | null>(null);

  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [timelineValues, setTimelineValues] = useState<[number, number]>([
    0, 100,
  ]);

  const [waterLevels, setWaterLevels] = useState<WaterLevelRow[]>([]);
  const [isWaterLoading, setIsWaterLoading] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const sensors = initialSensors;

  const handleSelectedRangeChange = React.useCallback(
    (
      fromDate: Date,
      toDate: Date,
      nextTimelineValues: [number, number]
    ) => {
      setSelectedStartDate(fromDate);
      setSelectedEndDate(toDate);
      setTimelineValues(nextTimelineValues);
    },
    []
  );

  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsWaterLoading(true);
        setWaterError(null);
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

        setWaterError(err instanceof Error ? err.message : "Unknown error");
        setWaterLevels([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
      } finally {
        setIsWaterLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedStartDate, selectedEndDate]);

  useEffect(() => {
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

  useEffect(() => {
    if (!isTimelineOpen) {
      setIsPlaying(false);
    }
  }, [isTimelineOpen]);

  const waterStats = useMemo<WaterStats | null>(() => {
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

  const dynamicWaterLevelY = useMemo(() => {
    return mapWaterLevelToSceneY(currentPlaybackRow?.level, waterStats);
  }, [currentPlaybackRow, waterStats]);

  function handlePlayPause() {
    if (waterLevels.length === 0 || isWaterLoading) return;

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
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <RainControlPanel
        rainIntensity={rainIntensity}
        isOpen={isRainPanelOpen}
        onRainIntensityChange={setRainIntensity}
        onOpenChange={setIsRainPanelOpen}
        showTwoTiles={showTwoTiles}
        onToggleTwoTiles={() => setShowTwoTiles((value) => !value)}
      />

      <WaterPlaybackPanel
        isVisible={isTimelineOpen}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        isWaterLoading={isWaterLoading}
        waterLevels={waterLevels}
        currentPlaybackRow={currentPlaybackRow}
        waterError={waterError}
        playbackIndex={playbackIndex}
        playbackProgress={playbackProgress}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onResetPlayback={handleResetPlayback}
      />

      <SensorSidebar
        sensors={sensors}
        isOpen={isSensorSidebarOpen}
        isTimelineOpen={isTimelineOpen}
        onOpenChange={setIsSensorSidebarOpen}
        onSelectSensor={setFocusedSensor}
      />

      <Canvas
        shadows={false}
        dpr={1}
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 80, 140], fov: 55, near: 1, far: 100000 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <Environment background="only" files="/skyy.hdr" />

        <Suspense fallback={null}>
          <MontesinhoScene
            showTwoTiles={showTwoTiles}
            showCountup={showCountup}
            onCubeClick={() => setIsSlipterOpen(true)}
            focusedSensor={focusedSensor}
            controlsRef={controlsRef}
            sensors={sensors}
            rainIntensity={rainIntensity}
            waterLevelY={dynamicWaterLevelY}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[70, -2, -70]}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      <TimelineDock
        isOpen={isTimelineOpen}
        onOpenChange={setIsTimelineOpen}
        onSelectedRangeChange={handleSelectedRangeChange}
      />

      {isSlipterOpen && (
        <OverlayModal
          width="min(1200px, 95vw)"
          height="min(90vh, 900px)"
          zIndex={40}
          onClose={() => setIsSlipterOpen(false)}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              padding: "24px",
            }}
          >
            <ResizableDemo
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              timelineValues={timelineValues}
            />
          </div>
        </OverlayModal>
      )}
    </div>
  );
}
