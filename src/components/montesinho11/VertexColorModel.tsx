"use client";

import * as THREE from "three";
import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { isMesh, makeUnlitMaterialForMesh } from "./utils";

type VertexColorModelProps = {
  url: string;
  modelRef?: React.RefObject<THREE.Object3D | null>;
  onTerrainPick?: (worldPoint: THREE.Vector3) => void;
};

export function VertexColorModel({ url, modelRef }: VertexColorModelProps) {
  const gltf = useGLTF(url);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;
      const { material, hasVertexColors } = makeUnlitMaterialForMesh(child);

      child.material = material;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      console.log(child.name || "mesh", {
        hasVertexColors,
        vertexCount: geometry.getAttribute("position")?.count,
        colorCount: geometry.getAttribute("color")?.count,
      });
    });

    return clonedScene;
  }, [gltf.scene]);

  return <primitive ref={modelRef} object={scene} />;
}
