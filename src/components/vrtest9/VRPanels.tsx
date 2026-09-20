"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { MeteorologiaLapa3DChart } from "@/components/MeteorologiaLapa3DChart";

import { InvisibleCollider } from "./VRBasics";
import {
  CHART_INITIAL_POSITION,
  CHART_INITIAL_SCALE,
  DASHBOARD_INITIAL_POSITION,
  DASHBOARD_INITIAL_SCALE,
} from "./constants";
import type { InteractionMode } from "./VRInteractionSystem";

type ButtonRef = React.RefObject<THREE.Mesh | null>;

const MODE_PANEL_DISTANCE = 0.30;
const MODE_PANEL_VERTICAL_OFFSET = -0.72;
const MODE_PANEL_PITCH = -Math.PI / 4;

export type DashboardButtonRefs = {
  rainDown: ButtonRef;
  rainUp: ButtonRef;
  rangeLeft: ButtonRef;
  rangeRight: ButtonRef;
  rangeNarrow: ButtonRef;
  rangeWide: ButtonRef;
  playPause: ButtonRef;
  resetPlayback: ButtonRef;
  previousSeries: ButtonRef;
  nextSeries: ButtonRef;
};

function PanelButton({
  label,
  meshRef,
  active = false,
  position,
  width = 0.28,
  color = 0x111827,
}: {
  label: string;
  meshRef: ButtonRef;
  active?: boolean;
  position: [number, number, number];
  width?: number;
  color?: number;
}) {
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[width, 0.078, 0.035]} />
        <meshBasicMaterial
          color={active ? 0x22c55e : color}
          transparent
          opacity={active ? 1 : 0.92}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[0, 0, 0.026]}
        fontSize={0.026}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.86}
      >
        {label}
      </Text>
    </group>
  );
}

function PanelLabel({
  children,
  position,
  size = 0.027,
  color = "#cbd5e1",
  maxWidth = 0.95,
}: {
  children: React.ReactNode;
  position: [number, number, number];
  size?: number;
  color?: string;
  maxWidth?: number;
}) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX="left"
      anchorY="middle"
      maxWidth={maxWidth}
    >
      {children}
    </Text>
  );
}

