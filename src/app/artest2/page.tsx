"use client";

import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

const CUBE_SIZE = 0.08;

function WebARHandSetup() {
  const { gl, scene } = useThree();

  const hand1Ref = useRef<any>(null);
  const hand2Ref = useRef<any>(null);

  const tmpVector1 = useRef(new THREE.Vector3());
  const tmpVector2 = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());

  const cubesRef = useRef<THREE.Mesh[]>([]);
  const grabbingRef = useRef(false);

  const scalingRef = useRef<{
    active: boolean;
    initialDistance: number;
    object: THREE.Mesh | null;
    initialScale: number;
  }>({
    active: false,
    initialDistance: 0,
    object: null,
    initialScale: 1,
  });

  function collideObject(indexTip: THREE.Object3D) {
    for (const cube of cubesRef.current) {
      const distance = indexTip
        .getWorldPosition(tmpVector1.current)
        .distanceTo(cube.getWorldPosition(tmpVector2.current));

      const radius =
        cube.geometry.boundingSphere?.radius ?? CUBE_SIZE * 0.9;

      if (distance < radius * cube.scale.x) {
        return cube;
      }
    }

    return null;
  }

  function onPinchStartLeft(event: any) {
    const hand = event.target;
    const indexTip = hand.joints?.["index-finger-tip"];

    if (!indexTip) return;

    // If right hand is already grabbing a cube, left pinch on same cube scales it.
    if (grabbingRef.current) {
      const touchedCube = collideObject(indexTip);
      const selectedCube = hand2Ref.current?.userData?.selected;

      if (touchedCube && touchedCube === selectedCube) {
        const leftPos = indexTip.getWorldPosition(new THREE.Vector3());
        const rightTip = hand2Ref.current?.joints?.["index-finger-tip"];

        if (!rightTip) return;

        const rightPos = rightTip.getWorldPosition(new THREE.Vector3());

        scalingRef.current.active = true;
        scalingRef.current.object = touchedCube;
        scalingRef.current.initialScale = touchedCube.scale.x;
        scalingRef.current.initialDistance = leftPos.distanceTo(rightPos);

        return;
      }
    }

    // Otherwise left pinch creates a new cube.
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    geometry.computeBoundingSphere();

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      toneMapped: false,
    });

    const cube = new THREE.Mesh(geometry, material);

    indexTip.getWorldPosition(tmpVector1.current);
    indexTip.getWorldQuaternion(tmpQuat.current);

    cube.position.copy(tmpVector1.current);
    cube.quaternion.copy(tmpQuat.current);

    cubesRef.current.push(cube);
    scene.add(cube);
  }

  function onPinchEndLeft() {
    scalingRef.current.active = false;
  }

  function onPinchStartRight(event: any) {
    const hand = event.target;
    const indexTip = hand.joints?.["index-finger-tip"];

    if (!indexTip) return;

    const cube = collideObject(indexTip);

    if (cube) {
      grabbingRef.current = true;
      indexTip.attach(cube);
      hand.userData.selected = cube;
    }
  }

  function onPinchEndRight(event: any) {
    const hand = event.target;

    if (hand.userData.selected) {
      const cube = hand.userData.selected as THREE.Mesh;

      scene.attach(cube);

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

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    // Controllers, useful fallback/debug if controllers are active.
    const controller1 = gl.xr.getController(0);
    const controller2 = gl.xr.getController(1);

    scene.add(controller1);
    scene.add(controller2);

    const controllerGrip1 = gl.xr.getControllerGrip(0);
    controllerGrip1.add(
      controllerModelFactory.createControllerModel(controllerGrip1)
    );
    scene.add(controllerGrip1);

    const controllerGrip2 = gl.xr.getControllerGrip(1);
    controllerGrip2.add(
      controllerModelFactory.createControllerModel(controllerGrip2)
    );
    scene.add(controllerGrip2);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    });

    const line1 = new THREE.Line(lineGeometry, lineMaterial);
    line1.name = "line";
    line1.scale.z = 2;

    const line2 = line1.clone();

    controller1.add(line1);
    controller2.add(line2);

    // Hand 1 / left hand
    const hand1 = gl.xr.getHand(0);
    hand1Ref.current = hand1;

    hand1.addEventListener("pinchstart", onPinchStartLeft);
    hand1.addEventListener("pinchend", onPinchEndLeft);

    hand1.add(handModelFactory.createHandModel(hand1, "mesh"));
    scene.add(hand1);

    // Hand 2 / right hand
    const hand2 = gl.xr.getHand(1);
    hand2Ref.current = hand2;

    hand2.addEventListener("pinchstart", onPinchStartRight);
    hand2.addEventListener("pinchend", onPinchEndRight);

    hand2.add(handModelFactory.createHandModel(hand2, "mesh"));
    scene.add(hand2);

    return () => {
      button.remove();

      hand1.removeEventListener("pinchstart", onPinchStartLeft);
      hand1.removeEventListener("pinchend", onPinchEndLeft);
      hand2.removeEventListener("pinchstart", onPinchStartRight);
      hand2.removeEventListener("pinchend", onPinchEndRight);

      scene.remove(hand1);
      scene.remove(hand2);
      scene.remove(controller1);
      scene.remove(controller2);
      scene.remove(controllerGrip1);
      scene.remove(controllerGrip2);

      for (const cube of cubesRef.current) {
        cube.geometry.dispose();

        if (Array.isArray(cube.material)) {
          cube.material.forEach((mat) => mat.dispose());
        } else {
          cube.material.dispose();
        }

        scene.remove(cube);
      }

      cubesRef.current = [];
      gl.xr.enabled = false;
    };
  }, [gl, scene]);

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
    const newScale = THREE.MathUtils.clamp(
      scaling.initialScale * scaleFactor,
      0.25,
      6
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
      <WebARHandSetup />
      <CameraSetup />

      {/* Small starter cube so you know the scene loaded */}
      <mesh position={[0, 1.35, -1.2]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color={0x00d4ff} toneMapped={false} />
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
          maxWidth: 340,
          lineHeight: 1.35,
        }}
      >
        Quest 3 AR hand test
        <br />
        Left pinch: create cube
        <br />
        Right pinch: grab cube
        <br />
        Both pinches: scale grabbed cube
      </div>
    </main>
  );
}