"use client";

import * as THREE from "three";
import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Cloud,
  Clouds,
  Environment,
  OrbitControls,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { MapIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

function GebelimModel({ showTerrain }: { showTerrain: boolean }) {
  const { nodes: categorizationNodes } = useGLTF("/countdown.glb") as any;
  const { nodes: terrainNodes } = useGLTF("/countup2.glb") as any;

  const categorizationTexture = useTexture("/textu/countdown.jpg");
  const terrainTexture = useTexture("/textu/countupper.jpg");

  categorizationTexture.flipY = false;
  terrainTexture.flipY = false;
  categorizationTexture.colorSpace = THREE.SRGBColorSpace;
  terrainTexture.colorSpace = THREE.SRGBColorSpace;

  const activeGeometry = showTerrain
    ? terrainNodes.gebelimraw.geometry
    : categorizationNodes.gebelimgreen.geometry;

  const activeTexture = showTerrain ? terrainTexture : categorizationTexture;

  useMemo(() => {
    activeGeometry.computeBoundingBox();
    activeGeometry.computeBoundingSphere();
  }, [activeGeometry]);

  return (
    <group position={[0, -2, 0]}>
      <mesh key={showTerrain ? "terrain" : "categorization"} geometry={activeGeometry}>
        <meshBasicMaterial map={activeTexture} toneMapped={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/countdown.glb");
useGLTF.preload("/countup2.glb");

export default function Page() {
  const controlsRef = useRef<any>(null);
  const [showTerrain, setShowTerrain] = useState(false);

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

      <button
        type="button"
        onClick={() => setShowTerrain((prev) => !prev)}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "12px 18px",
          background: "white",
          color: "black",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}
      >
        Switch to {showTerrain ? "Categorization" : "Terrain"}
      </button>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 20,
          zIndex: 10,
          transform: "translateX(-50%)",
          pointerEvents: "none",
          padding: "18px 24px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.72)",
          color: "#111",
          boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          backdropFilter: "blur(10px)",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          In construction phase
        </div>
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.72 }}>
          Gebelim 3D viewer preview
        </div>
      </div>

      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 80, 140], fov: 55, near: 1, far: 20000 }}
      >
        <Environment background="only" files="/skyy.hdr" />

        <group position={[30, 10, 0]}>
          <Clouds material={THREE.MeshBasicMaterial}>
            <Cloud
              concentrate="outside"
              speed={0.1}
              growth={100}
              color="#ffffff"
              opacity={1.25}
              seed={0.3}
              bounds={[1000, 100, 1000]}
              volume={400}
            />
          </Clouds>
        </group>

        <Suspense fallback={null}>
          <GebelimModel showTerrain={showTerrain} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[70, -2, -70]}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