export function ModePanel({
  mode,
  isLocked,
  rayButtonRef,
  grabButtonRef,
  combinedButtonRef,
  miniatureButtonRef,
  miniatureActive = false,
  classesButtonRef,
  classesActive = false,
  showModeButtons = true,
  centerLockButton = false,
  verticalOffset = 0,
  resetButtonRef,
  teleportButtonRef,
  lockButtonRef,
}: {
  mode: InteractionMode;
  isLocked: boolean;
  rayButtonRef: ButtonRef;
  grabButtonRef: ButtonRef;
  combinedButtonRef?: ButtonRef;
  miniatureButtonRef?: ButtonRef;
  miniatureActive?: boolean;
  classesButtonRef?: ButtonRef;
  classesActive?: boolean;
  showModeButtons?: boolean;
  centerLockButton?: boolean;
  verticalOffset?: number;
  resetButtonRef: ButtonRef;
  teleportButtonRef: ButtonRef;
  lockButtonRef: ButtonRef;
}) {
  const panelRef = useRef<THREE.Group | null>(null);
  const { camera, gl } = useThree();
  const cameraPosition = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());

  useFrame(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (isLocked) return;

    const xrCamera = gl.xr.isPresenting ? gl.xr.getCamera() : camera;

    xrCamera.getWorldPosition(cameraPosition.current);
    xrCamera.getWorldDirection(forward.current);
    forward.current.y = 0;

    if (forward.current.lengthSq() < 0.0001) {
      forward.current.set(0, 0, -1);
    } else {
      forward.current.normalize();
    }

    targetPosition.current
      .copy(cameraPosition.current)
      .addScaledVector(forward.current, MODE_PANEL_DISTANCE);
    targetPosition.current.y += MODE_PANEL_VERTICAL_OFFSET;

    panel.position.lerp(targetPosition.current, 0.32);
    panel.rotation.set(
      0,
      Math.atan2(-forward.current.x, -forward.current.z),
      0
    );
  });

  const hasCombinedButton = showModeButtons && Boolean(combinedButtonRef);
  const hasActionPair =
    !showModeButtons && Boolean(miniatureButtonRef && classesButtonRef);
  const isWidePanel = hasCombinedButton || hasActionPair;
  const panelWidth = isWidePanel ? 1.36 : 1.12;

  return (
    <group
      ref={panelRef}
      position={[0, 0.88 + verticalOffset, -0.78]}
      rotation={[0, 0, 0]}
    >
      <group rotation={[MODE_PANEL_PITCH, 0, 0]}>
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[panelWidth, 0.32]} />
          <meshBasicMaterial
            color={0x020617}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        <Text
          position={[isWidePanel ? -0.62 : -0.51, 0.105, 0.02]}
          fontSize={0.03}
          color="white"
          anchorX="left"
          anchorY="middle"
        >
          Hand mode
        </Text>

        <PanelButton
          label={isLocked ? "LOCKED" : "FOLLOW"}
          active={isLocked}
          position={[
            centerLockButton ? 0 : isWidePanel ? 0.52 : 0.405,
            0.105,
            0.02,
          ]}
          meshRef={lockButtonRef}
          width={0.25}
          color={0x475569}
        />

        {showModeButtons ? (
          <>
            <PanelButton
              label="RAY"
              active={mode === "ray-drag"}
              position={[hasCombinedButton ? -0.52 : -0.37, -0.065, 0.02]}
              meshRef={rayButtonRef}
              width={0.22}
              color={0x2563eb}
            />

            <PanelButton
              label="GRAB"
              active={mode === "grab-scale"}
              position={[hasCombinedButton ? -0.29 : -0.12, -0.065, 0.02]}
              meshRef={grabButtonRef}
              width={0.22}
              color={0x7c3aed}
            />

            {combinedButtonRef ? (
              <PanelButton
                label="COMB"
                active={mode === "combined"}
                position={[-0.06, -0.065, 0.02]}
                meshRef={combinedButtonRef}
                width={0.22}
                color={0x0f766e}
              />
            ) : null}
          </>
        ) : null}

        {miniatureButtonRef ? (
          <PanelButton
            label="MINI"
            active={miniatureActive}
            position={[
              showModeButtons ? -0.33 : hasActionPair ? -0.46 : -0.34,
              -0.065,
              0.02,
            ]}
            meshRef={miniatureButtonRef}
            width={0.24}
            color={0x0ea5e9}
          />
        ) : null}

        {classesButtonRef ? (
          <PanelButton
            label="CLASSES"
            active={classesActive}
            position={[
              showModeButtons ? -0.06 : hasActionPair ? -0.17 : -0.34,
              -0.065,
              0.02,
            ]}
            meshRef={classesButtonRef}
            width={0.3}
            color={0x0f766e}
          />
        ) : null}

        <PanelButton
          label="RESET UI"
          position={[
            showModeButtons
              ? hasCombinedButton
                ? 0.22
                : 0.165
              : hasActionPair
              ? 0.15
              : 0,
            -0.065,
            0.02,
          ]}
          meshRef={resetButtonRef}
          width={0.28}
          color={0xef4444}
        />

        <PanelButton
          label="TELEPORT"
          position={[
            showModeButtons
              ? hasCombinedButton
                ? 0.5
                : 0.435
              : hasActionPair
              ? 0.46
              : 0.32,
            -0.065,
            0.02,
          ]}
          meshRef={teleportButtonRef}
          width={0.24}
          color={0x0891b2}
        />
      </group>
    </group>
  );
}

