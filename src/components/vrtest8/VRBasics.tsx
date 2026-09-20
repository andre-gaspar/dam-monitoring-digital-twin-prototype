"use client";

import * as THREE from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { VRButton } from "three/addons/webxr/VRButton.js";

import { USER_EYE_HEIGHT } from "./constants";

export function WebXRSetup() {
  const { gl } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");
    gl.xr.setFramebufferScaleFactor(2.0);

    const button = VRButton.createButton(gl, {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });

    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl]);

  return null;
}

export function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, USER_EYE_HEIGHT, 0);
    camera.lookAt(0, USER_EYE_HEIGHT, -1);
  }, [camera]);

  return null;
}

export function InvisibleCollider({
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
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
