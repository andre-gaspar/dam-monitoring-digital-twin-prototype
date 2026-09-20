"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

import {
  MeteorologiaLapa3DChart,
  METEOROLOGIA_SERIES_OPTIONS,
} from "@/components/MeteorologiaLapa3DChart";

function HandPointerDragSetup({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Group | null>;
}) {
  const { gl, scene } = useThree();

  const handPointersRef = useRef<any[]>([]);
  const attachedPointerRef = useRef<any | null>(null);
  const originalParentRef = useRef<THREE.Object3D | null>(null);

  const tmpPosition1 = useRef(new THREE.Vector3());
  const tmpPosition2 = useRef(new THREE.Vector3());

  const scaleStateRef = useRef({
    active: false,
    initialDistance: 0,
    initialScale: 1,
  });

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    scene.background = null;
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;

    const button = ARButton.createButton(gl, {
      requiredFeatures: ["hand-tracking"],
      optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
    });

    document.body.appendChild(button);

    const controller1 = gl.xr.getController(0);
    const controller2 = gl.xr.getController(1);

    scene.add(controller1);
    scene.add(controller2);

    const hand1 = gl.xr.getHand(0);
    hand1.add(new OculusHandModel(hand1));

    const handPointer1 = new OculusHandPointerModel(hand1, controller1);
    hand1.add(handPointer1);

    scene.add(hand1);

    const hand2 = gl.xr.getHand(1);
    hand2.add(new OculusHandModel(hand2));

    const handPointer2 = new OculusHandPointerModel(hand2, controller2);
    hand2.add(handPointer2);

    scene.add(hand2);

    handPointersRef.current = [handPointer1, handPointer2];

    return () => {
      button.remove();

      scene.remove(hand1);
      scene.remove(hand2);
      scene.remove(controller1);
      scene.remove(controller2);

      handPointersRef.current = [];
      attachedPointerRef.current = null;
      originalParentRef.current = null;

      gl.xr.enabled = false;
    };
  }, [gl, scene]);

  useFrame(() => {
    const target = targetRef.current;
    if (!target) return;

    const handPointers = handPointersRef.current;
    if (handPointers.length === 0) return;

    const attachedPointer = attachedPointerRef.current;

    // If the chart is attached to a hand pointer, keep it attached until pinch is released.
    if (attachedPointer) {
      if (!attachedPointer.isPinched()) {
        if (originalParentRef.current) {
          originalParentRef.current.attach(target);
        }

        attachedPointer.setAttached?.(false);
        attachedPointerRef.current = null;
        scaleStateRef.current.active = false;
        return;
      }

      // Optional two-hand scaling:
      // While one hand is dragging, pinch the other hand too and move hands apart/together.
      const otherPointer = handPointers.find((hp) => hp !== attachedPointer);

      if (otherPointer?.isPinched?.()) {
        attachedPointer.getWorldPosition(tmpPosition1.current);
        otherPointer.getWorldPosition(tmpPosition2.current);

        const currentDistance = tmpPosition1.current.distanceTo(
          tmpPosition2.current
        );

        if (!scaleStateRef.current.active) {
          scaleStateRef.current.active = true;
          scaleStateRef.current.initialDistance = currentDistance;
          scaleStateRef.current.initialScale = target.scale.x;
        } else if (scaleStateRef.current.initialDistance > 0) {
          const scaleFactor =
            currentDistance / scaleStateRef.current.initialDistance;

          const nextScale = THREE.MathUtils.clamp(
            scaleStateRef.current.initialScale * scaleFactor,
            0.35,
            2.5
          );

          target.scale.setScalar(nextScale);
        }
      } else {
        scaleStateRef.current.active = false;
      }

      return;
    }

    // If not attached, test both hand pointers against the chart/tablet.
    for (const handPointer of handPointers) {
      const intersections = handPointer.intersectObject(target, true);

      if (intersections && intersections.length > 0) {
        const distance = intersections[0].distance;

        handPointer.setCursor?.(distance);

        if (handPointer.isPinched?.() && !handPointer.isAttached?.()) {
          originalParentRef.current = target.parent;

          const attachNode = handPointer.children?.[0] ?? handPointer;
          attachNode.attach(target);

          attachedPointerRef.current = handPointer;
          handPointer.setAttached?.(true);

          scaleStateRef.current.active = false;
        }
      } else {
        handPointer.setCursor?.(1.5);
      }
    }
  });

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
  const chartGroupRef = useRef<THREE.Group | null>(null);

  return (
    <>
      <CameraSetup />
      <HandPointerDragSetup targetRef={chartGroupRef} />

      <group ref={chartGroupRef}>
        <MeteorologiaLapa3DChart
          seriesId={seriesId}
          selectedLabel={selectedLabel}
          position={[0, 1.45, -1.35]}
          scale={1}
          limit={500}
        />
      </group>
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
          maxWidth: 460,
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Quest 3 AR 3D Meteorologia Chart
        </div>

        <div style={{ fontSize: 13, marginBottom: 10 }}>
          {selectedSeries.label}
        </div>

        <div style={{ fontSize: 12, marginBottom: 10, color: "#d1d5db" }}>
          Point at chart + pinch: drag
          <br />
          While dragging, pinch other hand too: scale
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