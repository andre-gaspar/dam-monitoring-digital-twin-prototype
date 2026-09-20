"use client";

import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ARButton } from "three/addons/webxr/ARButton.js";

function WebARSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    // Important for passthrough: transparent WebGL background
    scene.background = null;
    gl.setClearAlpha(0);

    const button = ARButton.createButton(gl, {
      optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
    });

    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl, scene]);

  return null;
}

function TestCube() {
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!cubeRef.current) return;

    cubeRef.current.rotation.y += delta * 0.8;
    cubeRef.current.rotation.x += delta * 0.35;
  });

  return (
    <mesh ref={cubeRef} position={[0, 1.4, -1.5]}>
      <boxGeometry args={[0.35, 0.35, 0.35]} />
      <meshBasicMaterial color={0x00d4ff} toneMapped={false} />
    </mesh>
  );
}

function ARScene() {
  return (
    <>
      <WebARSetup />

      {/* No lights, no HDR background, no sky.
          The real world passthrough should appear behind this. */}
      <TestCube />
    </>
  );
}

export default function Page() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{
          position: [0, 1.6, 0],
          fov: 70,
          near: 0.05,
          far: 20,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.xr.enabled = true;
          gl.setClearAlpha(0);
          gl.toneMapping = THREE.NoToneMapping;
          scene.background = null;
        }}
      >
        <ARScene />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          background: "rgba(0,0,0,0.55)",
          padding: "10px 14px",
          borderRadius: 10,
          pointerEvents: "none",
        }}
      >
        Quest 3 passthrough AR test — press START AR
      </div>
    </main>
  );
}