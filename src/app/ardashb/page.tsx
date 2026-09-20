"use client";

import * as THREE from "three";
import React, { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { ARButton } from "three/addons/webxr/ARButton.js";

function WebARSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    scene.background = null;
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;

    const button = ARButton.createButton(gl, {
      optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
    });

    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl, scene]);

  return null;
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.4, -1.2);
  }, [camera]);

  return null;
}

function RoundedPanel({
  width,
  height,
  radius = 0.035,
  color = 0x111827,
  opacity = 0.92,
  position = [0, 0, 0],
}: {
  width: number;
  height: number;
  radius?: number;
  color?: number;
  opacity?: number;
  position?: [number, number, number];
}) {
  const shape = useMemo(() => {
    const x = -width / 2;
    const y = -height / 2;

    const s = new THREE.Shape();

    s.moveTo(x + radius, y);
    s.lineTo(x + width - radius, y);
    s.quadraticCurveTo(x + width, y, x + width, y + radius);
    s.lineTo(x + width, y + height - radius);
    s.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    s.lineTo(x + radius, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - radius);
    s.lineTo(x, y + radius);
    s.quadraticCurveTo(x, y, x + radius, y);

    return s;
  }, [width, height, radius]);

  return (
    <mesh position={position}>
      <shapeGeometry args={[shape, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function Label({
  text,
  position,
  size = 0.035,
  color = "white",
  anchorX = "left",
}: {
  text: string;
  position: [number, number, number];
  size?: number;
  color?: string;
  anchorX?: "left" | "center" | "right";
}) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY="middle"
      maxWidth={1.2}
      textAlign="left"
    >
      {text}
    </Text>
  );
}

function LineObject({
  points,
  color,
}: {
  points: THREE.Vector3[];
  color: number;
}) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    material.toneMapped = false;

    return new THREE.Line(geometry, material);
  }, [points, color]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();

      if (Array.isArray(line.material)) {
        line.material.forEach((mat) => mat.dispose());
      } else {
        line.material.dispose();
      }
    };
  }, [line]);

  return <primitive object={line} />;
}

function MiniBarChart({ position }: { position: [number, number, number] }) {
  const bars = [0.25, 0.55, 0.4, 0.78, 0.62, 0.9, 0.5];

  return (
    <group position={position}>
      {bars.map((h, i) => (
        <mesh
          key={i}
          position={[-0.34 + i * 0.11, -0.11 + h * 0.12, 0.01]}
        >
          <boxGeometry args={[0.055, h * 0.24, 0.01]} />
          <meshBasicMaterial color={0x38bdf8} toneMapped={false} />
        </mesh>
      ))}

      <mesh position={[0, -0.13, 0]}>
        <boxGeometry args={[0.82, 0.008, 0.01]} />
        <meshBasicMaterial color={0x475569} toneMapped={false} />
      </mesh>
    </group>
  );
}

function MiniRadarChart({
  position,
}: {
  position: [number, number, number];
}) {
  const points = useMemo(() => {
    const values = [0.8, 0.45, 0.7, 0.55, 0.9, 0.5];
    const result: THREE.Vector3[] = [];

    for (let i = 0; i < values.length; i++) {
      const angle = (i / values.length) * Math.PI * 2 + Math.PI / 2;
      const r = values[i] * 0.16;

      result.push(
        new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0.015)
      );
    }

    result.push(result[0].clone());

    return result;
  }, []);

  return (
    <group position={position}>
      {[0.06, 0.11, 0.16].map((r) => (
        <mesh key={r} position={[0, 0, 0]}>
          <ringGeometry args={[r, r + 0.002, 6]} />
          <meshBasicMaterial
            color={0x334155}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}

      <LineObject points={points} color={0xa855f7} />
    </group>
  );
}

function MiniLineChart({
  position,
}: {
  position: [number, number, number];
}) {
  const points = useMemo(() => {
    const values = [0.15, 0.3, 0.25, 0.55, 0.45, 0.72, 0.62, 0.85];

    return values.map(
      (v, i) =>
        new THREE.Vector3(-0.38 + i * 0.11, -0.1 + v * 0.22, 0.015)
    );
  }, []);

  return (
    <group position={position}>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.85, 0.008, 0.01]} />
        <meshBasicMaterial color={0x475569} toneMapped={false} />
      </mesh>

      <LineObject points={points} color={0x22c55e} />
    </group>
  );
}

