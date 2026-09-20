"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

type InteractionMode = "ray-drag" | "grab-scale";

type ModeButtonTarget = {
  id: string;
  label: string;
  mode?: InteractionMode;
  action?: "reset";
  ref: React.RefObject<THREE.Mesh | null>;
};

const INITIAL_CUBE_POSITION: [number, number, number] = [0, 0.11, -1.15];
const INITIAL_CUBE_SCALE = 1;

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.35, -1.2);
  }, [camera]);

  return null;
}

function ModeButton({
  label,
  active = false,
  position,
  meshRef,
  color,
}: {
  label: string;
  active?: boolean;
  position: [number, number, number];
  meshRef: React.RefObject<THREE.Mesh | null>;
  color: number;
}) {
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.34, 0.095, 0.035]} />
        <meshBasicMaterial
          color={active ? 0x22c55e : color}
          transparent
          opacity={active ? 1 : 0.88}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[0, 0, 0.024]}
        fontSize={0.032}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function ModePanel({
  mode,
  rayButtonRef,
  grabButtonRef,
  resetButtonRef,
}: {
  mode: InteractionMode;
  rayButtonRef: React.RefObject<THREE.Mesh | null>;
  grabButtonRef: React.RefObject<THREE.Mesh | null>;
  resetButtonRef: React.RefObject<THREE.Mesh | null>;
}) {
  return (
    <group position={[0.58, 0.24, -0.95]} rotation={[0, -0.35, 0]}>
      <mesh position={[0, 0, -0.025]}>
        <planeGeometry args={[0.46, 0.48]} />
        <meshBasicMaterial
          color={0x020617}
          transparent
          opacity={0.86}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[0, 0.18, 0.02]}
        fontSize={0.034}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Input Mode
      </Text>

      <ModeButton
        label="RAY DRAG"
        active={mode === "ray-drag"}
        position={[0, 0.075, 0.02]}
        meshRef={rayButtonRef}
        color={0x2563eb}
      />

      <ModeButton
        label="GRAB+SCALE"
        active={mode === "grab-scale"}
        position={[0, -0.055, 0.02]}
        meshRef={grabButtonRef}
        color={0x7c3aed}
      />

      <ModeButton
        label="RESET"
        position={[0, -0.185, 0.02]}
        meshRef={resetButtonRef}
        color={0xef4444}
      />
    </group>
  );
}

function TestCube({
  cubeRef,
  mode,
}: {
  cubeRef: React.RefObject<THREE.Mesh | null>;
  mode: InteractionMode;
}) {
  return (
    <mesh
      ref={cubeRef}
      position={INITIAL_CUBE_POSITION}
      scale={INITIAL_CUBE_SCALE}
    >
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      <meshBasicMaterial
        color={mode === "ray-drag" ? 0x38bdf8 : 0xa855f7}
        toneMapped={false}
      />
    </mesh>
  );
}

