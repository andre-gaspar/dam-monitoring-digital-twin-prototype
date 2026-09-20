"use client";

import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { ARButton } from "three/addons/webxr/ARButton.js";

import {
  MeteorologiaLapa3DChart,
  METEOROLOGIA_SERIES_OPTIONS,
} from "@/components/MeteorologiaLapa3DChart";

function WebARSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    scene.background = null;
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;

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

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.4, -1.4);
  }, [camera]);

  return null;
}

function ARScene({
  seriesId,
  selectedLabel,
}: {
  seriesId: string;
  selectedLabel: string;
}) {
  return (
    <>
      <WebARSetup />
      <CameraSetup />

      <MeteorologiaLapa3DChart
        seriesId={seriesId}
        selectedLabel={selectedLabel}
        position={[0, 1.45, -1.35]}
        scale={1}
        limit={500}
      />
    </>
  );
}

export default function Page() {
  const [seriesIndex, setSeriesIndex] = useState(0);

  const selectedSeries = METEOROLOGIA_SERIES_OPTIONS[seriesIndex];

  function previousSeries() {
    setSeriesIndex((current) =>
      current === 0 ? METEOROLOGIA_SERIES_OPTIONS.length - 1 : current - 1
    );
  }

  function nextSeries() {
    setSeriesIndex((current) =>
      current === METEOROLOGIA_SERIES_OPTIONS.length - 1 ? 0 : current + 1
    );
  }

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
        <ARScene
          seriesId={selectedSeries.id}
          selectedLabel={selectedSeries.label}
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          background: "rgba(0,0,0,0.6)",
          padding: "12px 14px",
          borderRadius: 10,
          maxWidth: 420,
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Quest 3 AR 3D Meteorologia Chart
        </div>

        <div style={{ fontSize: 13, marginBottom: 10 }}>
          {selectedSeries.label}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={previousSeries}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "white",
              color: "black",
              fontWeight: 600,
            }}
          >
            Prev
          </button>

          <button
            onClick={nextSeries}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "white",
              color: "black",
              fontWeight: 600,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}