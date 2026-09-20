"use client";

import * as THREE from "three";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

import {
  METEOROLOGIA_SERIES_OPTIONS,
} from "@/components/MeteorologiaLapa3DChart";
import { VRMontesinhoWorld } from "@/components/vrtest9/VRMontesinhoWorld";
import { CameraSetup, WebXRSetup } from "@/components/vrtest9/VRBasics";
import {
  DraggableMeteorologiaChart,
  ModePanel,
  VRDashboardPanel,
  type DashboardButtonRefs,
} from "@/components/vrtest9/VRPanels";
import {
  HandInputSystem,
  type DraggableTarget,
  type InteractionMode,
  type VRButtonTarget,
} from "@/components/vrtest9/VRInteractionSystem";
import {
  CHART_INITIAL_POSITION,
  CHART_INITIAL_SCALE,
  DASHBOARD_INITIAL_POSITION,
  DASHBOARD_INITIAL_SCALE,
  TIMELINE_END_DATE,
  TIMELINE_START_DATE,
  USER_EYE_HEIGHT,
} from "@/components/vrtest9/constants";
import { PLAYBACK_INTERVAL_MS } from "@/components/montesinho8/constants";
import type {
  ApiResponse,
  MonitoringSensorItem,
  WaterLevelRow,
  WaterStats,
} from "@/components/montesinho8/types";
import {
  addOneDay,
  formatPanelDateTime,
  mapWaterLevelToSceneY,
} from "@/components/montesinho8/utils";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function timelineValueToDate(value: number) {
  const start = TIMELINE_START_DATE.getTime();
  const end = TIMELINE_END_DATE.getTime();
  const t = clamp(value, 0, 100) / 100;

  return new Date(start + (end - start) * t);
}

function sortTimelineRange(values: [number, number]): [number, number] {
  const start = clamp(values[0], 0, 100);
  const end = clamp(values[1], 0, 100);

  return start <= end ? [start, end] : [end, start];
}

const TELEPORT_DISTANCE = 8;

function TeleportRequestHandler({
  requestId,
  onTeleport,
}: {
  requestId: number;
  onTeleport: (direction: THREE.Vector3) => void;
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (requestId === 0) return;

    const xrCamera = gl.xr.isPresenting ? gl.xr.getCamera() : camera;
    const direction = new THREE.Vector3();

    xrCamera.getWorldDirection(direction);
    direction.y = 0;

    if (direction.lengthSq() < 0.0001) {
      direction.set(0, 0, -1);
    } else {
      direction.normalize();
    }

    onTeleport(direction);
  }, [camera, gl, onTeleport, requestId]);

  return null;
}

