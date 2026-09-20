"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { RainEffect } from "@/components/RainEffect";
import {
  CAMERA_LERP_SPEED,
  LAKEBED_MODEL_URL,
  MODEL_URL,
  RAIN_AREA_CENTER_Y_OFFSET,
  RAIN_AREA_SIZE_X,
  RAIN_AREA_SIZE_Y,
  RAIN_AREA_SIZE_Z,
  RAIN_CLOUD_BOUNDS,
  RAIN_CLOUD_Y_OFFSET,
  TWO_TILES_MODEL_URL,
  WATER_POSITION,
  WATER_SIZE_X,
  WATER_SIZE_Z,
} from "./constants";
import { Ocean } from "./Ocean";
import { RainCloudLayer } from "./RainCloudLayer";
import { SensorMarker } from "./SensorMarker";
import { VertexColorModel } from "./VertexColorModel";
import type { MonitoringSensorItem, OrbitControlsRef } from "./types";
import { geoToLocal } from "./utils";

type SceneProps = {
  showTwoTiles: boolean;
  showCountup: boolean;
  onCubeClick: (sensor: MonitoringSensorItem) => void;
  focusedSensor: MonitoringSensorItem | null;
  controlsRef: React.RefObject<OrbitControlsRef>;
  sensors: MonitoringSensorItem[];
  rainIntensity: number;
  waterLevelY: number;
};

