"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

import { ResizableDemo } from "@/components/Spliter3";
import { initialSensors } from "@/components/montesinho9/initialSensors";
import { OverlayModal } from "@/components/montesinho9/OverlayModal";
import { RainControlPanel } from "@/components/montesinho9/RainControlPanel";
import { SensorSidebar } from "@/components/montesinho9/SensorSidebar";
import { TimelineDock } from "@/components/montesinho9/TimelineDock";
import { WaterPlaybackPanel } from "@/components/montesinho9/WaterPlaybackPanel";
import { PLAYBACK_INTERVAL_MS } from "@/components/montesinho9/constants";
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
import { GuideCallouts } from "@/components/montesinho9guide/GuideCallouts";
import {
  GuideGizmoModePanel,
  type SensorGizmoMode,
} from "@/components/montesinho9guide/GuideGizmoModePanel";
import { GuideMontesinhoScene } from "@/components/montesinho9guide/GuideMontesinhoScene";
import { GuidePanel } from "@/components/montesinho9guide/GuidePanel";
import { GuideSensorGizmoSidebar } from "@/components/montesinho9guide/GuideSensorGizmoSidebar";
import {
  GUIDE_STEPS,
  type GuideLanguage,
  type GuideObjective,
} from "@/components/montesinho9guide/guideContent";
import { AddSensorPanel } from "@/components/montesinho9guide/AddSensorPanel";

type OrbitSnapshot = {
  radius: number;
  theta: number;
  phi: number;
};

type ObjectiveStatus = Record<GuideObjective["id"], boolean>;

const INITIAL_OBJECTIVES: ObjectiveStatus = {
  rotate: false,
  zoom: false,
  selectSensor: false,
  openGraph: false,
  changeRain: false,
  showTwoTiles: false,
  addSensor: false,
  useGizmos: false,
  openTimeline: false,
  chooseDateInterval: false,
  runAnimation: false,
};

const GUIDE_TARGET = new THREE.Vector3(70, -2, -70);

function getOrbitSnapshot(controls: any): OrbitSnapshot | null {
  const camera = controls?.object;
  const target = controls?.target;

  if (!camera || !target) return null;

  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);

  return {
    radius: spherical.radius,
    theta: spherical.theta,
    phi: spherical.phi,
  };
}

