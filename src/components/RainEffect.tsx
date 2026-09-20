"use client";

import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

type RainEffectProps = {
  enabled?: boolean;

  /**
   * 0 = no rain
   * 1 = maximum rain
   */
  intensity?: number;

  /**
   * Center of the rain volume in your Three.js local scene coordinates.
   */
  areaCenter?: [number, number, number];

  /**
   * Width, height, depth of the rain volume.
   */
  areaSize?: [number, number, number];

  dropCount?: number;
  dropLength?: number;
  fallSpeed?: number;
  wind?: [number, number];
  opacity?: number;
  color?: THREE.ColorRepresentation;

  /**
   * Splash / ripple settings.
   * These defaults match your current water:
   * WATER_POSITION = [45, 13.8125, -150]
   * WATER_SIZE_X = 90
   * WATER_SIZE_Z = 150
   */
  splashesEnabled?: boolean;
  waterSurfaceY?: number;
  waterCenter?: [number, number];
  waterSize?: [number, number];
  rippleCount?: number;
  rippleColor?: THREE.ColorRepresentation;
};

type RainDropData = {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  speed: Float32Array;
  length: Float32Array;
};

type RippleData = {
  active: boolean;
  x: number;
  z: number;
  age: number;
  maxAge: number;
  startScale: number;
  endScale: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function RainEffect({
  enabled = true,
  intensity = 0.65,
  areaCenter = [45, 38, -95],
  areaSize = [170, 80, 210],
  dropCount = 3500,
  dropLength = 2.8,
  fallSpeed = 38,
  wind = [3.5, -1.2],
  opacity = 0.42,
  color = 0xbfdcff,

  splashesEnabled = true,
  waterSurfaceY = 13.8125,
  waterCenter = [45, -150],
  waterSize = [90, 150],
  rippleCount = 90,
  rippleColor = 0xdff6ff,
}: RainEffectProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const rippleMeshRef = useRef<THREE.InstancedMesh>(null);

  const nextRippleIndexRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const safeIntensity = THREE.MathUtils.clamp(intensity, 0, 1);

  const rainGeometry = useMemo(() => {
    const positions = new Float32Array(dropCount * 2 * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, dropCount * 2);

    return geometry;
  }, [dropCount]);

  const rainMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
  }, [color, opacity]);

  const drops = useMemo<RainDropData>(() => {
    const x = new Float32Array(dropCount);
    const y = new Float32Array(dropCount);
    const z = new Float32Array(dropCount);
    const speed = new Float32Array(dropCount);
    const length = new Float32Array(dropCount);

    const [centerX, centerY, centerZ] = areaCenter;
    const [sizeX, sizeY, sizeZ] = areaSize;

    const halfX = sizeX / 2;
    const halfZ = sizeZ / 2;
    const topY = centerY + sizeY / 2;
    const bottomY = centerY - sizeY / 2;

    for (let i = 0; i < dropCount; i++) {
      x[i] = randomBetween(centerX - halfX, centerX + halfX);
      y[i] = randomBetween(bottomY, topY);
      z[i] = randomBetween(centerZ - halfZ, centerZ + halfZ);

      speed[i] = randomBetween(0.7, 1.35);
      length[i] = dropLength * randomBetween(0.65, 1.35);
    }

    return { x, y, z, speed, length };
  }, [dropCount, areaCenter, areaSize, dropLength]);

  const rippleGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(0.72, 1.0, 32);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);

  const rippleMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: rippleColor,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }, [rippleColor]);

  const ripples = useMemo<RippleData[]>(() => {
    return Array.from({ length: rippleCount }, () => ({
      active: false,
      x: 0,
      z: 0,
      age: 999,
      maxAge: 0.7,
      startScale: 0.2,
      endScale: 2.6,
    }));
  }, [rippleCount]);

  function isInsideWater(x: number, z: number) {
    const [waterX, waterZ] = waterCenter;
    const [waterSizeX, waterSizeZ] = waterSize;

    return (
      x >= waterX - waterSizeX / 2 &&
      x <= waterX + waterSizeX / 2 &&
      z >= waterZ - waterSizeZ / 2 &&
      z <= waterZ + waterSizeZ / 2
    );
  }

  function spawnRipple(x: number, z: number) {
    if (!splashesEnabled) return;

    const index = nextRippleIndexRef.current;
    const ripple = ripples[index];

    ripple.active = true;
    ripple.x = x;
    ripple.z = z;
    ripple.age = 0;
    ripple.maxAge = randomBetween(0.55, 0.95);
    ripple.startScale = randomBetween(0.06, 0.12);//0.12, 0.28
    ripple.endScale = randomBetween(0.45, 1.15);//1.4, 3.2

    nextRippleIndexRef.current = (index + 1) % rippleCount;
  }

  useFrame((_, delta) => {
    if (!linesRef.current) return;

    const visible = enabled && safeIntensity > 0.001;

    linesRef.current.visible = visible;

    if (rippleMeshRef.current) {
      rippleMeshRef.current.visible = visible && splashesEnabled;
    }

    if (!visible) return;

    const visibleDropCount = Math.floor(dropCount * safeIntensity);
    rainGeometry.setDrawRange(0, visibleDropCount * 2);

    rainMaterial.opacity = opacity * THREE.MathUtils.lerp(0.35, 1, safeIntensity);
    rippleMaterial.opacity = 0.24 * THREE.MathUtils.lerp(0.45, 1, safeIntensity);

    const positionAttribute = rainGeometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    const positions = positionAttribute.array as Float32Array;

    const [centerX, centerY, centerZ] = areaCenter;
    const [sizeX, sizeY, sizeZ] = areaSize;

    const halfX = sizeX / 2;
    const halfZ = sizeZ / 2;

    const minX = centerX - halfX;
    const maxX = centerX + halfX;
    const minZ = centerZ - halfZ;
    const maxZ = centerZ + halfZ;

    const topY = centerY + sizeY / 2;
    const bottomY = centerY - sizeY / 2;

    const speedMultiplier = THREE.MathUtils.lerp(0.55, 1.55, safeIntensity);

    let splashesThisFrame = 0;
    const maxSplashesPerFrame = Math.floor(2 + safeIntensity * 10);

    for (let i = 0; i < visibleDropCount; i++) {
      const previousY = drops.y[i];

      drops.y[i] -= fallSpeed * drops.speed[i] * speedMultiplier * delta;
      drops.x[i] += wind[0] * delta;
      drops.z[i] += wind[1] * delta;

      const crossedWaterSurface =
        previousY > waterSurfaceY && drops.y[i] <= waterSurfaceY;

      if (
        splashesEnabled &&
        crossedWaterSurface &&
        isInsideWater(drops.x[i], drops.z[i]) &&
        splashesThisFrame < maxSplashesPerFrame &&
        Math.random() < 0.4
      ) {
        spawnRipple(drops.x[i], drops.z[i]);
        splashesThisFrame++;
      }

      if (
        drops.y[i] < bottomY ||
        drops.x[i] < minX ||
        drops.x[i] > maxX ||
        drops.z[i] < minZ ||
        drops.z[i] > maxZ ||
        (crossedWaterSurface && isInsideWater(drops.x[i], drops.z[i]))
      ) {
        drops.x[i] = randomBetween(minX, maxX);
        drops.y[i] = randomBetween(topY, topY + sizeY * 0.25);
        drops.z[i] = randomBetween(minZ, maxZ);
      }

      const j = i * 6;

      positions[j + 0] = drops.x[i];
      positions[j + 1] = drops.y[i];
      positions[j + 2] = drops.z[i];

      positions[j + 3] = drops.x[i] - wind[0] * 0.09;
      positions[j + 4] = drops.y[i] - drops.length[i];
      positions[j + 5] = drops.z[i] - wind[1] * 0.09;
    }

    positionAttribute.needsUpdate = true;

    const rippleMesh = rippleMeshRef.current;

    if (rippleMesh) {
      for (let i = 0; i < rippleCount; i++) {
        const ripple = ripples[i];

        if (ripple.active) {
          ripple.age += delta;

          const t = THREE.MathUtils.clamp(ripple.age / ripple.maxAge, 0, 1);
          const scale = THREE.MathUtils.lerp(
            ripple.startScale,
            ripple.endScale,
            t
          );

          dummy.position.set(ripple.x, waterSurfaceY + 0.055, ripple.z);
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();

          if (t >= 1) {
            ripple.active = false;
          }
        } else {
          dummy.position.set(0, -9999, 0);
          dummy.scale.set(0.0001, 0.0001, 0.0001);
          dummy.updateMatrix();
        }

        rippleMesh.setMatrixAt(i, dummy.matrix);
      }

      rippleMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments
        ref={linesRef}
        geometry={rainGeometry}
        material={rainMaterial}
        frustumCulled={false}
        renderOrder={20}
      />

      <instancedMesh
        ref={rippleMeshRef}
        args={[rippleGeometry, rippleMaterial, rippleCount]}
        frustumCulled={false}
        renderOrder={21}
      />
    </>
  );
}