export function MontesinhoScene({
  showTwoTiles,
  showCountup,
  onCubeClick,
  focusedSensor,
  controlsRef,
  sensors,
  rainIntensity,
  waterLevelY,
}: SceneProps) {
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const lakebedModelRef = useRef<THREE.Object3D | null>(null);

  const cameraTargetPositionRef = useRef<THREE.Vector3 | null>(null);
  const controlsTargetRef = useRef<THREE.Vector3 | null>(null);

  const [sensorCubePositions, setSensorCubePositions] = useState<
    {
      sensor: MonitoringSensorItem;
      position: [number, number, number];
      surfaceY: number;
    }[]
  >([]);

  const gltf = useGLTF(MODEL_URL);

  const rainAreaCenter = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_AREA_CENTER_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  const rainAreaSize = useMemo<[number, number, number]>(
    () => [RAIN_AREA_SIZE_X, RAIN_AREA_SIZE_Y, RAIN_AREA_SIZE_Z],
    []
  );

  const rainCloudPosition = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_CLOUD_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  const modelBounds = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);

    if (box.isEmpty()) {
      return new THREE.Box3(
        new THREE.Vector3(-500, 0, -500),
        new THREE.Vector3(500, 100, 500)
      );
    }

    return box;
  }, [gltf.scene, showCountup]);

  useEffect(() => {
    if (!modelRef.current || !groupRef.current) return;

    const raycaster = new THREE.Raycaster();

    const nextPositions = sensors.map((sensor) => {
      if (sensor.manualPosition) {
        return {
          sensor,
          surfaceY: sensor.manualPosition[1],
          position: sensor.manualPosition,
        };
      }

      const { x, z } = geoToLocal(sensor.lon, sensor.lat, modelBounds);

      const localOrigin = new THREE.Vector3(x, modelBounds.max.y + 500, z);
      const worldOrigin = groupRef.current!.localToWorld(localOrigin.clone());

      raycaster.set(worldOrigin, new THREE.Vector3(0, -1, 0));

      const hits = raycaster.intersectObject(modelRef.current!, true);

      if (hits.length > 0) {
        const hitWorld = hits[0].point.clone();
        const hitLocal = groupRef.current!.worldToLocal(hitWorld);

        return {
          sensor,
          surfaceY: hitLocal.y,
          position: [hitLocal.x, hitLocal.y, hitLocal.z] as [
            number,
            number,
            number
          ],
        };
      }

      return {
        sensor,
        surfaceY: modelBounds.max.y,
        position: [x, modelBounds.max.y, z] as [number, number, number],
      };
    });

    setSensorCubePositions(nextPositions);
  }, [sensors, modelBounds, showCountup]);

  useEffect(() => {
    if (!focusedSensor) return;

    if (focusedSensor.manualPosition) {
      const [x, y, z] = focusedSensor.manualPosition;

      cameraTargetPositionRef.current = new THREE.Vector3(
        x + 35,
        y + 35,
        z + 35
      );

      controlsTargetRef.current = new THREE.Vector3(x, y, z);

      return;
    }

    const { x, z } = geoToLocal(
      focusedSensor.lon,
      focusedSensor.lat,
      modelBounds
    );

    const y = modelBounds.max.y + 8;

    cameraTargetPositionRef.current = new THREE.Vector3(
      x + 35,
      y + 35,
      z + 35
    );

    controlsTargetRef.current = new THREE.Vector3(x, y - 2, z);
  }, [focusedSensor, modelBounds]);

  useFrame((_, delta) => {
    const cameraTarget = cameraTargetPositionRef.current;
    const controlsTarget = controlsTargetRef.current;

    if (!cameraTarget && !controlsTarget) return;

    const alpha = 1 - Math.exp(-CAMERA_LERP_SPEED * delta);

    if (cameraTarget) {
      camera.position.lerp(cameraTarget, alpha);
    }

    if (controlsRef.current && controlsTarget) {
      controlsRef.current.target.lerp(controlsTarget, alpha);
      controlsRef.current.update();
    }

    const cameraDone =
      !cameraTarget || camera.position.distanceTo(cameraTarget) < 0.05;

    const controlsDone =
      !controlsTarget ||
      !controlsRef.current ||
      controlsRef.current.target.distanceTo(controlsTarget) < 0.05;

    if (cameraDone && controlsDone) {
      if (cameraTarget) {
        camera.position.copy(cameraTarget);
      }

      if (controlsRef.current && controlsTarget) {
        controlsRef.current.target.copy(controlsTarget);
        controlsRef.current.update();
      }

      cameraTargetPositionRef.current = null;
      controlsTargetRef.current = null;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <VertexColorModel
        url={MODEL_URL}
        modelRef={modelRef}
        onTerrainPick={(worldPoint) => {
          if (!groupRef.current) return;

          const localPoint = groupRef.current.worldToLocal(worldPoint.clone());

          const manualPosition: [number, number, number] = [
            Number(localPoint.x.toFixed(3)),
            Number(localPoint.y.toFixed(3)),
            Number(localPoint.z.toFixed(3)),
          ];

          const text = `manualPosition: [${manualPosition[0]}, ${manualPosition[1]}, ${manualPosition[2]}]`;

          console.log(text);

          navigator.clipboard?.writeText(
            `[${manualPosition[0]}, ${manualPosition[1]}, ${manualPosition[2]}]`
          );
        }}
      />
      {showTwoTiles ? (
        <VertexColorModel url={TWO_TILES_MODEL_URL} modelRef={undefined} />
      ) : null}
      <VertexColorModel url={LAKEBED_MODEL_URL} modelRef={lakebedModelRef} />

      <Ocean position={[WATER_POSITION[0], waterLevelY, WATER_POSITION[2]]} />

      <RainCloudLayer
        rainIntensity={rainIntensity}
        position={rainCloudPosition}
        bounds={RAIN_CLOUD_BOUNDS}
      />

      <RainEffect
        enabled={rainIntensity > 0}
        intensity={rainIntensity}
        dropCount={3500}
        areaCenter={rainAreaCenter}
        areaSize={rainAreaSize}
        dropLength={2.8}
        fallSpeed={38}
        wind={[3.5, -1.2]}
        opacity={0.42}
        splashesEnabled
        waterSurfaceY={waterLevelY}
        waterCenter={[WATER_POSITION[0], WATER_POSITION[2]]}
        waterSize={[WATER_SIZE_X, WATER_SIZE_Z]}
        rippleCount={90}
      />

      {sensorCubePositions.map((marker) => (
        <SensorMarker
          key={marker.sensor.id}
          sensor={marker.sensor}
          position={marker.position}
          surfaceY={marker.surfaceY}
          selected={focusedSensor?.id === marker.sensor.id}
          flowMeterRotation={
            marker.sensor.title === "MC-01" ? [0, -Math.PI / 2, 0] : undefined
          }
          onClick={onCubeClick}
        />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
useGLTF.preload(TWO_TILES_MODEL_URL);
useGLTF.preload(LAKEBED_MODEL_URL);