function HandInputSystem({
  mode,
  onModeChange,
  cubeRef,
  buttons,
}: {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  cubeRef: React.RefObject<THREE.Mesh | null>;
  buttons: ModeButtonTarget[];
}) {
  const { gl, scene } = useThree();

  const modeRef = useRef<InteractionMode>(mode);
  const handPointersRef = useRef<any[]>([]);
  const handsRef = useRef<any[]>([]);

  const rayAttachedPointerRef = useRef<any | null>(null);
  const directGrabHandIndexRef = useRef<number | null>(null);
  const originalParentRef = useRef<THREE.Object3D | null>(null);

  const scalingRef = useRef({
    active: false,
    initialDistance: 0,
    initialScale: 1,
  });

  const pointerButtonLatchRef = useRef<Map<any, string>>(new Map());
  const fingerButtonPressedRef = useRef<Set<string>>(new Set());

  const tmpVec1 = useRef(new THREE.Vector3());
  const tmpVec2 = useRef(new THREE.Vector3());
  const tmpBox = useRef(new THREE.Box3());

  function resetCube() {
    const cube = cubeRef.current;
    if (!cube) return;

    scene.attach(cube);
    cube.position.set(...INITIAL_CUBE_POSITION);
    cube.rotation.set(0, 0, 0);
    cube.scale.setScalar(INITIAL_CUBE_SCALE);

    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    directGrabHandIndexRef.current = null;
    originalParentRef.current = cube.parent;
    scalingRef.current.active = false;
  }

  function detachCubeIfNeeded() {
    const cube = cubeRef.current;
    if (!cube) return;

    if (rayAttachedPointerRef.current || directGrabHandIndexRef.current !== null) {
      scene.attach(cube);
    }

    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    directGrabHandIndexRef.current = null;
    scalingRef.current.active = false;
  }

  function setModeSafely(nextMode: InteractionMode) {
    modeRef.current = nextMode;
    detachCubeIfNeeded();
    onModeChange(nextMode);
  }

  function triggerButton(button: ModeButtonTarget) {
    if (button.action === "reset") {
      resetCube();
      return;
    }

    if (button.mode) {
      setModeSafely(button.mode);
    }
  }

  function getIndexTip(hand: any): THREE.Object3D | null {
    return hand?.joints?.["index-finger-tip"] ?? null;
  }

  function getCubeRadius(cube: THREE.Mesh) {
    cube.geometry.computeBoundingSphere();

    const radius = cube.geometry.boundingSphere?.radius ?? 0.18;
    return radius * cube.scale.x * 1.35;
  }

  function getPinchedHands() {
    return handsRef.current.map((hand) => {
      const tip = getIndexTip(hand);
      const thumb = hand?.joints?.["thumb-tip"] ?? null;

      if (!tip || !thumb) return false;

      const tipPos = tip.getWorldPosition(tmpVec1.current);
      const thumbPos = thumb.getWorldPosition(tmpVec2.current);

      return tipPos.distanceTo(thumbPos) < 0.035;
    });
  }

  function updatePhysicalButtonPresses() {
    const currentPressed = new Set<string>();

    handsRef.current.forEach((hand, handIndex) => {
      const indexTip = getIndexTip(hand);
      if (!indexTip) return;

      const tipPos = indexTip.getWorldPosition(tmpVec1.current);

      buttons.forEach((button) => {
        const mesh = button.ref.current;
        if (!mesh) return;

        tmpBox.current.setFromObject(mesh);
        tmpBox.current.expandByScalar(0.015);

        const key = `${handIndex}-${button.id}`;

        if (tmpBox.current.containsPoint(tipPos)) {
          currentPressed.add(key);

          if (!fingerButtonPressedRef.current.has(key)) {
            triggerButton(button);
          }
        }
      });
    });

    fingerButtonPressedRef.current = currentPressed;
  }

  function updatePointerButtonPresses() {
    const handPointers = handPointersRef.current;

    for (const handPointer of handPointers) {
        let closestButton: ModeButtonTarget | null = null;
        let closestDistance = Infinity;

        for (const button of buttons) {
        const mesh = button.ref.current;
        if (!mesh) continue;

        const intersections = handPointer.intersectObject(mesh, false);

        if (intersections?.length && intersections[0].distance < closestDistance) {
            closestDistance = intersections[0].distance;
            closestButton = button;
        }
        }

        if (closestButton !== null) {
        handPointer.setCursor?.(closestDistance);

        if (handPointer.isPinched?.()) {
            if (!pointerButtonLatchRef.current.has(handPointer)) {
            pointerButtonLatchRef.current.set(handPointer, closestButton.id);
            triggerButton(closestButton);
            }
        } else {
            pointerButtonLatchRef.current.delete(handPointer);
        }
        } else if (!handPointer.isPinched?.()) {
        pointerButtonLatchRef.current.delete(handPointer);
        }
    }
  }

  function updateRayDragMode() {
    const cube = cubeRef.current;
    if (!cube) return;

    const attachedPointer = rayAttachedPointerRef.current;

    if (attachedPointer) {
      if (!attachedPointer.isPinched?.()) {
        scene.attach(cube);
        attachedPointer.setAttached?.(false);
        rayAttachedPointerRef.current = null;
      }

      return;
    }

    for (const handPointer of handPointersRef.current) {
      const intersections = handPointer.intersectObject(cube, false);

      if (intersections?.length) {
        handPointer.setCursor?.(intersections[0].distance);

        if (handPointer.isPinched?.() && !handPointer.isAttached?.()) {
          originalParentRef.current = cube.parent;

          const attachNode = handPointer.children?.[0] ?? handPointer;
          attachNode.attach(cube);

          handPointer.setAttached?.(true);
          rayAttachedPointerRef.current = handPointer;
          break;
        }
      } else {
        handPointer.setCursor?.(1.5);
      }
    }
  }

  function updateDirectGrabScaleMode() {
    const cube = cubeRef.current;
    if (!cube) return;

    const pinchedHands = getPinchedHands();

    if (directGrabHandIndexRef.current !== null) {
      const grabHandIndex = directGrabHandIndexRef.current;
      const grabHand = handsRef.current[grabHandIndex];

      if (!pinchedHands[grabHandIndex]) {
        scene.attach(cube);
        directGrabHandIndexRef.current = null;
        scalingRef.current.active = false;
        return;
      }

      const otherHandIndex = grabHandIndex === 0 ? 1 : 0;
      const otherHand = handsRef.current[otherHandIndex];

      if (pinchedHands[otherHandIndex] && grabHand && otherHand) {
        const grabTip = getIndexTip(grabHand);
        const otherTip = getIndexTip(otherHand);

        if (grabTip && otherTip) {
          const p1 = grabTip.getWorldPosition(tmpVec1.current);
          const p2 = otherTip.getWorldPosition(tmpVec2.current);
          const distance = p1.distanceTo(p2);

          if (!scalingRef.current.active) {
            scalingRef.current.active = true;
            scalingRef.current.initialDistance = distance;
            scalingRef.current.initialScale = cube.scale.x;
          } else if (scalingRef.current.initialDistance > 0) {
            const factor = distance / scalingRef.current.initialDistance;

            const nextScale = THREE.MathUtils.clamp(
              scalingRef.current.initialScale * factor,
              0.25,
              3.5
            );

            cube.scale.setScalar(nextScale);
          }
        }
      } else {
        scalingRef.current.active = false;
      }

      return;
    }

    handsRef.current.forEach((hand, handIndex) => {
      const indexTip = getIndexTip(hand);
      if (!indexTip || !pinchedHands[handIndex]) return;
      if (directGrabHandIndexRef.current !== null) return;

      const tipPos = indexTip.getWorldPosition(tmpVec1.current);
      const cubePos = cube.getWorldPosition(tmpVec2.current);
      const distance = tipPos.distanceTo(cubePos);

      if (distance < getCubeRadius(cube)) {
        originalParentRef.current = cube.parent;
        indexTip.attach(cube);
        directGrabHandIndexRef.current = handIndex;
        scalingRef.current.active = false;
      }
    });
  }

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    scene.background = null;
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;

    const button = ARButton.createButton(gl, {
      requiredFeatures: ["local-floor", "hand-tracking"],
      optionalFeatures: ["bounded-floor", "hit-test"],
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

    handsRef.current = [hand1, hand2];
    handPointersRef.current = [handPointer1, handPointer2];

    return () => {
      button.remove();

      scene.remove(hand1);
      scene.remove(hand2);
      scene.remove(controller1);
      scene.remove(controller2);

      handsRef.current = [];
      handPointersRef.current = [];

      rayAttachedPointerRef.current?.setAttached?.(false);
      rayAttachedPointerRef.current = null;
      directGrabHandIndexRef.current = null;

      gl.xr.enabled = false;
    };
  }, [gl, scene]);

  useFrame(() => {
    updatePhysicalButtonPresses();
    updatePointerButtonPresses();

    if (modeRef.current === "ray-drag") {
      updateRayDragMode();
    } else {
      updateDirectGrabScaleMode();
    }
  });

  return null;
}