function ThreeDDashboardTablet() {
  return (
    <group position={[0, 1.45, -1.25]} rotation={[0, 0, 0]}>
      {/* Tablet body */}
      <RoundedPanel
        width={1.45}
        height={0.9}
        radius={0.06}
        color={0x020617}
        opacity={0.96}
        position={[0, 0, 0]}
      />

      {/* Header */}
      <Label
        text="Monitoring Dashboard"
        position={[-0.65, 0.38, 0.02]}
        size={0.045}
      />
      <Label
        text="AR virtual tablet"
        position={[0.37, 0.38, 0.02]}
        size={0.024}
        color="#94a3b8"
      />

      {/* Left main panel */}
      <RoundedPanel
        width={0.48}
        height={0.7}
        radius={0.03}
        color={0x111827}
        opacity={0.96}
        position={[-0.44, -0.04, 0.01]}
      />
      <Label text="IPI Dashboard" position={[-0.64, 0.25, 0.03]} size={0.03} />
      <Label
        text="Displacement"
        position={[-0.64, 0.14, 0.03]}
        size={0.025}
        color="#94a3b8"
      />
      <Label
        text="12.4 mm"
        position={[-0.64, 0.07, 0.03]}
        size={0.055}
        color="#38bdf8"
      />
      <Label
        text="Status: Stable"
        position={[-0.64, -0.04, 0.03]}
        size={0.028}
        color="#22c55e"
      />
      <MiniBarChart position={[-0.44, -0.2, 0.03]} />

      {/* Right top panel */}
      <RoundedPanel
        width={0.82}
        height={0.32}
        radius={0.03}
        color={0x111827}
        opacity={0.96}
        position={[0.29, 0.15, 0.01]}
      />
      <Label
        text="Meteorologia Lapa"
        position={[-0.08, 0.26, 0.03]}
        size={0.028}
      />
      <Label
        text="Rain / Temperature / Humidity"
        position={[-0.08, 0.2, 0.03]}
        size={0.021}
        color="#94a3b8"
      />
      <MiniLineChart position={[0.29, 0.08, 0.03]} />

      {/* Right bottom panel */}
      <RoundedPanel
        width={0.82}
        height={0.32}
        radius={0.03}
        color={0x111827}
        opacity={0.96}
        position={[0.29, -0.22, 0.01]}
      />
      <Label
        text="Specified Domain Radar"
        position={[-0.08, -0.11, 0.03]}
        size={0.028}
      />
      <Label
        text="Risk indicators"
        position={[-0.08, -0.17, 0.03]}
        size={0.021}
        color="#94a3b8"
      />
      <MiniRadarChart position={[0.29, -0.26, 0.03]} />

      {/* Top handle */}
      <mesh position={[0, 0.47, 0.02]}>
        <boxGeometry args={[0.35, 0.018, 0.012]} />
        <meshBasicMaterial color={0x334155} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ARScene() {
  return (
    <>
      <WebARSetup />
      <CameraSetup />
      <ThreeDDashboardTablet />
    </>
  );
}

export default function Page() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{
          position: [0, 1.6, 0],
          fov: 70,
          near: 0.05,
          far: 20,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.xr.enabled = true;
          gl.setClearAlpha(0);
          gl.toneMapping = THREE.NoToneMapping;
          scene.background = null;
        }}
      >
        <ARScene />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          background: "rgba(0,0,0,0.55)",
          padding: "10px 14px",
          borderRadius: 10,
          pointerEvents: "none",
          maxWidth: 360,
          lineHeight: 1.35,
        }}
      >
        Quest 3 AR dashboard tablet test
        <br />
        Press START AR
      </div>
    </main>
  );
}