export default function Page() {
  const [mode, setMode] = useState<InteractionMode>("ray-drag");
  const [rainIntensity, setRainIntensity] = useState(0.65);
  const [timelineValues, setTimelineValues] = useState<[number, number]>([
    0, 100,
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [waterLevels, setWaterLevels] = useState<WaterLevelRow[]>([]);
  const [isWaterLoading, setIsWaterLoading] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [focusedSensor, setFocusedSensor] =
    useState<MonitoringSensorItem | null>(null);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [teleportRequestId, setTeleportRequestId] = useState(0);
  const [worldTravelOffset, setWorldTravelOffset] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [isMechanicsPanelLocked, setIsMechanicsPanelLocked] = useState(false);

  const dashboardRef = useRef<THREE.Group | null>(null);
  const dashboardColliderRef = useRef<THREE.Mesh | null>(null);
  const chartRef = useRef<THREE.Group | null>(null);
  const chartColliderRef = useRef<THREE.Mesh | null>(null);

  const rayButtonRef = useRef<THREE.Mesh | null>(null);
  const grabButtonRef = useRef<THREE.Mesh | null>(null);
  const resetUiButtonRef = useRef<THREE.Mesh | null>(null);
  const teleportButtonRef = useRef<THREE.Mesh | null>(null);
  const lockMechanicsButtonRef = useRef<THREE.Mesh | null>(null);

  const dashboardButtonRefs: DashboardButtonRefs = {
    rainDown: useRef<THREE.Mesh | null>(null),
    rainUp: useRef<THREE.Mesh | null>(null),
    rangeLeft: useRef<THREE.Mesh | null>(null),
    rangeRight: useRef<THREE.Mesh | null>(null),
    rangeNarrow: useRef<THREE.Mesh | null>(null),
    rangeWide: useRef<THREE.Mesh | null>(null),
    playPause: useRef<THREE.Mesh | null>(null),
    resetPlayback: useRef<THREE.Mesh | null>(null),
    previousSeries: useRef<THREE.Mesh | null>(null),
    nextSeries: useRef<THREE.Mesh | null>(null),
  };

  const selectedStartDate = useMemo(
    () => timelineValueToDate(timelineValues[0]),
    [timelineValues]
  );

  const selectedEndDate = useMemo(
    () => timelineValueToDate(timelineValues[1]),
    [timelineValues]
  );

  const selectedSeries = METEOROLOGIA_SERIES_OPTIONS[seriesIndex];

  useEffect(() => {
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
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setWaterError(error instanceof Error ? error.message : "Unknown error");
        setWaterLevels([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
      } finally {
        setIsWaterLoading(false);
      }
    }, 250);

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

    return () => window.clearInterval(intervalId);
  }, [isPlaying, waterLevels.length]);

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

  const dynamicWaterLevelY = useMemo(
    () => mapWaterLevelToSceneY(currentPlaybackRow?.level, waterStats),
    [currentPlaybackRow, waterStats]
  );

  function updateTimelineRange(updater: (range: [number, number]) => [number, number]) {
    setTimelineValues((current) => sortTimelineRange(updater(current)));
  }

  function shiftTimeline(delta: number) {
    updateTimelineRange(([start, end]) => {
      const width = end - start;
      const nextStart = clamp(start + delta, 0, 100 - width);

      return [nextStart, nextStart + width];
    });
  }

  function zoomTimeline(factor: number) {
    updateTimelineRange(([start, end]) => {
      const center = (start + end) / 2;
      const nextWidth = clamp((end - start) * factor, 3, 100);

      return [
        clamp(center - nextWidth / 2, 0, 100),
        clamp(center + nextWidth / 2, 0, 100),
      ];
    });
  }

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

  function previousSeries() {
    setSeriesIndex((current) =>
      current === 0 ? METEOROLOGIA_SERIES_OPTIONS.length - 1 : current - 1
    );
  }

  function nextSeries() {
    setSeriesIndex((current) =>
      current === METEOROLOGIA_SERIES_OPTIONS.length - 1 ? 0 : current + 1
    );
  }

  const handleTeleport = useCallback((direction: THREE.Vector3) => {
    setWorldTravelOffset((current) => [
      current[0] - direction.x * TELEPORT_DISTANCE,
      current[1],
      current[2] - direction.z * TELEPORT_DISTANCE,
    ]);
  }, []);

  const buttons: VRButtonTarget[] = [
    { id: "mode-ray", ref: rayButtonRef, mode: "ray-drag" },
    { id: "mode-grab", ref: grabButtonRef, mode: "grab-scale" },
    {
      id: "reset-ui",
      ref: resetUiButtonRef,
      action: "reset-draggables",
    },
    {
      id: "teleport-forward",
      ref: teleportButtonRef,
      onPress: () => setTeleportRequestId((value) => value + 1),
    },
    {
      id: "lock-mechanics-panel",
      ref: lockMechanicsButtonRef,
      onPress: () => setIsMechanicsPanelLocked((value) => !value),
    },
    {
      id: "rain-down",
      ref: dashboardButtonRefs.rainDown,
      onPress: () => setRainIntensity((value) => clamp(value - 0.1, 0, 1)),
    },
    {
      id: "rain-up",
      ref: dashboardButtonRefs.rainUp,
      onPress: () => setRainIntensity((value) => clamp(value + 0.1, 0, 1)),
    },
    {
      id: "range-left",
      ref: dashboardButtonRefs.rangeLeft,
      onPress: () => shiftTimeline(-8),
    },
    {
      id: "range-right",
      ref: dashboardButtonRefs.rangeRight,
      onPress: () => shiftTimeline(8),
    },
    {
      id: "range-narrow",
      ref: dashboardButtonRefs.rangeNarrow,
      onPress: () => zoomTimeline(0.68),
    },
    {
      id: "range-wide",
      ref: dashboardButtonRefs.rangeWide,
      onPress: () => zoomTimeline(1.45),
    },
    {
      id: "play-pause",
      ref: dashboardButtonRefs.playPause,
      onPress: handlePlayPause,
    },
    {
      id: "reset-playback",
      ref: dashboardButtonRefs.resetPlayback,
      onPress: handleResetPlayback,
    },
    {
      id: "previous-series",
      ref: dashboardButtonRefs.previousSeries,
      onPress: previousSeries,
    },
    {
      id: "next-series",
      ref: dashboardButtonRefs.nextSeries,
      onPress: nextSeries,
    },
  ];

  const draggableTargets: DraggableTarget[] = [
    {
      id: "dashboard",
      ref: dashboardRef,
      colliderRef: dashboardColliderRef,
      initialPosition: DASHBOARD_INITIAL_POSITION,
      initialScale: DASHBOARD_INITIAL_SCALE,
    },
    {
      id: "meteorologia-chart",
      ref: chartRef,
      colliderRef: chartColliderRef,
      initialPosition: CHART_INITIAL_POSITION,
      initialScale: CHART_INITIAL_SCALE,
    },
  ];

  const currentWaterTime = currentPlaybackRow
    ? formatPanelDateTime(currentPlaybackRow.timestamp)
    : waterError
    ? waterError
    : isWaterLoading
    ? "Loading water levels..."
    : "No water row selected";

  const currentWaterLevel =
    typeof currentPlaybackRow?.level === "number"
      ? currentPlaybackRow.level.toFixed(3)
      : "-";

  return (
    <main
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        overflow: "hidden",
        background: "black",
      }}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{
          position: [0, USER_EYE_HEIGHT, 0],
          fov: 70,
          near: 0.05,
          far: 2000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000");
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <WebXRSetup />
        <CameraSetup />
        <TeleportRequestHandler
          requestId={teleportRequestId}
          onTeleport={handleTeleport}
        />

        <Suspense fallback={null}>
          <Environment background="only" files="/skyy.hdr" />
        </Suspense>

        <Suspense fallback={null}>
          <VRMontesinhoWorld
            rainIntensity={rainIntensity}
            waterLevelY={dynamicWaterLevelY}
            focusedSensor={focusedSensor}
            travelOffset={worldTravelOffset}
            onSensorFocus={setFocusedSensor}
          />
        </Suspense>

        <Suspense fallback={null}>
          <HandInputSystem
            mode={mode}
            onModeChange={setMode}
            draggableTargets={draggableTargets}
            buttons={buttons}
          />

          <VRDashboardPanel
            panelRef={dashboardRef}
            colliderRef={dashboardColliderRef}
            buttonRefs={dashboardButtonRefs}
            rainIntensity={rainIntensity}
            timelineValues={timelineValues}
            waterRowsCount={waterLevels.length}
            playbackProgress={playbackProgress}
            currentWaterTime={currentWaterTime}
            currentWaterLevel={currentWaterLevel}
            isPlaying={isPlaying}
            selectedSeriesLabel={selectedSeries.label}
          />

          <DraggableMeteorologiaChart
            chartRef={chartRef}
            chartColliderRef={chartColliderRef}
            seriesId={selectedSeries.id}
            selectedLabel={selectedSeries.label}
          />

          <ModePanel
            mode={mode}
            isLocked={isMechanicsPanelLocked}
            rayButtonRef={rayButtonRef}
            grabButtonRef={grabButtonRef}
            resetButtonRef={resetUiButtonRef}
            teleportButtonRef={teleportButtonRef}
            lockButtonRef={lockMechanicsButtonRef}
          />
        </Suspense>
      </Canvas>
    </main>
  );
}