export function VRDashboardPanel({
  panelRef,
  colliderRef,
  buttonRefs,
  rainIntensity,
  timelineValues,
  waterRowsCount,
  playbackProgress,
  currentWaterTime,
  currentWaterLevel,
  isPlaying,
  selectedSeriesLabel,
}: {
  panelRef: React.RefObject<THREE.Group | null>;
  colliderRef: React.RefObject<THREE.Mesh | null>;
  buttonRefs: DashboardButtonRefs;
  rainIntensity: number;
  timelineValues: [number, number];
  waterRowsCount: number;
  playbackProgress: number;
  currentWaterTime: string;
  currentWaterLevel: string;
  isPlaying: boolean;
  selectedSeriesLabel: string;
}) {
  return (
    <group
      ref={panelRef}
      position={DASHBOARD_INITIAL_POSITION}
      scale={DASHBOARD_INITIAL_SCALE}
      rotation={[0, 0.16, 0]}
    >
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.15, 1.2, 0.05]} />
        <meshBasicMaterial color={0x020617} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.08, 1.13]} />
        <meshBasicMaterial
          color={0x0f172a}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[-0.47, 0.49, 0.035]}
        fontSize={0.044}
        color="white"
        anchorX="left"
        anchorY="middle"
        maxWidth={0.94}
      >
        Montesinho9 VR
      </Text>

      <PanelLabel position={[-0.47, 0.405, 0.035]}>
        Rain {Math.round(rainIntensity * 100)}%
      </PanelLabel>
      <PanelButton
        label="- RAIN"
        meshRef={buttonRefs.rainDown}
        position={[-0.22, 0.32, 0.035]}
        color={0x1d4ed8}
      />
      <PanelButton
        label="+ RAIN"
        meshRef={buttonRefs.rainUp}
        position={[0.16, 0.32, 0.035]}
        color={0x1d4ed8}
      />

      <PanelLabel position={[-0.47, 0.215, 0.035]}>
        Timeline {Math.round(timelineValues[0])}% -{" "}
        {Math.round(timelineValues[1])}%
      </PanelLabel>
      <PanelButton
        label="< RANGE"
        meshRef={buttonRefs.rangeLeft}
        position={[-0.3, 0.13, 0.035]}
        width={0.25}
        color={0x334155}
      />
      <PanelButton
        label="RANGE >"
        meshRef={buttonRefs.rangeRight}
        position={[0.01, 0.13, 0.035]}
        width={0.25}
        color={0x334155}
      />
      <PanelButton
        label="ZOOM -"
        meshRef={buttonRefs.rangeWide}
        position={[0.32, 0.13, 0.035]}
        width={0.24}
        color={0x334155}
      />
      <PanelButton
        label="ZOOM +"
        meshRef={buttonRefs.rangeNarrow}
        position={[0.32, 0.03, 0.035]}
        width={0.24}
        color={0x334155}
      />

      <PanelLabel position={[-0.47, -0.005, 0.035]} size={0.024}>
        Water rows {waterRowsCount} | Playback {Math.round(playbackProgress)}%
      </PanelLabel>
      <PanelLabel position={[-0.47, -0.075, 0.035]} size={0.022}>
        {currentWaterTime}
      </PanelLabel>
      <PanelLabel position={[-0.47, -0.14, 0.035]} size={0.022}>
        Level {currentWaterLevel}
      </PanelLabel>

      <PanelButton
        label={isPlaying ? "PAUSE" : "PLAY"}
        meshRef={buttonRefs.playPause}
        position={[-0.24, -0.235, 0.035]}
        width={0.3}
        color={0x16a34a}
      />
      <PanelButton
        label="RESET"
        meshRef={buttonRefs.resetPlayback}
        position={[0.13, -0.235, 0.035]}
        width={0.3}
        color={0xdc2626}
      />

      <PanelLabel position={[-0.47, -0.34, 0.035]} size={0.021}>
        Meteorology: {selectedSeriesLabel}
      </PanelLabel>
      <PanelButton
        label="PREV"
        meshRef={buttonRefs.previousSeries}
        position={[-0.24, -0.435, 0.035]}
        width={0.3}
        color={0x7c3aed}
      />
      <PanelButton
        label="NEXT"
        meshRef={buttonRefs.nextSeries}
        position={[0.13, -0.435, 0.035]}
        width={0.3}
        color={0x7c3aed}
      />

      <InvisibleCollider
        colliderRef={colliderRef}
        args={[1.18, 1.22, 0.16]}
        position={[0, 0, 0.04]}
      />
    </group>
  );
}

export function DraggableMeteorologiaChart({
  chartRef,
  chartColliderRef,
  seriesId,
  selectedLabel,
}: {
  chartRef: React.RefObject<THREE.Group | null>;
  chartColliderRef: React.RefObject<THREE.Mesh | null>;
  seriesId: string;
  selectedLabel: string;
}) {
  return (
    <group
      ref={chartRef}
      position={CHART_INITIAL_POSITION}
      scale={CHART_INITIAL_SCALE}
      rotation={[0, -0.18, 0]}
    >
      <MeteorologiaLapa3DChart
        seriesId={seriesId}
        selectedLabel={selectedLabel}
        title="Meteorology"
        position={[0, 0, 0]}
        scale={1}
        limit={500}
      />

      <InvisibleCollider
        colliderRef={chartColliderRef}
        args={[1.9, 1.25, 0.16]}
        position={[0, 0, 0.03]}
      />
    </group>
  );
}
