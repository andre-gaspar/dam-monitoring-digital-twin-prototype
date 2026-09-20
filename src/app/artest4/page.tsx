"use client";

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

import {
  MeteorologiaLapa3DChart,
  METEOROLOGIA_SERIES_OPTIONS,
} from "@/components/MeteorologiaLapa3DChart";

type InteractionMode = "ray-drag" | "grab-scale";

type ModeButtonTarget = {
  id: string;
  label: string;
  mode?: InteractionMode;
  action?: "reset";
  ref: React.RefObject<THREE.Mesh | null>;
};

type DraggableTarget = {
  id: string;
  label: string;
  ref: React.RefObject<THREE.Group | null>;
  colliderRef: React.RefObject<THREE.Mesh | null>;
  initialPosition: [number, number, number];
  initialScale: number;
};

const DRONE_MODEL_URL = "/droner.glb";

// If Quest AR origin feels like eye-level instead of floor-level, try -1.55.
const FLOOR_OFFSET_Y = 0;

const CHART_INITIAL_POSITION: [number, number, number] = [
  -0.45,
  FLOOR_OFFSET_Y + 0.56,
  -1.35,
];

const DRONE_INITIAL_POSITION: [number, number, number] = [
  0.55,
  FLOOR_OFFSET_Y + 0.0,
  -1.25,
];

const CHART_INITIAL_SCALE = 0.72;
const DRONE_INITIAL_SCALE = 1;

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.2, -1.3);
  }, [camera]);

  return null;
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function InvisibleCollider({
  colliderRef,
  args,
  position = [0, 0, 0],
}: {
  colliderRef: React.RefObject<THREE.Mesh | null>;
  args: [number, number, number];
  position?: [number, number, number];
}) {
  return (
    <mesh ref={colliderRef} position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial
        color={0xffffff}
        wireframe
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function VertexColorDroneModel({
  url,
  maxSize = 0.65,
}: {
  url: string;
  maxSize?: number;
}) {
  const gltf = useGLTF(url);

  const { scene, scale } = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;
      const hasVertexColors = Boolean(geometry.getAttribute("color"));

      child.material = new THREE.MeshBasicMaterial({
        vertexColors: hasVertexColors,
        color: hasVertexColors ? 0xffffff : 0x999999,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      // Important: prevent expensive raycasts on the heavy GLB geometry.
      // We raycast only against the invisible low-poly collider.
      child.raycast = () => {};

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    });

    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const largestSide = Math.max(size.x, size.y, size.z) || 1;
    const finalScale = maxSize / largestSide;

    // Normalize model:
    // X/Z centered around the group origin.
    // Bottom sits at local Y = 0.
    clonedScene.position.set(-center.x, -box.min.y, -center.z);

    return {
      scene: clonedScene,
      scale: finalScale,
    };
  }, [gltf.scene, maxSize]);

  return (
    <group scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function ModeButton({
  label,
  active = false,
  pressed = false,
  position,
  meshRef,
  color,
  width = 0.34,
}: {
  label: string;
  active?: boolean;
  pressed?: boolean;
  position: [number, number, number];
  meshRef: React.RefObject<THREE.Mesh | null>;
  color: number;
  width?: number;
}) {
  const isPressed = active || pressed;
  const faceZ = isPressed ? 0.012 : 0.024;

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0, isPressed ? -0.012 : 0]}>
        <boxGeometry args={[width, 0.095, isPressed ? 0.024 : 0.035]} />
        <meshBasicMaterial
          color={active ? 0x22c55e : color}
          transparent
          opacity={isPressed ? 1 : 0.88}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[0, 0, faceZ]}
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
  pressedButtonId,
  rayButtonRef,
  grabButtonRef,
  resetButtonRef,
}: {
  mode: InteractionMode;
  pressedButtonId: string | null;
  rayButtonRef: React.RefObject<THREE.Mesh | null>;
  grabButtonRef: React.RefObject<THREE.Mesh | null>;
  resetButtonRef: React.RefObject<THREE.Mesh | null>;
}) {
  return (
    <group position={[0, FLOOR_OFFSET_Y + 0.72, -0.92]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.025]}>
        <planeGeometry args={[0.88, 0.24]} />
        <meshBasicMaterial
          color={0x020617}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[-0.39, 0.075, 0.02]}
        fontSize={0.03}
        color="white"
        anchorX="left"
        anchorY="middle"
      >
        Hand mode
      </Text>

      <ModeButton
        label="RAY"
        active={mode === "ray-drag"}
        pressed={pressedButtonId === "ray"}
        position={[-0.25, -0.035, 0.02]}
        meshRef={rayButtonRef}
        color={0x2563eb}
        width={0.22}
      />

      <ModeButton
        label="GRAB"
        active={mode === "grab-scale"}
        pressed={pressedButtonId === "grab"}
        position={[0, -0.035, 0.02]}
        meshRef={grabButtonRef}
        color={0x7c3aed}
        width={0.22}
      />

      <ModeButton
        label="RESET UI"
        pressed={pressedButtonId === "reset"}
        position={[0.285, -0.035, 0.02]}
        meshRef={resetButtonRef}
        color={0xef4444}
        width={0.28}
      />
    </group>
  );
}

