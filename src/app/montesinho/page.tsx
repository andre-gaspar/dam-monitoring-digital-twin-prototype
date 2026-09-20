"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function VertexColorModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  const scene = React.useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  React.useEffect(() => {
    scene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;
      const hasVertexColors = Boolean(geometry.getAttribute("color"));

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else if (child.material) {
        child.material.dispose();
      }

      child.material = new THREE.MeshBasicMaterial({
        vertexColors: hasVertexColors,
        color: hasVertexColors ? 0xffffff : 0x999999,
        side: THREE.DoubleSide,
      });

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
  }, [scene]);

  return <primitive object={scene} />;
}

export default function TerrainTestPage() {
  const [modelUrl, setModelUrl] = React.useState("/nochilling.glb");

  return (
    <main className="h-screen w-screen bg-neutral-950 text-white">
      <div className="absolute left-4 top-4 z-10 w-[360px] rounded-xl bg-black/70 p-4 shadow-lg backdrop-blur">
        <h1 className="mb-2 text-lg font-semibold">Vertex Color GLB Test</h1>

        <p className="mb-3 text-sm text-neutral-300">
          Loads a GLB, replaces all mesh materials with unlit vertex-color
          materials, and disables shadows.
        </p>

        <label className="mb-1 block text-xs text-neutral-400">
          Model path
        </label>

        <input
          value={modelUrl}
          onChange={(e) => setModelUrl(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
        />

        <p className="mt-3 text-xs text-neutral-400">
          Example: <code>/models/terrain.glb</code>
        </p>
      </div>

      <Canvas
        shadows={false}
        camera={{
          position: [500, -900, 500],
          fov: 45,
          near: 0.1,
          far: 100000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#111111"]} />

        <React.Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <VertexColorModel url={modelUrl} />
          </Bounds>
        </React.Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={10000}
        />

        <gridHelper args={[1000, 20]} />
        <axesHelper args={[100]} />
      </Canvas>
    </main>
  );
}