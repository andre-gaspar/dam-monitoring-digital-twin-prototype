"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { ARButton } from "three/addons/webxr/ARButton.js";

const MODEL_URL = "/droner.glb";

// Spawned model size in meters.
// Increase/decrease this if the drone model appears too small/large in AR.
const MODEL_MAX_SIZE_METERS = 0.45;

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function PreparedSpawnModel() {
  const gltf = useGLTF(MODEL_URL);

  const template = useMemo(() => {
    const root = gltf.scene.clone(true);

    root.traverse((child) => {
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

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      console.log(child.name || "drone mesh", {
        hasVertexColors,
        vertexCount: geometry.getAttribute("position")?.count,
        colorCount: geometry.getAttribute("color")?.count,
      });
    });

    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    const scale = MODEL_MAX_SIZE_METERS / maxSize;

    // Center the model around its origin so it spawns at your pinch position.
    root.position.set(-center.x, -center.y, -center.z);

    const group = new THREE.Group();
    group.add(root);
    group.scale.setScalar(scale);

    group.userData.baseScale = scale;
    group.userData.colliderRadiusUnscaled = size.length() * 0.5;

    return group;
  }, [gltf.scene]);

  return <WebARHandSetup modelTemplate={template} />;
}

function WebARHandSetup({
  modelTemplate,
}: {
  modelTemplate: THREE.Group;
}) {
  const { gl, scene } = useThree();

  const hand1Ref = useRef<any>(null);
  const hand2Ref = useRef<any>(null);

  const tmpVector1 = useRef(new THREE.Vector3());
  const tmpVector2 = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());

  const spawnedModelsRef = useRef<THREE.Object3D[]>([]);
  const grabbingRef = useRef(false);

  const scalingRef = useRef<{
    active: boolean;
    initialDistance: number;
    object: THREE.Object3D | null;
    initialScale: number;
  }>({
    active: false,
    initialDistance: 0,
    object: null,
    initialScale: 1,
  });

  function collideObject(indexTip: THREE.Object3D) {
    for (const object of spawnedModelsRef.current) {
      const distance = indexTip
        .getWorldPosition(tmpVector1.current)
        .distanceTo(object.getWorldPosition(tmpVector2.current));

      const radiusUnscaled =
        object.userData.colliderRadiusUnscaled ?? MODEL_MAX_SIZE_METERS * 0.5;

      const radius = radiusUnscaled * object.scale.x;

      if (distance < radius) {
        return object;
      }
    }

    return null;
  }

  function spawnModelAtIndexTip(indexTip: THREE.Object3D) {
    const model = modelTemplate.clone(true);

    model.userData.baseScale = modelTemplate.userData.baseScale;
    model.userData.colliderRadiusUnscaled =
      modelTemplate.userData.colliderRadiusUnscaled;

    indexTip.getWorldPosition(tmpVector1.current);
    indexTip.getWorldQuaternion(tmpQuat.current);

    model.position.copy(tmpVector1.current);
    model.quaternion.copy(tmpQuat.current);

    spawnedModelsRef.current.push(model);
    scene.add(model);
  }

  function onPinchStartLeft(event: any) {
    const hand = event.target;
    const indexTip = hand.joints?.["index-finger-tip"];

    if (!indexTip) return;

    // If right hand is already grabbing the model, left pinch scales it.
    if (grabbingRef.current) {
      const touchedObject = collideObject(indexTip);
      const selectedObject = hand2Ref.current?.userData?.selected;

      if (touchedObject && touchedObject === selectedObject) {
        const leftPos = indexTip.getWorldPosition(new THREE.Vector3());
        const rightTip = hand2Ref.current?.joints?.["index-finger-tip"];

        if (!rightTip) return;

        const rightPos = rightTip.getWorldPosition(new THREE.Vector3());

        scalingRef.current.active = true;
        scalingRef.current.object = touchedObject;
        scalingRef.current.initialScale = touchedObject.scale.x;
        scalingRef.current.initialDistance = leftPos.distanceTo(rightPos);

        return;
      }
    }

    // Left pinch spawns the GLB model.
    spawnModelAtIndexTip(indexTip);
  }

  function onPinchEndLeft() {
    scalingRef.current.active = false;
  }

  function onPinchStartRight(event: any) {
    const hand = event.target;
    const indexTip = hand.joints?.["index-finger-tip"];

    if (!indexTip) return;

    const object = collideObject(indexTip);

    if (object) {
      grabbingRef.current = true;
      indexTip.attach(object);
      hand.userData.selected = object;
    }
  }

  function onPinchEndRight(event: any) {
    const hand = event.target;

    if (hand.userData.selected) {
      const object = hand.userData.selected as THREE.Object3D;

      scene.attach(object);

      hand.userData.selected = undefined;
      grabbingRef.current = false;
    }

    scalingRef.current.active = false;
  }

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    // Passthrough needs transparent WebGL background.
    scene.background = null;
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;

    const button = ARButton.createButton(gl, {
      requiredFeatures: ["hand-tracking"],
      optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
    });

    document.body.appendChild(button);

    // Hand 1 / left hand
    const hand1 = gl.xr.getHand(0);
    hand1Ref.current = hand1;

    hand1.addEventListener("pinchstart", onPinchStartLeft);
    hand1.addEventListener("pinchend", onPinchEndLeft);
    scene.add(hand1);

    // Hand 2 / right hand
    const hand2 = gl.xr.getHand(1);
    hand2Ref.current = hand2;

    hand2.addEventListener("pinchstart", onPinchStartRight);
    hand2.addEventListener("pinchend", onPinchEndRight);
    scene.add(hand2);

    return () => {
      button.remove();

      hand1.removeEventListener("pinchstart", onPinchStartLeft);
      hand1.removeEventListener("pinchend", onPinchEndLeft);
      hand2.removeEventListener("pinchstart", onPinchStartRight);
      hand2.removeEventListener("pinchend", onPinchEndRight);

      scene.remove(hand1);
      scene.remove(hand2);

      for (const object of spawnedModelsRef.current) {
        scene.remove(object);
      }

      spawnedModelsRef.current = [];
      gl.xr.enabled = false;
    };
  }, [gl, scene, modelTemplate]);

  useFrame(() => {
    const scaling = scalingRef.current;

    if (!scaling.active || !scaling.object) return;

    const hand1 = hand1Ref.current;
    const hand2 = hand2Ref.current;

    const indexTip1 = hand1?.joints?.["index-finger-tip"];
    const indexTip2 = hand2?.joints?.["index-finger-tip"];

    if (!indexTip1 || !indexTip2) return;

    const pos1 = indexTip1.getWorldPosition(tmpVector1.current);
    const pos2 = indexTip2.getWorldPosition(tmpVector2.current);

    const distance = pos1.distanceTo(pos2);

    if (scaling.initialDistance <= 0) return;

    const scaleFactor = distance / scaling.initialDistance;
    const baseScale = scaling.object.userData.baseScale ?? 1;

    const newScale = THREE.MathUtils.clamp(
      scaling.initialScale * scaleFactor,
      baseScale * 0.2,
      baseScale * 8
    );

    scaling.object.scale.setScalar(newScale);
  });

  return null;
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.4, -1);
  }, [camera]);

  return null;
}

function ARScene() {
  return (
    <>
      <CameraSetup />

      <Suspense fallback={null}>
        <PreparedSpawnModel />
      </Suspense>
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
          maxWidth: 360,
          lineHeight: 1.35,
        }}
      >
        Quest 3 AR model spawn test
        <br />
        Left pinch: spawn drone GLB
        <br />
        Right pinch: grab model
        <br />
        Both pinches: scale grabbed model
      </div>
    </main>
  );
}

useGLTF.preload(MODEL_URL);