function ARScene({
  mode,
  setMode,
}: {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
}) {
  const cubeRef = useRef<THREE.Mesh | null>(null);

  const rayButtonRef = useRef<THREE.Mesh | null>(null);
  const grabButtonRef = useRef<THREE.Mesh | null>(null);
  const resetButtonRef = useRef<THREE.Mesh | null>(null);

  const buttons: ModeButtonTarget[] = [
    {
      id: "ray",
      label: "RAY DRAG",
      mode: "ray-drag",
      ref: rayButtonRef,
    },
    {
      id: "grab",
      label: "GRAB+SCALE",
      mode: "grab-scale",
      ref: grabButtonRef,
    },
    {
      id: "reset",
      label: "RESET",
      action: "reset",
      ref: resetButtonRef,
    },
  ];

  return (
    <>
      <CameraSetup />

      <HandInputSystem
        mode={mode}
        onModeChange={setMode}
        cubeRef={cubeRef}
        buttons={buttons}
      />

      <TestCube cubeRef={cubeRef} mode={mode} />

      <ModePanel
        mode={mode}
        rayButtonRef={rayButtonRef}
        grabButtonRef={grabButtonRef}
        resetButtonRef={resetButtonRef}
      />

      <Text
        position={[0, 1.68, -1.15]}
        fontSize={0.045}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {mode === "ray-drag"
          ? "Mode: Point + pinch to drag cube"
          : "Mode: Pinch cube to grab. Pinch other hand to scale."}
      </Text>
    </>
  );
}

export default function Page() {
  const [mode, setMode] = useState<InteractionMode>("ray-drag");

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
        <ARScene mode={mode} setMode={setMode} />
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
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Quest 3 AR Hand Input Test
        </div>

        <div style={{ fontSize: 13 }}>
          Current mode: <b>{mode}</b>
          <br />
          Press the 3D buttons beside the cube to switch modes.
          <br />
          Ray mode: point + pinch.
          <br />
          Grab mode: pinch cube directly; second pinch scales.
        </div>
      </div>
    </main>
  );
}