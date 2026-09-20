"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Water } from "three-stdlib";
import {
  WATER_ROTATION_Y,
  WATER_SIZE_X,
  WATER_SIZE_Z,
} from "./constants";

type OceanProps = {
  position?: [number, number, number];
};

export function Ocean({ position = [0, 0, 0] }: OceanProps) {
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpg");

  waterNormals.wrapS = THREE.RepeatWrapping;
  waterNormals.wrapT = THREE.RepeatWrapping;
  waterNormals.colorSpace = THREE.NoColorSpace;

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(WATER_SIZE_X, WATER_SIZE_Z),
    []
  );

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      alpha: 0.58,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x3399ff,
      distortionScale: 3.7,
      fog: false,
    }),
    [waterNormals]
  );

  const water = useMemo(() => {
    const waterObject = new Water(geometry, config);

    waterObject.material.transparent = true;
    waterObject.material.depthWrite = false;
    waterObject.material.toneMapped = false;
    waterObject.raycast = () => {};

    return waterObject;
  }, [geometry, config]);

  const ref = useRef<THREE.Object3D>(null!);

  useFrame((_, delta) => {
    if (water.material.uniforms.time) {
      water.material.uniforms.time.value += delta;
    }
  });

  return (
    <group position={position}>
      <group rotation={[0, WATER_ROTATION_Y, 0]}>
        <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />
      </group>
    </group>
  );
}
