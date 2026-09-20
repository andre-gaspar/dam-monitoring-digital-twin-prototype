"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { RainEffect } from "@/components/RainEffect";
import {
  LAKEBED_MODEL_URL,
  MODEL_URL,
  RAIN_AREA_CENTER_Y_OFFSET,
  RAIN_AREA_SIZE_X,
  RAIN_AREA_SIZE_Y,
  RAIN_AREA_SIZE_Z,
  RAIN_CLOUD_BOUNDS,
  RAIN_CLOUD_Y_OFFSET,
  WATER_POSITION,
  WATER_SIZE_X,
  WATER_SIZE_Z,
} from "@/components/montesinho8/constants";
import { initialSensors } from "@/components/montesinho8/initialSensors";
import { Ocean } from "@/components/montesinho8/Ocean";
import { RainCloudLayer } from "@/components/montesinho8/RainCloudLayer";
import { SensorMarker } from "@/components/montesinho8/SensorMarker";
import { VertexColorModel } from "@/components/montesinho8/VertexColorModel";
import type { MonitoringSensorItem } from "@/components/montesinho8/types";
import { geoToLocal } from "@/components/montesinho8/utils";

import { SCENE_GROUP_POSITION, WORLD_OFFSET } from "./constants";

type SensorPosition = {
  sensor: MonitoringSensorItem;
  position: [number, number, number];
  surfaceY: number;
};

type VRMontesinhoWorldProps = {
  rainIntensity: number;
  waterLevelY: number;
  focusedSensor: MonitoringSensorItem | null;
  onSensorFocus: (sensor: MonitoringSensorItem) => void;
};

export function VRMontesinhoWorld({
  rainIntensity,
  waterLevelY,
  focusedSensor,
  onSensorFocus,
}: VRMontesinhoWorldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const lakebedModelRef = useRef<THREE.Object3D | null>(null);

  const [sensorPositions, setSensorPositions] = useState<SensorPosition[]>([]);

  const gltf = useGLTF(MODEL_URL);

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
  }, [gltf.scene]);

  const rainAreaCenter = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_AREA_CENTER_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  const rainCloudPosition = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_CLOUD_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  useEffect(() => {
    if (!modelRef.current || !groupRef.current) return;

    const raycaster = new THREE.Raycaster();

    const nextPositions = initialSensors.map((sensor) => {
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

    setSensorPositions(nextPositions);
  }, [modelBounds]);

  return (
    <group position={WORLD_OFFSET}>
      <group ref={groupRef} position={SCENE_GROUP_POSITION}>
        <VertexColorModel url={MODEL_URL} modelRef={modelRef} />
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
          dropCount={2600}
          areaCenter={rainAreaCenter}
          areaSize={[RAIN_AREA_SIZE_X, RAIN_AREA_SIZE_Y, RAIN_AREA_SIZE_Z]}
          dropLength={2.8}
          fallSpeed={38}
          wind={[3.5, -1.2]}
          opacity={0.38}
          splashesEnabled
          waterSurfaceY={waterLevelY}
          waterCenter={[WATER_POSITION[0], WATER_POSITION[2]]}
          waterSize={[WATER_SIZE_X, WATER_SIZE_Z]}
          rippleCount={70}
        />

        {sensorPositions.map((marker) => (
          <SensorMarker
            key={marker.sensor.id}
            sensor={marker.sensor}
            position={marker.position}
            surfaceY={marker.surfaceY}
            selected={focusedSensor?.id === marker.sensor.id}
            flowMeterRotation={[0, -Math.PI / 2, 0]}
            onClick={() => onSensorFocus(marker.sensor)}
          />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
useGLTF.preload(LAKEBED_MODEL_URL);
