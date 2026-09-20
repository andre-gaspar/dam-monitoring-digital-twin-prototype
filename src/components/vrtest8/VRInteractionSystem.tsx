"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

export type InteractionMode = "ray-drag" | "grab-scale";

export type VRButtonTarget = {
  id: string;
  ref: React.RefObject<THREE.Mesh | null>;
  mode?: InteractionMode;
  action?: "reset-draggables";
  onPress?: () => void;
};

export type DraggableTarget = {
  id: string;
  ref: React.RefObject<THREE.Group | null>;
  colliderRef: React.RefObject<THREE.Mesh | null>;
  initialPosition: [number, number, number];
  initialScale: number;
};

type HandInputSystemProps = {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  draggableTargets: DraggableTarget[];
  buttons: VRButtonTarget[];
};

const BUTTON_PRESS_DEPTH = 0.024;
const BUTTON_PRESS_DURATION_MS = 180;

export function HandInputSystem({
  mode,
  onModeChange,
  draggableTargets,
  buttons,
}: HandInputSystemProps) {
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

  function startButtonPressAnimation(button: VRButtonTarget) {
    const mesh = button.ref.current;
    if (!mesh) return;

    if (typeof mesh.userData.vrButtonBaseZ !== "number") {
      mesh.userData.vrButtonBaseZ = mesh.position.z;
    }

    mesh.userData.vrButtonPressedAt = performance.now();
  }

  function updateButtonPressAnimations() {
    const now = performance.now();
    const animatedMeshes = new Set<THREE.Mesh>();

    for (const button of buttons) {
      const mesh = button.ref.current;
      if (!mesh || animatedMeshes.has(mesh)) continue;

      animatedMeshes.add(mesh);

      const pressedAt = mesh.userData.vrButtonPressedAt;
      const baseZ =
        typeof mesh.userData.vrButtonBaseZ === "number"
          ? mesh.userData.vrButtonBaseZ
          : mesh.position.z;

      if (typeof pressedAt !== "number") {
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, baseZ, 0.18);
        continue;
      }

      const t = clamp01((now - pressedAt) / BUTTON_PRESS_DURATION_MS);
      const depth =
        t < 0.35
          ? THREE.MathUtils.lerp(0, BUTTON_PRESS_DEPTH, t / 0.35)
          : THREE.MathUtils.lerp(BUTTON_PRESS_DEPTH, 0, (t - 0.35) / 0.65);

      mesh.position.z = baseZ - depth;

      if (t >= 1) {
        mesh.userData.vrButtonPressedAt = undefined;
      }
    }
  }

  function triggerButton(button: VRButtonTarget) {
    startButtonPressAnimation(button);

    if (button.action === "reset-draggables") {
      resetTargets();
    }

    if (button.mode) {
      setModeSafely(button.mode);
    }

    button.onPress?.();
  }

  function getIndexTip(hand: any): THREE.Object3D | null {
    return hand?.joints?.["index-finger-tip"] ?? null;
  }

  function clamp01(value: number) {
    return Math.min(Math.max(value, 0), 1);
  }

  function getPinchedHands() {
    return handsRef.current.map((hand) => {
      const tip = getIndexTip(hand);
      const thumb = hand?.joints?.["thumb-tip"] ?? null;

      if (!tip || !thumb) return false;

      const tipPos = tip.getWorldPosition(tmpVec1.current);
      const thumbPos = thumb.getWorldPosition(tmpVec2.current);

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
    for (const handPointer of handPointersRef.current) {
      let closestButton: VRButtonTarget | null = null;
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

      if (closestButton) {
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
    };
  }, [gl, scene]);

  useFrame(() => {
    updatePhysicalButtonPresses();
    updatePointerButtonPresses();
    updateButtonPressAnimations();

    if (modeRef.current === "ray-drag") {
      updateRayDragMode();
    } else {
      updateDirectGrabScaleMode();
    }
  });

  return null;
}
