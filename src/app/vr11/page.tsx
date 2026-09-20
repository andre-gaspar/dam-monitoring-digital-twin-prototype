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

import { CameraSetup } from "@/components/vrtest9/VRBasics";
import {
  HandInputSystem,
  type DraggableTarget,
  type HorizontalSliderTarget,
  type InteractionMode,
  type VRButtonTarget,
} from "@/components/vrtest9/VRInteractionSystem";
import { ModePanel } from "@/components/vrtest9/VRPanels";
import { VRMontesinhoWorld } from "@/components/vr11/VRMontesinhoWorld";
import {
  NUMERICAL_SLIDER_MAX_X,
  NUMERICAL_SLIDER_MIN_X,
  VRNumericalAnimationSlider,
} from "@/components/vr11/VRNumericalAnimationSlider";
import { VR11XRSetup, type XRLaunchMode } from "@/components/vr11/VRXRSetup";
import {
  VRDatasetDashboardPanel,
  VRMenuPanel,
  VRMiniatureModelPanel,
  VR_MENU_DASHBOARD_KEYS,
  type DashboardKey,
  type MenuDashboardKey,
  type OpenDashboard,
  type VRMenuButtonRefs,
  type VRMiniatureModelButtonRefs,
} from "@/components/vr11/VRPanels";
import {
  DEFAULT_MINIATURE_MODEL,
  DASHBOARD_INITIAL_SCALE,
  DASHBOARD_SLOTS,
  MENU_INITIAL_POSITION,
  MENU_INITIAL_SCALE,
  MINIATURE_INITIAL_POSITION,
  MINIATURE_MODEL_OPTIONS,
  NUMERICAL_ANIMATION_LAST_FRAME,
  TIMELINE_END_DATE,
  TIMELINE_START_DATE,
  USER_EYE_HEIGHT,
  type MiniatureModelKey,
} from "@/components/vr11/constants";
import { PLAYBACK_INTERVAL_MS } from "@/components/montesinho11/constants";
import { initialSensors } from "@/components/montesinho11/initialSensors";
import type {
  MonitoringSensorItem,
  WaterLevelRow,
  WaterStats,
} from "@/components/montesinho11/types";
import {
  addOneDay,
  formatPanelDateTime,
  mapWaterLevelToSceneY,
} from "@/components/montesinho11/utils";

const MENU_COUNT = 4;
const TELEPORT_DISTANCE = 8;
const MAX_OPEN_DASHBOARDS = 3;
const AR_CONTENT_Y_OFFSET = -USER_EYE_HEIGHT;

