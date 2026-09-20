"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Cloud, Clouds } from "@react-three/drei";

type RainCloudLayerProps = {
  rainIntensity: number;
  position: [number, number, number];
  bounds: [number, number, number];
};

export function RainCloudLayer({
  rainIntensity,
  position,
  bounds,
}: RainCloudLayerProps) {
  const safeIntensity = THREE.MathUtils.clamp(rainIntensity, 0, 1);
  const cloudScale = 0.1;

  const cloudColor = useMemo(() => {
    const color = new THREE.Color("#ffffff").lerp(
      new THREE.Color("#49515d"),
      safeIntensity
    );

    return `#${color.getHexString()}`;
  }, [safeIntensity]);

  const cloudPuffScale = THREE.MathUtils.lerp(0.35, 1.35, cloudScale);
  const cloudVolume = 260;
  const cloudGrowth = THREE.MathUtils.lerp(58, 120, cloudScale);
  const cloudOpacity = THREE.MathUtils.lerp(0.38, 1.28, safeIntensity);
  const driftSpeed = THREE.MathUtils.lerp(0.035, 0.11, safeIntensity);

  return (
    <group position={position}>
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud
          concentrate="outside"
          speed={driftSpeed}
          growth={cloudGrowth}
          color={cloudColor}
          opacity={cloudOpacity}
          seed={0.3}
          bounds={bounds}
          scale={cloudPuffScale}
          volume={cloudVolume}
        />
        <Cloud
          concentrate="outside"
          speed={driftSpeed * 0.72}
          growth={cloudGrowth * 0.72}
          color={cloudColor}
          opacity={cloudOpacity * 0.72}
          seed={2.1}
          bounds={[
            bounds[0] * 0.72,
            bounds[1] * 0.65,
            bounds[2] * 0.72,
          ]}
          scale={cloudPuffScale * 0.82}
          volume={cloudVolume * 0.45}
          position={[0, -bounds[1] * 0.14, 0]}
        />
      </Clouds>
    </group>
  );
}
