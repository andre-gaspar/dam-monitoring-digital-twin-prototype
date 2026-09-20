"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import type { MonitoringSensorItem } from "./types";

function SensorLine({
  points,
  color,
  opacity = 1,
  throughTerrain = false,
}: {
  points: THREE.Vector3[];
  color: number;
  opacity?: number;
  throughTerrain?: boolean;
}) {
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: !throughTerrain,
      depthWrite: false,
      toneMapped: false,
    });

    const line = new THREE.Line(geometry, material);

    if (throughTerrain) {
      line.renderOrder = 10;
    }

    return line;
  }, [points, color, opacity, throughTerrain]);

  useEffect(() => {
    return () => {
      lineObject.geometry.dispose();

      if (Array.isArray(lineObject.material)) {
        lineObject.material.forEach((mat) => mat.dispose());
      } else {
        lineObject.material.dispose();
      }
    };
  }, [lineObject]);

  return <primitive object={lineObject} />;
}

export function SensorMarker({
  sensor,
  position,
  surfaceY,
  selected = false,
  visualScale = 1,
  flowMeterRotation,
  onClick,
}: {
  sensor: MonitoringSensorItem;
  position: [number, number, number];
  surfaceY: number;
  selected?: boolean;
  visualScale?: number;
  flowMeterRotation?: [number, number, number];
  onClick: (sensor: MonitoringSensorItem) => void;
}) {
  const type = sensor.type ?? "leveling_mark";
  const depth = sensor.depth ?? 0;
  const length = sensor.length ?? Math.max(depth, 15);

  const baseScale =
    type === "piezometer_pneumatic"
      ? 0.14
      : type === "leveling_mark"
      ? 0.28
      : 0.30;
  const S = baseScale * visualScale;

  const color = (() => {
    if (selected) return 0xffff00;

    switch (type) {
      case "leveling_mark":
        return 0xffaa00;
      case "reference_leveling_mark":
        return 0xffffff;
      case "piezometer_pneumatic":
        return 0x00d4ff;
      case "inclinometer_vertical":
        return 0xa855f7;
      case "inclinometer_inclined":
        return 0xff4fd8;
      case "flow_meter":
        return 0x22c55e;
      case "water_level_gauge":
        return 0x2563eb;
      default:
        return 0xff3333;
    }
  })();

  const undergroundY = -depth;

  const inclinedAngle = THREE.MathUtils.degToRad(sensor.inclinationDeg ?? 28);
  const azimuth = THREE.MathUtils.degToRad(sensor.azimuthDeg ?? 0);

  const inclinedEnd = useMemo(() => {
    const horizontal = Math.sin(inclinedAngle) * length;
    const vertical = Math.cos(inclinedAngle) * length;

    return new THREE.Vector3(
      Math.sin(azimuth) * horizontal,
      -vertical,
      Math.cos(azimuth) * horizontal
    );
  }, [inclinedAngle, azimuth, length]);

  return (
    <group
      position={[position[0], surfaceY, position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(sensor);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25 * S, 0]}>
        <ringGeometry
          args={[selected ? 6 * S : 4 * S, selected ? 8 * S : 5.5 * S, 48]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.75 : 0.35}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {(type === "leveling_mark" || type === "reference_leveling_mark") && (
        <>
          <mesh position={[0, 0.45 * S, 0]}>
            <cylinderGeometry args={[2.2 * S, 2.2 * S, 0.9 * S, 24]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>

          <mesh position={[0, 1.25 * S, 0]}>
            <boxGeometry args={[3.2 * S, 0.35 * S, 3.2 * S]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </>
      )}

      {type === "piezometer_pneumatic" && (
        <>
          <SensorLine
            points={[
              new THREE.Vector3(0, 1.5 * S, 0),
              new THREE.Vector3(0, undergroundY, 0),
            ]}
            color={color}
            opacity={0.9}
            throughTerrain
          />

          <mesh position={[0, 1.25 * S, 0]}>
            <cylinderGeometry args={[2.5 * S, 2.5 * S, 0.7 * S, 24]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.95}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, undergroundY, 0]}>
            <sphereGeometry args={[3.2 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, undergroundY - 1, 0]}>
            <cylinderGeometry args={[1.1 * S, 1.1 * S, 2, 16]} />
            <meshBasicMaterial
              color={0x99f6e4}
              transparent
              opacity={0.65}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {type === "inclinometer_vertical" && (
        <>
          <mesh position={[0, -length / 2, 0]}>
            <cylinderGeometry args={[0.9 * S, 0.9 * S, length, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.55}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {Array.from({ length: Math.floor(length / 3) + 1 }).map((_, i) => (
            <mesh
              key={i}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, -i * 3, 0]}
            >
              <torusGeometry args={[2.0 * S, 0.15 * S, 8, 32]} />
              <meshBasicMaterial
                color={0xffffff}
                transparent
                opacity={0.85}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}

          <mesh position={[0, 1.5 * S, 0]}>
            <cylinderGeometry args={[2.7 * S, 2.7 * S, 0.8 * S, 24]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </>
      )}

      {type === "inclinometer_inclined" && (
        <>
          <SensorLine
            points={[new THREE.Vector3(0, 0.8 * S, 0), inclinedEnd]}
            color={color}
            opacity={0.95}
            throughTerrain
          />

          <mesh position={[0, 0.8 * S, 0]}>
            <sphereGeometry args={[2.6 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[inclinedEnd.x, inclinedEnd.y, inclinedEnd.z]}>
            <sphereGeometry args={[2.2 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.8}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {type === "flow_meter" && (
        <group rotation={flowMeterRotation}>
          <mesh position={[0, 0.3 * S, 0]}>
            <boxGeometry args={[8 * S, 0.6 * S, 5 * S]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.75}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[5 * S, 0.3 * S, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.8 * S, 0.8 * S, 7 * S, 16]} />
            <meshBasicMaterial color={0x93c5fd} toneMapped={false} />
          </mesh>
        </group>
      )}

      {type === "water_level_gauge" && (
        <>
          <mesh position={[0, -8 * S, 0]}>
            <cylinderGeometry args={[0.45 * S, 0.45 * S, 16 * S, 16]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>

          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[1.2 * S, -(i * 3 + 1) * S, 0]}>
              <boxGeometry args={[2.2 * S, 0.18 * S, 0.18 * S]} />
              <meshBasicMaterial color={0xffffff} toneMapped={false} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