type ReservoirApiResponse = {
  ok: boolean;
  data?: Record<string, string>[];
  nextOffset?: number | null;
  error?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sortTimelineRange(values: [number, number]): [number, number] {
  const start = clamp(values[0], 0, 100);
  const end = clamp(values[1], 0, 100);
  return start <= end ? [start, end] : [end, start];
}

function timelineValueToDate(value: number) {
  const start = TIMELINE_START_DATE.getTime();
  const end = TIMELINE_END_DATE.getTime();
  const t = clamp(value, 0, 100) / 100;
  return new Date(start + (end - start) * t);
}

function formatApiDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function sensorDashboardKey(sensor: MonitoringSensorItem): DashboardKey {
  if (sensor.title.startsWith("PZ")) return "piezometerHistory";
  if (sensor.title.startsWith("IV") || sensor.title.startsWith("II")) {
    return "inclinometerHistory";
  }
  if (sensor.type === "flow_meter") return "seepage";
  return "reservoir";
}

function withYOffset(
  position: [number, number, number],
  yOffset: number
): [number, number, number] {
  return [position[0], position[1] + yOffset, position[2]];
}

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

function VR11LaunchScreen({
  onSelect,
}: {
  onSelect: (mode: XRLaunchMode) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "white",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 48%, #111827 100%)",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          display: "grid",
          gap: 22,
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 0,
              color: "#93c5fd",
              marginBottom: 10,
            }}
          >
            VR11
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            Choose Your Session
          </h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={() => onSelect("vr")}
            style={{
              minHeight: 132,
              border: "1px solid rgba(147, 197, 253, 0.45)",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.92)",
              color: "white",
              padding: 18,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ display: "block", fontSize: 24, fontWeight: 700 }}>
              VR Sky
            </span>
            <span
              style={{
                display: "block",
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.45,
                color: "#cbd5e1",
              }}
            >
              Full virtual scene with the sky background.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("ar")}
            style={{
              minHeight: 132,
              border: "1px solid rgba(45, 212, 191, 0.45)",
              borderRadius: 8,
              background: "rgba(6, 78, 59, 0.42)",
              color: "white",
              padding: 18,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ display: "block", fontSize: 24, fontWeight: 700 }}>
              AR Passthrough
            </span>
            <span
              style={{
                display: "block",
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.45,
                color: "#ccfbf1",
              }}
            >
              Real surroundings with the same VR11 UI and terrain.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [xrLaunchMode, setXrLaunchMode] = useState<XRLaunchMode | null>(null);
  const [mode, setMode] = useState<InteractionMode>("combined");
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [sensorIndex, setSensorIndex] = useState(0);
  const [focusedSensor, setFocusedSensor] =
    useState<MonitoringSensorItem | null>(null);
  const [openDashboards, setOpenDashboards] = useState<OpenDashboard[]>([]);
  const [timelineValues, setTimelineValues] = useState<[number, number]>([
    0, 100,
  ]);
  const [activeTimelineHandle, setActiveTimelineHandle] = useState<
    "start" | "end"
  >("start");
  const [rainIntensity, setRainIntensity] = useState(0.65);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [waterLevels, setWaterLevels] = useState<WaterLevelRow[]>([]);
  const [isWaterLoading, setIsWaterLoading] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [teleportRequestId, setTeleportRequestId] = useState(0);
  const [worldTravelOffset, setWorldTravelOffset] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [isMechanicsPanelLocked, setIsMechanicsPanelLocked] = useState(true);
  const [isMiniatureMode, setIsMiniatureMode] = useState(false);
  const [selectedMiniatureModel, setSelectedMiniatureModel] =
    useState<MiniatureModelKey>(DEFAULT_MINIATURE_MODEL);
  const [numericalAnimationFrame, setNumericalAnimationFrame] = useState(0);
  const [showClassificationTiles, setShowClassificationTiles] = useState(false);

  const menuRef = useRef<THREE.Group | null>(null);
  const menuColliderRef = useRef<THREE.Mesh | null>(null);
  const gebelimMiniatureRef = useRef<THREE.Group | null>(null);
  const gebelimMiniatureColliderRef = useRef<THREE.Mesh | null>(null);
  const droneMiniatureRef = useRef<THREE.Group | null>(null);
  const droneMiniatureColliderRef = useRef<THREE.Mesh | null>(null);
  const numericalMiniatureRef = useRef<THREE.Group | null>(null);
  const numericalMiniatureColliderRef = useRef<THREE.Mesh | null>(null);
  const numericalSliderRootRef = useRef<THREE.Group | null>(null);
  const numericalSliderHandleRef = useRef<THREE.Group | null>(null);
  const numericalSliderColliderRef = useRef<THREE.Mesh | null>(null);

  const dashboardPanelRefs = [
    useRef<THREE.Group | null>(null),
    useRef<THREE.Group | null>(null),
    useRef<THREE.Group | null>(null),
  ];
  const dashboardColliderRefs = [
    useRef<THREE.Mesh | null>(null),
    useRef<THREE.Mesh | null>(null),
    useRef<THREE.Mesh | null>(null),
  ];
  const dashboardCloseRefs = [
    useRef<THREE.Mesh | null>(null),
    useRef<THREE.Mesh | null>(null),
    useRef<THREE.Mesh | null>(null),
  ];

  const rayButtonRef = useRef<THREE.Mesh | null>(null);
  const grabButtonRef = useRef<THREE.Mesh | null>(null);
  const miniatureButtonRef = useRef<THREE.Mesh | null>(null);
  const miniatureModelButtonRefs: VRMiniatureModelButtonRefs = {
    montesinho: useRef<THREE.Mesh | null>(null),
    aguieira: useRef<THREE.Mesh | null>(null),
    gebelim: useRef<THREE.Mesh | null>(null),
    drone: useRef<THREE.Mesh | null>(null),
    numerical: useRef<THREE.Mesh | null>(null),
  };
  const classesButtonRef = useRef<THREE.Mesh | null>(null);
  const resetUiButtonRef = useRef<THREE.Mesh | null>(null);
  const teleportButtonRef = useRef<THREE.Mesh | null>(null);
  const lockMechanicsButtonRef = useRef<THREE.Mesh | null>(null);

  const menuButtonRefs: VRMenuButtonRefs = {
    previousMenu: useRef<THREE.Mesh | null>(null),
    nextMenu: useRef<THREE.Mesh | null>(null),
    collapseMenu: useRef<THREE.Mesh | null>(null),
    sensorPrevious: useRef<THREE.Mesh | null>(null),
    sensorNext: useRef<THREE.Mesh | null>(null),
    sensorSelect: useRef<THREE.Mesh | null>(null),
    sensorDashboard: useRef<THREE.Mesh | null>(null),
    dashboardButtons: {
      reservoir: useRef<THREE.Mesh | null>(null),
      manualCota: useRef<THREE.Mesh | null>(null),
      piezometerMetadata: useRef<THREE.Mesh | null>(null),
      piezometerHistory: useRef<THREE.Mesh | null>(null),
      seepage: useRef<THREE.Mesh | null>(null),
      temporaryBica: useRef<THREE.Mesh | null>(null),
      weather: useRef<THREE.Mesh | null>(null),
      timeline: useRef<THREE.Mesh | null>(null),
    },
    timelineLeft: useRef<THREE.Mesh | null>(null),
    timelineRight: useRef<THREE.Mesh | null>(null),
    timelineNarrow: useRef<THREE.Mesh | null>(null),
    timelineWide: useRef<THREE.Mesh | null>(null),
    timelineStartHandle: useRef<THREE.Mesh | null>(null),
    timelineEndHandle: useRef<THREE.Mesh | null>(null),
    playPause: useRef<THREE.Mesh | null>(null),
    resetPlayback: useRef<THREE.Mesh | null>(null),
    rainDown: useRef<THREE.Mesh | null>(null),
    rainUp: useRef<THREE.Mesh | null>(null),
  };

  const selectedStartDate = useMemo(
    () => timelineValueToDate(timelineValues[0]),
    [timelineValues]
  );
  const selectedEndDate = useMemo(
    () => timelineValueToDate(timelineValues[1]),
    [timelineValues]
  );
  const currentSensor = initialSensors[sensorIndex] ?? initialSensors[0];
  const isPassthroughSession = xrLaunchMode === "ar";
  const sceneYOffset = isPassthroughSession ? AR_CONTENT_Y_OFFSET : 0;
  const menuInitialPosition = useMemo(
    () => withYOffset(MENU_INITIAL_POSITION, sceneYOffset),
    [sceneYOffset]
  );
  const dashboardSlots = useMemo(
    () =>
      DASHBOARD_SLOTS.map((slot) => ({
        ...slot,
        position: withYOffset(slot.position, sceneYOffset),
      })),
    [sceneYOffset]
  );
  const interactiveMiniatureInitialPosition = useMemo(
    () => withYOffset(MINIATURE_INITIAL_POSITION, sceneYOffset),
    [sceneYOffset]
  );
  const handleNumericalSliderChange = useCallback((progress: number) => {
    const nextFrame = Math.round(
      THREE.MathUtils.clamp(progress, 0, 1) *
        NUMERICAL_ANIMATION_LAST_FRAME
    );

    setNumericalAnimationFrame((currentFrame) =>
      currentFrame === nextFrame ? currentFrame : nextFrame
    );
  }, []);

  const selectedInteractiveMiniatureTarget: DraggableTarget | null =
    selectedMiniatureModel === "gebelim"
      ? {
          id: "vr11-gebelim-miniature",
          ref: gebelimMiniatureRef,
          colliderRef: gebelimMiniatureColliderRef,
          initialPosition: interactiveMiniatureInitialPosition,
          initialScale: 1,
        }
      : selectedMiniatureModel === "drone"
      ? {
          id: "vr11-drone-miniature",
          ref: droneMiniatureRef,
          colliderRef: droneMiniatureColliderRef,
          initialPosition: interactiveMiniatureInitialPosition,
          initialScale: 1,
        }
      : selectedMiniatureModel === "numerical"
      ? {
          id: "vr11-numerical-miniature",
          ref: numericalMiniatureRef,
          colliderRef: numericalMiniatureColliderRef,
          initialPosition: interactiveMiniatureInitialPosition,
          initialScale: 1,
        }
      : null;

  const horizontalSliderTargets = useMemo<HorizontalSliderTarget[]>(
    () =>
      isMiniatureMode && selectedMiniatureModel === "numerical"
        ? [
            {
              id: "vr11-numerical-animation",
              rootRef: numericalSliderRootRef,
              handleRef: numericalSliderHandleRef,
              colliderRef: numericalSliderColliderRef,
              minX: NUMERICAL_SLIDER_MIN_X,
              maxX: NUMERICAL_SLIDER_MAX_X,
              onChange: handleNumericalSliderChange,
            },
          ]
        : [],
    [
      handleNumericalSliderChange,
      isMiniatureMode,
      selectedMiniatureModel,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsWaterLoading(true);
        setWaterError(null);
        setIsPlaying(false);
        setPlaybackIndex(0);

        const nextRows: WaterLevelRow[] = [];
        let offset = 0;

        while (nextRows.length < 5000) {
          const params = new URLSearchParams({
            start: formatApiDate(selectedStartDate),
            stop: formatApiDate(addOneDay(selectedEndDate)),
            limit: "1000",
            offset: String(offset),
          });
          const response = await fetch(
            `/api/reservoir_level_hourly?${params.toString()}`,
            { signal: controller.signal }
          );
          const json = (await response.json()) as ReservoirApiResponse;

          if (!response.ok || !json.ok) {
            throw new Error(json.error ?? "Failed to load reservoir rows");
          }

          const pageRows = (json.data ?? []).flatMap((row): WaterLevelRow[] => {
            const timestamp = row.timestamp_local || row.timestamp_original;
            const level = toNumber(row.cota_m);
            if (!timestamp) return [];
            return [{ timestamp, level }];
          });

          nextRows.push(...pageRows);
          if ((json.data ?? []).length < 1000 || json.nextOffset === null) break;
          offset = json.nextOffset ?? offset + 1000;
        }

        setWaterLevels(nextRows);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setWaterError(error instanceof Error ? error.message : "Unknown error");
        setWaterLevels([]);
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
  const dynamicWaterLevelY = useMemo(
    () => mapWaterLevelToSceneY(currentPlaybackRow?.level, waterStats),
    [currentPlaybackRow, waterStats]
  );

  function openDashboard(key: DashboardKey) {
    setOpenDashboards((current) => {
      if (current.length >= MAX_OPEN_DASHBOARDS) return current;
      return [
        ...current,
        {
          id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          key,
        },
      ];
    });
  }

  function closeDashboard(slotIndex: number) {
    setOpenDashboards((current) =>
      current.filter((_, index) => index !== slotIndex)
    );
  }

  function resetDraggableUi() {
    menuRef.current?.position.set(...menuInitialPosition);
    menuRef.current?.rotation.set(0, 0, 0);
    menuRef.current?.scale.setScalar(MENU_INITIAL_SCALE);

    dashboardPanelRefs.forEach((ref, index) => {
      const slot = dashboardSlots[index];
      if (!slot || !ref.current) return;
      ref.current.position.set(...slot.position);
      ref.current.rotation.set(...slot.rotation);
      ref.current.scale.setScalar(DASHBOARD_INITIAL_SCALE);
    });
  }

  function updateTimelineRange(updater: (range: [number, number]) => [number, number]) {
    setTimelineValues((current) => sortTimelineRange(updater(current)));
  }

  function moveActiveTimelineHandle(delta: number) {
    updateTimelineRange(([start, end]) =>
      activeTimelineHandle === "start"
        ? [clamp(start + delta, 0, end - 1), end]
        : [start, clamp(end + delta, start + 1, 100)]
    );
  }

  function zoomTimeline(factor: number) {
    updateTimelineRange(([start, end]) => {
      const center = (start + end) / 2;
      const width = clamp((end - start) * factor, 3, 100);
      return [center - width / 2, center + width / 2];
    });
  }

  function handlePlayPause() {
    if (waterLevels.length === 0 || isWaterLoading) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (playbackIndex >= waterLevels.length - 1) setPlaybackIndex(0);
    setIsPlaying(true);
  }

  const handleTeleport = useCallback((direction: THREE.Vector3) => {
    setWorldTravelOffset((current) => [
      current[0] - direction.x * TELEPORT_DISTANCE,
      current[1],
      current[2] - direction.z * TELEPORT_DISTANCE,
    ]);
  }, []);

  const menuButtons: VRButtonTarget[] = [
    {
      id: "menu-previous",
      ref: menuButtonRefs.previousMenu,
      onPress: () =>
        setActiveMenuIndex((index) => (index + MENU_COUNT - 1) % MENU_COUNT),
    },
    {
      id: "menu-next",
      ref: menuButtonRefs.nextMenu,
      onPress: () => setActiveMenuIndex((index) => (index + 1) % MENU_COUNT),
    },
    {
      id: "menu-collapse",
      ref: menuButtonRefs.collapseMenu,
      onPress: () => setIsMenuCollapsed((value) => !value),
    },
    {
      id: "sensor-previous",
      ref: menuButtonRefs.sensorPrevious,
      onPress: () =>
        setSensorIndex((index) =>
          index === 0 ? initialSensors.length - 1 : index - 1
        ),
    },
    {
      id: "sensor-next",
      ref: menuButtonRefs.sensorNext,
      onPress: () =>
        setSensorIndex((index) =>
          index === initialSensors.length - 1 ? 0 : index + 1
        ),
    },
    {
      id: "sensor-select",
      ref: menuButtonRefs.sensorSelect,
      onPress: () => setFocusedSensor(currentSensor),
    },
    {
      id: "sensor-dashboard",
      ref: menuButtonRefs.sensorDashboard,
      onPress: () => openDashboard(sensorDashboardKey(focusedSensor ?? currentSensor)),
    },
    {
      id: "timeline-start-handle",
      ref: menuButtonRefs.timelineStartHandle,
      onPress: () => setActiveTimelineHandle("start"),
    },
    {
      id: "timeline-end-handle",
      ref: menuButtonRefs.timelineEndHandle,
      onPress: () => setActiveTimelineHandle("end"),
    },
    {
      id: "timeline-left",
      ref: menuButtonRefs.timelineLeft,
      onPress: () => moveActiveTimelineHandle(-3),
    },
    {
      id: "timeline-right",
      ref: menuButtonRefs.timelineRight,
      onPress: () => moveActiveTimelineHandle(3),
    },
    {
      id: "timeline-narrow",
      ref: menuButtonRefs.timelineNarrow,
      onPress: () => zoomTimeline(0.65),
    },
    {
      id: "timeline-wide",
      ref: menuButtonRefs.timelineWide,
      onPress: () => zoomTimeline(1.45),
    },
    {
      id: "play-pause",
      ref: menuButtonRefs.playPause,
      onPress: handlePlayPause,
    },
    {
      id: "reset-playback",
      ref: menuButtonRefs.resetPlayback,
      onPress: () => {
        setIsPlaying(false);
        setPlaybackIndex(0);
      },
    },
    {
      id: "rain-down",
      ref: menuButtonRefs.rainDown,
      onPress: () => setRainIntensity((value) => clamp(value - 0.1, 0, 1)),
    },
    {
      id: "rain-up",
      ref: menuButtonRefs.rainUp,
      onPress: () => setRainIntensity((value) => clamp(value + 0.1, 0, 1)),
    },
    ...VR_MENU_DASHBOARD_KEYS.map((key: MenuDashboardKey) => ({
      id: `dashboard-${key}`,
      ref: menuButtonRefs.dashboardButtons[key],
      onPress: () => openDashboard(key),
    })),
  ];

  const mechanicsButtons: VRButtonTarget[] = [
    {
      id: "miniature-toggle",
      ref: miniatureButtonRef,
      onPress: () => {
        setSelectedMiniatureModel(DEFAULT_MINIATURE_MODEL);
        setIsMiniatureMode((value) => !value);
      },
    },
    {
      id: "classes-toggle",
      ref: classesButtonRef,
      onPress: () => setShowClassificationTiles((value) => !value),
    },
    {
      id: "reset-ui",
      ref: resetUiButtonRef,
      action: "reset-draggables",
      onPress: resetDraggableUi,
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
  ];

  const miniatureModelButtons: VRButtonTarget[] = MINIATURE_MODEL_OPTIONS.map(
    (option) => ({
      id: `miniature-model-${option.id}`,
      ref: miniatureModelButtonRefs[option.id],
      onPress: () => setSelectedMiniatureModel(option.id),
    })
  );

  const closeButtons: VRButtonTarget[] = dashboardCloseRefs.map((ref, index) => ({
    id: `close-dashboard-${index}`,
    ref,
    onPress: () => closeDashboard(index),
  }));

  const draggableTargets: DraggableTarget[] = [
    {
      id: "vr11-menu",
      ref: menuRef,
      colliderRef: menuColliderRef,
      initialPosition: menuInitialPosition,
      initialScale: MENU_INITIAL_SCALE,
    },
    ...dashboardPanelRefs.map((ref, index) => {
      const slot = dashboardSlots[index];
      return {
        id: `vr11-dashboard-${index}`,
        ref,
        colliderRef: dashboardColliderRefs[index],
        initialPosition: slot.position,
        initialScale: DASHBOARD_INITIAL_SCALE,
      };
    }),
    ...(isMiniatureMode && selectedInteractiveMiniatureTarget
      ? [selectedInteractiveMiniatureTarget]
      : []),
  ];

  const currentWaterTime = currentPlaybackRow
    ? formatPanelDateTime(currentPlaybackRow.timestamp)
    : waterError
    ? waterError
    : isWaterLoading
    ? "Loading reservoir..."
    : "No reservoir row";

  return (
    <main
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        overflow: "hidden",
        background: isPassthroughSession ? "transparent" : "black",
      }}
    >
      {xrLaunchMode ? (
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
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl, scene }) => {
            gl.xr.enabled = true;
            gl.setClearColor("#000000", 0);
            gl.setClearAlpha(0);
            gl.toneMapping = THREE.NoToneMapping;
            scene.background = null;
          }}
        >
          <VR11XRSetup mode={xrLaunchMode} />
          <CameraSetup />
          <TeleportRequestHandler
            requestId={teleportRequestId}
            onTeleport={handleTeleport}
          />

          {!isPassthroughSession ? (
            <Suspense fallback={null}>
              <Environment background="only" files="/skyy.hdr" />
            </Suspense>
          ) : null}

          <Suspense fallback={null}>
            <VRMontesinhoWorld
              rainIntensity={rainIntensity}
              waterLevelY={dynamicWaterLevelY}
              focusedSensor={focusedSensor}
              travelOffset={worldTravelOffset}
              miniMode={isMiniatureMode}
              miniatureModel={selectedMiniatureModel}
              gebelimMiniatureRef={gebelimMiniatureRef}
              gebelimMiniatureColliderRef={gebelimMiniatureColliderRef}
              droneMiniatureRef={droneMiniatureRef}
              droneMiniatureColliderRef={droneMiniatureColliderRef}
              numericalMiniatureRef={numericalMiniatureRef}
              numericalMiniatureColliderRef={numericalMiniatureColliderRef}
              numericalAnimationFrame={numericalAnimationFrame}
              verticalOffset={sceneYOffset}
              showClassificationTiles={showClassificationTiles}
              onSensorFocus={setFocusedSensor}
            />
          </Suspense>

          <Suspense fallback={null}>
            <HandInputSystem
              mode={mode}
              onModeChange={setMode}
              draggableTargets={draggableTargets}
              horizontalSliderTargets={horizontalSliderTargets}
              buttons={[
                ...menuButtons,
                ...mechanicsButtons,
                ...(isMiniatureMode ? miniatureModelButtons : []),
                ...closeButtons,
              ]}
            />

            <VRMenuPanel
              panelRef={menuRef}
              colliderRef={menuColliderRef}
              position={menuInitialPosition}
              buttonRefs={menuButtonRefs}
              activeMenuIndex={activeMenuIndex}
              isCollapsed={isMenuCollapsed}
              currentSensor={currentSensor}
              selectedSensor={focusedSensor}
              dashboardLimitReached={openDashboards.length >= MAX_OPEN_DASHBOARDS}
              timelineValues={timelineValues}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              activeTimelineHandle={activeTimelineHandle}
              rainIntensity={rainIntensity}
              waterRowsCount={waterLevels.length}
              isPlaying={isPlaying}
            />

            {openDashboards.map((dashboard, index) => (
              <VRDatasetDashboardPanel
                key={dashboard.id}
                dashboard={dashboard}
                slotIndex={index}
                panelRef={dashboardPanelRefs[index]}
                colliderRef={dashboardColliderRefs[index]}
                closeButtonRef={dashboardCloseRefs[index]}
                position={dashboardSlots[index]?.position}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
              />
            ))}

            <ModePanel
              mode={mode}
              isLocked={isMechanicsPanelLocked}
              rayButtonRef={rayButtonRef}
              grabButtonRef={grabButtonRef}
              miniatureButtonRef={miniatureButtonRef}
              miniatureActive={isMiniatureMode}
              classesButtonRef={classesButtonRef}
              classesActive={showClassificationTiles}
              showModeButtons={false}
              centerLockButton
              verticalOffset={sceneYOffset}
              resetButtonRef={resetUiButtonRef}
              teleportButtonRef={teleportButtonRef}
              lockButtonRef={lockMechanicsButtonRef}
            />

            {isMiniatureMode ? (
              <VRMiniatureModelPanel
                buttonRefs={miniatureModelButtonRefs}
                selectedModel={selectedMiniatureModel}
                verticalOffset={sceneYOffset}
              />
            ) : null}

            {isMiniatureMode && selectedMiniatureModel === "numerical" ? (
              <VRNumericalAnimationSlider
                rootRef={numericalSliderRootRef}
                handleRef={numericalSliderHandleRef}
                colliderRef={numericalSliderColliderRef}
                value={
                  numericalAnimationFrame / NUMERICAL_ANIMATION_LAST_FRAME
                }
                verticalOffset={sceneYOffset}
              />
            ) : null}
          </Suspense>
        </Canvas>
      ) : (
        <VR11LaunchScreen onSelect={(nextMode) => setXrLaunchMode(nextMode)} />
      )}
    </main>
  );
}