function DraggableChart({
  chartRef,
  chartColliderRef,
  seriesId,
  selectedLabel,
}: {
  chartRef: React.RefObject<THREE.Group | null>;
  chartColliderRef: React.RefObject<THREE.Mesh | null>;
  seriesId: string;
  selectedLabel: string;
}) {
  return (
    <group
      ref={chartRef}
      position={CHART_INITIAL_POSITION}
      scale={CHART_INITIAL_SCALE}
    >
      <MeteorologiaLapa3DChart
        seriesId={seriesId}
        selectedLabel={selectedLabel}
        title="Meteorology"
        position={[0, 0, 0]}
        scale={1}
        limit={500}
      />

      {/* Lightweight ray/grab collider for the chart/tablet */}
      <InvisibleCollider
        colliderRef={chartColliderRef}
        args={[1.9, 1.25, 0.16]}
        position={[0, 0, 0.03]}
      />
    </group>
  );
}

function DraggableDrone({
  droneRef,
  droneColliderRef,
}: {
  droneRef: React.RefObject<THREE.Group | null>;
  droneColliderRef: React.RefObject<THREE.Mesh | null>;
}) {
  return (
    <group
      ref={droneRef}
      position={DRONE_INITIAL_POSITION}
      scale={DRONE_INITIAL_SCALE}
    >
      <Suspense fallback={null}>
        <VertexColorDroneModel url={DRONE_MODEL_URL} maxSize={0.65} />
      </Suspense>

      {/* Lightweight collider around the GLB.
          Raycasts hit this box, not the high-poly drone model. */}
      <InvisibleCollider
        colliderRef={droneColliderRef}
        args={[0.70, 0.20, 0.70]}
        position={[0, 0, 0]}
      />
    </group>
  );
}

