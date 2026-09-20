"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { VRButton } from "three/addons/webxr/VRButton.js";

function WebXRSetup() {
  const { gl } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;

    // Lower value = easier for Quest 3 to render.
    // Start conservative. Later try 0.85 or 1.0.
    gl.xr.setFramebufferScaleFactor(0.8);

    const button = VRButton.createButton(gl, {
      optionalFeatures: ["local-floor", "bounded-floor"],
    });

    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl]);

  return null;
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 1.4, -2);
  }, [camera]);

  return null;
}

function TestCube() {
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!cubeRef.current) return;

    cubeRef.current.rotation.y += delta * 0.6;
    cubeRef.current.rotation.x += delta * 0.25;
  });

  return (
    <mesh ref={cubeRef} position={[0, 1.35, -2]}>
      <boxGeometry args={[0.45, 0.45, 0.45]} />
      <meshBasicMaterial color={0x00d4ff} toneMapped={false} />
    </mesh>
  );
}

function SimpleScene() {
  return (
    <>
      <WebXRSetup />
      <CameraSetup />

      {/* Cloudy/HDR background only. No lighting contribution needed. */}
      <Suspense fallback={null}>
        <Environment background="only" files="/skyy.hdr" />
      </Suspense>

      {/* Simple cube in front of the user */}
      <TestCube />

      {/* Small reference floor, also unlit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial
          color={0x222222}
          transparent
          opacity={0.35}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
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
        background: "black",
      }}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{
          position: [0, 1.6, 3],
          fov: 70,
          near: 0.05,
          far: 100,
        }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000");
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <SimpleScene />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          background: "rgba(0,0,0,0.5)",
          padding: "10px 14px",
          borderRadius: 10,
          pointerEvents: "none",
        }}
      >
        Quest 3 WebXR test — press ENTER VR
      </div>
    </main>
  );
}