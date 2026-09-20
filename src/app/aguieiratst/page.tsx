"use client";

import * as THREE from "three";
import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const MODEL_URL = "/aguieiramodel-optimized.glb";

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function getFirstMaterial(
  material: THREE.Material | THREE.Material[] | undefined
) {
  if (!material) return null;
  return Array.isArray(material) ? material[0] ?? null : material;
}

function makeUnlitMaterialForMesh(mesh: THREE.Mesh) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const hasVertexColors = Boolean(geometry.getAttribute("color"));

  const oldMaterial = getFirstMaterial(mesh.material);
  const oldAsStandard = oldMaterial as THREE.MeshStandardMaterial | null;

  const materialColor =
    oldAsStandard?.color instanceof THREE.Color
      ? oldAsStandard.color.clone()
      : new THREE.Color(0x999999);

  const materialMap =
    oldAsStandard && "map" in oldAsStandard ? oldAsStandard.map : null;

  const opacity =
    typeof oldMaterial?.opacity === "number" ? oldMaterial.opacity : 1;

  const transparent = Boolean(oldMaterial?.transparent) || opacity < 1;

  return new THREE.MeshBasicMaterial({
    vertexColors: hasVertexColors,
    color: hasVertexColors ? 0xffffff : materialColor,
    map: hasVertexColors ? null : materialMap,
    transparent,
    opacity,
    depthWrite: !transparent,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function AguieiraModel() {
  const gltf = useGLTF(MODEL_URL);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;

      child.material = makeUnlitMaterialForMesh(child);
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    });

    return clonedScene;
  }, [gltf.scene]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

useGLTF.preload(MODEL_URL);

export default function Page() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Button
        asChild
        className="absolute right-5 top-5 z-20 rounded-lg border border-white/50 bg-white/90 text-black shadow-2xl backdrop-blur-md hover:bg-white"
      >
        <Link href="/maptest2">
          <MapIcon className="size-4" />
          Voltar ao mapa
        </Link>
      </Button>

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
          <AguieiraModel />
        </Suspense>

        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