function HandInputSystem({
  mode,
  onModeChange,
  onButtonPress,
  draggableTargets,
  buttons,
}: {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onButtonPress: (buttonId: string) => void;
  draggableTargets: DraggableTarget[];
  buttons: ModeButtonTarget[];
}) {
  const { gl, scene } = useThree();

  const modeRef = useRef<InteractionMode>(mode);
  const handPointersRef = useRef<any[]>([]);
  const handsRef = useRef<any[]>([]);

  const rayAttachedPointerRef = useRef<any | null>(null);
  const rayAttachedTargetRef = useRef<DraggableTarget | null>(null);

  const directGrabHandIndexRef = useRef<number | null>(null);
  const directGrabTargetRef = useRef<DraggableTarget | null>(null);

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

  function resetTargets() {
    for (const target of draggableTargets) {
      const object = target.ref.current;
      if (!object) continue;

      scene.attach(object);

      object.position.set(...target.initialPosition);
      object.rotation.set(0, 0, 0);
      object.scale.setScalar(target.initialScale);
    }

    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    rayAttachedTargetRef.current = null;

    directGrabHandIndexRef.current = null;
    directGrabTargetRef.current = null;

    scalingRef.current.active = false;
  }

  function detachIfNeeded() {
    const rayTargetObject = rayAttachedTargetRef.current?.ref.current;
    const grabTargetObject = directGrabTargetRef.current?.ref.current;

    if (rayTargetObject) scene.attach(rayTargetObject);
    if (grabTargetObject) scene.attach(grabTargetObject);

    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    rayAttachedTargetRef.current = null;

    directGrabHandIndexRef.current = null;
    directGrabTargetRef.current = null;

    scalingRef.current.active = false;
  }

  function setModeSafely(nextMode: InteractionMode) {
    modeRef.current = nextMode;
    detachIfNeeded();
    onModeChange(nextMode);
  }

  function triggerButton(button: ModeButtonTarget) {
    onButtonPress(button.id);

    if (button.action === "reset") {
      resetTargets();
      return;
    }

    if (button.mode) {
      setModeSafely(button.mode);
    }
  }

  function getIndexTip(hand: any): THREE.Object3D | null {
    return hand?.joints?.["index-finger-tip"] ?? null;
  }

  function getPinchedHands() {
    return handsRef.current.map((hand) => {
      const tip = getIndexTip(hand);
      const thumb = hand?.joints?.["thumb-tip"] ?? null;

      if (!tip || !thumb) return false;

      const tipPos = tip.getWorldPosition(tmpVec1.current);
      const thumbPos = thumb.getWorldPosition(tmpVec2.current);
      //pinchmetric
      return tipPos.distanceTo(thumbPos) < 0.015;
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

        if (
          intersections?.length &&
          intersections[0].distance < closestDistance
        ) {
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

  function findClosestPointerTarget(handPointer: any) {
    let closestTarget: DraggableTarget | null = null;
    let closestDistance = Infinity;

    for (const target of draggableTargets) {
      const collider = target.colliderRef.current;
      if (!collider) continue;

      // Lightweight raycast: only against invisible box collider.
      const intersections = handPointer.intersectObject(collider, false);

      if (
        intersections?.length &&
        intersections[0].distance < closestDistance
      ) {
        closestDistance = intersections[0].distance;
        closestTarget = target;
      }
    }

    return { closestTarget, closestDistance };
  }

  function updateRayDragMode() {
    const attachedPointer = rayAttachedPointerRef.current;
    const attachedTarget = rayAttachedTargetRef.current;
    const attachedObject = attachedTarget?.ref.current;

    if (attachedPointer && attachedObject) {
      if (!attachedPointer.isPinched?.()) {
        scene.attach(attachedObject);
        attachedPointer.setAttached?.(false);

        rayAttachedPointerRef.current = null;
        rayAttachedTargetRef.current = null;
      }

      return;
    }

    for (const handPointer of handPointersRef.current) {
      const { closestTarget, closestDistance } =
        findClosestPointerTarget(handPointer);

      if (closestTarget) {
        handPointer.setCursor?.(closestDistance);

        if (handPointer.isPinched?.() && !handPointer.isAttached?.()) {
          const object = closestTarget.ref.current;
          if (!object) continue;

          const attachNode = handPointer.children?.[0] ?? handPointer;
          attachNode.attach(object);

          handPointer.setAttached?.(true);
          rayAttachedPointerRef.current = handPointer;
          rayAttachedTargetRef.current = closestTarget;

          break;
        }
      } else {
        handPointer.setCursor?.(1.5);
      }
    }
  }

  function getTargetContainsPoint(target: DraggableTarget, point: THREE.Vector3) {
    const collider = target.colliderRef.current;
    if (!collider) return false;

    // Lightweight direct-grab test: bounding box of the simple collider only.
    tmpBox.current.setFromObject(collider);
    tmpBox.current.expandByScalar(0.08);

    return tmpBox.current.containsPoint(point);
  }

  function updateDirectGrabScaleMode() {
    const pinchedHands = getPinchedHands();

    if (directGrabHandIndexRef.current !== null && directGrabTargetRef.current) {
      const grabHandIndex = directGrabHandIndexRef.current;
      const target = directGrabTargetRef.current;
      const object = target.ref.current;

      if (!object) return;

      if (!pinchedHands[grabHandIndex]) {
        scene.attach(object);

        directGrabHandIndexRef.current = null;
        directGrabTargetRef.current = null;
        scalingRef.current.active = false;

        return;
      }

      const otherHandIndex = grabHandIndex === 0 ? 1 : 0;
      const grabHand = handsRef.current[grabHandIndex];
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
            scalingRef.current.initialScale = object.scale.x;
          } else if (scalingRef.current.initialDistance > 0) {
            const factor = distance / scalingRef.current.initialDistance;

            const nextScale = THREE.MathUtils.clamp(
              scalingRef.current.initialScale * factor,
              0.2,
              3.5
            );

            object.scale.setScalar(nextScale);
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
      if (directGrabTargetRef.current) return;

      const tipPos = indexTip.getWorldPosition(tmpVec1.current);

      for (const target of draggableTargets) {
        const object = target.ref.current;
        if (!object) continue;

        if (getTargetContainsPoint(target, tipPos)) {
          indexTip.attach(object);

          directGrabHandIndexRef.current = handIndex;
          directGrabTargetRef.current = target;
          scalingRef.current.active = false;

          break;
        }
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
      rayAttachedTargetRef.current = null;

      directGrabHandIndexRef.current = null;
      directGrabTargetRef.current = null;

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
  seriesId,
  selectedLabel,
}: {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  seriesId: string;
  selectedLabel: string;
}) {
  const [pressedButtonId, setPressedButtonId] = useState<string | null>(null);

  const chartRef = useRef<THREE.Group | null>(null);
  const droneRef = useRef<THREE.Group | null>(null);

  const chartColliderRef = useRef<THREE.Mesh | null>(null);
  const droneColliderRef = useRef<THREE.Mesh | null>(null);

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

  const draggableTargets: DraggableTarget[] = [
    {
      id: "chart",
      label: "3D chart",
      ref: chartRef,
      colliderRef: chartColliderRef,
      initialPosition: CHART_INITIAL_POSITION,
      initialScale: CHART_INITIAL_SCALE,
    },
    {
      id: "drone",
      label: "Drone GLB",
      ref: droneRef,
      colliderRef: droneColliderRef,
      initialPosition: DRONE_INITIAL_POSITION,
      initialScale: DRONE_INITIAL_SCALE,
    },
  ];

  function pulseButton(buttonId: string) {
    setPressedButtonId(buttonId);
    window.setTimeout(() => {
      setPressedButtonId((current) => (current === buttonId ? null : current));
    }, 130);
  }

  return (
    <>
      <CameraSetup />

      <HandInputSystem
        mode={mode}
        onModeChange={setMode}
        onButtonPress={pulseButton}
        draggableTargets={draggableTargets}
        buttons={buttons}
      />

      <DraggableChart
        chartRef={chartRef}
        chartColliderRef={chartColliderRef}
        seriesId={seriesId}
        selectedLabel={selectedLabel}
      />

      <DraggableDrone
        droneRef={droneRef}
        droneColliderRef={droneColliderRef}
      />

      <ModePanel
        mode={mode}
        pressedButtonId={pressedButtonId}
        rayButtonRef={rayButtonRef}
        grabButtonRef={grabButtonRef}
        resetButtonRef={resetButtonRef}
      />
    </>
  );
}

export default function Page() {
  const [mode, setMode] = useState<InteractionMode>("ray-drag");
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
        <Suspense fallback={null}>
          <ARScene
            mode={mode}
            setMode={setMode}
            seriesId={selectedSeries.id}
            selectedLabel={selectedSeries.label}
          />
        </Suspense>
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
          maxWidth: 500,
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Quest 3 AR — Chart + Drone GLB Test
        </div>

        <div style={{ fontSize: 13, marginBottom: 8 }}>
          Current mode: <b>{mode}</b>
          <br />
          Ray mode: point + pinch to drag.
          <br />
          Grab mode: pinch object directly; second hand pinch scales.
        </div>

        <div style={{ fontSize: 13, marginBottom: 10 }}>
          Series: {selectedSeries.label}
        </div>

        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
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
            Prev Series
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
            Next Series
          </button>
        </div>
      </div>
    </main>
  );
}

useGLTF.preload(DRONE_MODEL_URL);