function angleDelta(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

export default function Page() {
  const controlsRef = useRef<any>(null);
  const initialOrbitRef = useRef<OrbitSnapshot | null>(null);
  const initialRainIntensityRef = useRef(0.65);

  const [showCountup] = useState(false);
  const [sensors, setSensors] =
    useState<MonitoringSensorItem[]>(initialSensors);
  const [createdGuideSensorCount, setCreatedGuideSensorCount] = useState(0);
  const [showTwoTiles, setShowTwoTiles] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(0.65);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const [isRainPanelOpen, setIsRainPanelOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSensorSidebarOpen, setIsSensorSidebarOpen] = useState(true);
  const [isSlipterOpen, setIsSlipterOpen] = useState(false);
  const [focusedSensor, setFocusedSensor] =
    useState<MonitoringSensorItem | null>(null);
  const [gizmoSensorId, setGizmoSensorId] = useState<string | null>(null);
  const [gizmoMode, setGizmoMode] = useState<SensorGizmoMode>("translate");

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [guideLanguage, setGuideLanguage] = useState<GuideLanguage>("en");
  const [objectives, setObjectives] =
    useState<ObjectiveStatus>(INITIAL_OBJECTIVES);

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

  const activeStep = GUIDE_STEPS[activeStepIndex];
  const isRainStep = activeStep.id === "change-rain";
  const isTwoTilesStep = activeStep.id === "show-two-tiles";
  const isTimelineStep = activeStep.id === "timeline-playback";
  const isRightControlsPhase = isRainStep || isTwoTilesStep;
  const isGuidePanelLeft = isRainStep || isTwoTilesStep || isTimelineStep;
  const isPostGraphGuidePhase =
    isRainStep ||
    isTwoTilesStep ||
    activeStep.id === "add-sensor" ||
    isTimelineStep;
  const isAddSensorStep = activeStep.id === "add-sensor";
  const isGizmoStep = activeStep.id === "sensor-gizmos";
  const hasChosenTimelineInterval =
    timelineValues[0] > 0.01 || timelineValues[1] < 99.99;

  const activeStepComplete = activeStep.objectives.every(
    (objective) => objectives[objective.id]
  );

  const isFinished =
    activeStepIndex === GUIDE_STEPS.length - 1 && activeStepComplete;

  function completeObjective(objectiveId: GuideObjective["id"]) {
    setObjectives((current) => {
      if (current[objectiveId]) return current;

      return {
        ...current,
        [objectiveId]: true,
      };
    });
  }

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

  function handleTimelineOpenChange(nextIsOpen: boolean) {
    setIsTimelineOpen(nextIsOpen);

    if (isTimelineStep && nextIsOpen) {
      completeObjective("openTimeline");
    }
  }

  function handleSensorSelect(sensor: MonitoringSensorItem) {
    setFocusedSensor(sensor);

    if (activeStepIndex === 1) {
      completeObjective("selectSensor");
    }
  }

  function handleSensorMarkerClick() {
    setIsSlipterOpen(true);

    if (activeStepIndex === 2) {
      completeObjective("openGraph");
    }
  }

  function handleRainIntensityChange(value: number) {
    setRainIntensity(value);

    if (
      isRainStep &&
      Math.abs(value - initialRainIntensityRef.current) >= 0.05
    ) {
      completeObjective("changeRain");
    }
  }

  function handleToggleTwoTiles() {
    const nextValue = !showTwoTiles;

    setShowTwoTiles(nextValue);

    if (isTwoTilesStep && nextValue) {
      completeObjective("showTwoTiles");
    }
  }

  function handleCreateGuideSensor(sensor: MonitoringSensorItem) {
    setSensors((currentSensors) => [...currentSensors, sensor]);
    setCreatedGuideSensorCount((count) => count + 1);
    setFocusedSensor(sensor);

    if (isAddSensorStep) {
      completeObjective("addSensor");
    }
  }

  function handleActivateSensorGizmos(sensor: MonitoringSensorItem) {
    setFocusedSensor(sensor);
    setGizmoSensorId(sensor.id);

    if (isGizmoStep) {
      completeObjective("useGizmos");
    }
  }

  function handleOrbitChange() {
    const snapshot = getOrbitSnapshot(controlsRef.current);

    if (!snapshot) return;

    if (!initialOrbitRef.current) {
      initialOrbitRef.current = snapshot;
      return;
    }

    const initial = initialOrbitRef.current;
    const hasRotated =
      angleDelta(snapshot.theta, initial.theta) > 0.16 ||
      Math.abs(snapshot.phi - initial.phi) > 0.12;
    const hasZoomed = Math.abs(snapshot.radius - initial.radius) > 8;

    if (activeStepIndex === 0 && hasRotated) {
      completeObjective("rotate");
    }

    if (activeStepIndex === 0 && hasZoomed) {
      completeObjective("zoom");
    }
  }

  function handleAdvance() {
    if (!activeStepComplete) return;

    const nextCompletedCount = Math.max(
      completedStepCount,
      activeStepIndex + 1
    );

    setCompletedStepCount(nextCompletedCount);

    if (activeStepIndex < GUIDE_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  }

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

  useEffect(() => {
    setIsRainPanelOpen(isRightControlsPhase);
    setIsSensorSidebarOpen(!isPostGraphGuidePhase);

    if (!isGizmoStep) {
      setGizmoSensorId(null);
      setOrbitControlsEnabled(true);
    }
  }, [isRightControlsPhase, isPostGraphGuidePhase, isGizmoStep]);

  useEffect(() => {
    if (isTwoTilesStep && showTwoTiles) {
      completeObjective("showTwoTiles");
    }
  }, [isTwoTilesStep, showTwoTiles]);

  useEffect(() => {
    if (isTimelineStep && isTimelineOpen) {
      completeObjective("openTimeline");
    }

    if (isTimelineStep && hasChosenTimelineInterval) {
      completeObjective("chooseDateInterval");
    }
  }, [isTimelineStep, isTimelineOpen, hasChosenTimelineInterval]);

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

    if (isTimelineStep && objectives.chooseDateInterval) {
      completeObjective("runAnimation");
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
        onRainIntensityChange={handleRainIntensityChange}
        onOpenChange={setIsRainPanelOpen}
        showTwoTiles={showTwoTiles}
        onToggleTwoTiles={handleToggleTwoTiles}
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

      {isGizmoStep ? (
        <GuideSensorGizmoSidebar
          sensors={sensors}
          isOpen={isSensorSidebarOpen}
          isTimelineOpen={isTimelineOpen}
          gizmoSensorId={gizmoSensorId}
          language={guideLanguage}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
          onActivateGizmos={handleActivateSensorGizmos}
        />
      ) : (
        <SensorSidebar
          sensors={sensors}
          isOpen={isSensorSidebarOpen}
          isTimelineOpen={isTimelineOpen}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
        />
      )}

      <GuideCallouts
        activeStepIndex={activeStepIndex}
        language={guideLanguage}
      />

      <GuidePanel
        activeStepIndex={activeStepIndex}
        completedStepCount={completedStepCount}
        objectiveStatus={objectives}
        selectedSensorTitle={focusedSensor?.title}
        side={isGuidePanelLeft ? "left" : "right"}
        language={guideLanguage}
        canAdvance={activeStepComplete}
        isFinished={isFinished}
        onLanguageChange={setGuideLanguage}
        onAdvance={handleAdvance}
      >
        {isAddSensorStep ? (
          <AddSensorPanel
            createdCount={createdGuideSensorCount}
            language={guideLanguage}
            onCreateSensor={handleCreateGuideSensor}
          />
        ) : null}
        {isGizmoStep ? (
          <GuideGizmoModePanel
            activeSensorTitle={
              sensors.find((sensor) => sensor.id === gizmoSensorId)?.title
            }
            mode={gizmoMode}
            language={guideLanguage}
            onModeChange={setGizmoMode}
          />
        ) : null}
      </GuidePanel>

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
          <GuideMontesinhoScene
            showTwoTiles={showTwoTiles}
            showCountup={showCountup}
            onCubeClick={handleSensorMarkerClick}
            focusedSensor={focusedSensor}
            controlsRef={controlsRef}
            sensors={sensors}
            rainIntensity={rainIntensity}
            waterLevelY={dynamicWaterLevelY}
            gizmoSensorId={gizmoSensorId}
            gizmoMode={gizmoMode}
            onGizmoDragStart={() => setOrbitControlsEnabled(false)}
            onGizmoDragEnd={() => setOrbitControlsEnabled(true)}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={GUIDE_TARGET}
          maxPolarAngle={Math.PI / 2.05}
          enabled={orbitControlsEnabled}
          enableDamping
          dampingFactor={0.08}
          onChange={handleOrbitChange}
        />
      </Canvas>

      <TimelineDock
        isOpen={isTimelineOpen}
        onOpenChange={handleTimelineOpenChange}
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
