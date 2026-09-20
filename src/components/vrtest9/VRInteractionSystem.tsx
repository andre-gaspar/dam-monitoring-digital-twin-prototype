"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OculusHandModel } from "three/addons/webxr/OculusHandModel.js";
import { OculusHandPointerModel } from "three/addons/webxr/OculusHandPointerModel.js";

export type InteractionMode = "ray-drag" | "grab-scale" | "combined";

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

export type HorizontalSliderTarget = {
  id: string;
  rootRef: React.RefObject<THREE.Group | null>;
  handleRef: React.RefObject<THREE.Group | null>;
  colliderRef: React.RefObject<THREE.Mesh | null>;
  minX: number;
  maxX: number;
  onChange: (value: number) => void;
};

type HandInputSystemProps = {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  draggableTargets: DraggableTarget[];
  buttons: VRButtonTarget[];
  horizontalSliderTargets?: HorizontalSliderTarget[];
};

const BUTTON_PRESS_DEPTH = 0.024;
const BUTTON_PRESS_DURATION_MS = 180;
const COMBINED_DIRECT_GRAB_RAY_DISTANCE = 0.16;

export function HandInputSystem({
  mode,
  onModeChange,
  draggableTargets,
  buttons,
  horizontalSliderTargets = [],
}: HandInputSystemProps) {
  const { gl, scene } = useThree();

  const modeRef = useRef<InteractionMode>(mode);
  const handPointersRef = useRef<any[]>([]);
  const handsRef = useRef<any[]>([]);

  const rayAttachedPointerRef = useRef<any | null>(null);
  const rayAttachedTargetRef = useRef<DraggableTarget | null>(null);
  const rayAttachedHandIndexRef = useRef<number | null>(null);

  const directGrabHandIndexRef = useRef<number | null>(null);
  const directGrabTargetRef = useRef<DraggableTarget | null>(null);

  const activeSliderRef = useRef<{
    targetId: string;
    kind: "ray" | "direct";
    handIndex: number;
    pointer: any | null;
    grabOffsetX: number;
    planeLocalZ: number;
  } | null>(null);

  const scalingRef = useRef({
    active: false,
    initialDistance: 0,
    initialScale: 1,
  });

  const pointerButtonLatchRef = useRef<Map<any, string>>(new Map());
  const fingerButtonPressedRef = useRef<Set<string>>(new Set());

  const tmpVec1 = useRef(new THREE.Vector3());
  const tmpVec2 = useRef(new THREE.Vector3());
  const tmpVec3 = useRef(new THREE.Vector3());
  const tmpBox = useRef(new THREE.Box3());
  const tmpPlane = useRef(new THREE.Plane());
  const tmpQuaternion = useRef(new THREE.Quaternion());
  const tmpNormal = useRef(new THREE.Vector3());

  function resetTargets() {
    releaseActiveSlider();

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
    rayAttachedHandIndexRef.current = null;

    directGrabHandIndexRef.current = null;
    directGrabTargetRef.current = null;
    scalingRef.current.active = false;
  }

  function detachIfNeeded() {
    releaseActiveSlider();

    const rayTargetObject = rayAttachedTargetRef.current?.ref.current;
    const grabTargetObject = directGrabTargetRef.current?.ref.current;

    if (rayTargetObject) scene.attach(rayTargetObject);
    if (grabTargetObject) scene.attach(grabTargetObject);

    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    rayAttachedTargetRef.current = null;
    rayAttachedHandIndexRef.current = null;

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

  function releaseActiveSlider() {
    activeSliderRef.current?.pointer?.setAttached?.(false);
    activeSliderRef.current = null;
  }

  function findSliderTarget(targetId: string) {
    return (
      horizontalSliderTargets.find((target) => target.id === targetId) ?? null
    );
  }

  function sliderLocalX(
    target: HorizontalSliderTarget,
    worldPoint: THREE.Vector3
  ) {
    const root = target.rootRef.current;
    if (!root) return null;

    root.updateWorldMatrix(true, false);
    return root.worldToLocal(tmpVec3.current.copy(worldPoint)).x;
  }

  function moveSliderFromWorldPoint(
    target: HorizontalSliderTarget,
    worldPoint: THREE.Vector3,
    grabOffsetX: number
  ) {
    const handle = target.handleRef.current;
    const localX = sliderLocalX(target, worldPoint);
    if (!handle || localX === null) return;

    const nextX = THREE.MathUtils.clamp(
      localX + grabOffsetX,
      target.minX,
      target.maxX
    );
    const range = target.maxX - target.minX;

    handle.position.x = nextX;
    target.onChange(range > 0 ? (nextX - target.minX) / range : 0);
  }

  function updateActiveSlider() {
    const active = activeSliderRef.current;
    if (!active) return false;

    const target = findSliderTarget(active.targetId);
    const root = target?.rootRef.current;
    const handle = target?.handleRef.current;

    if (!target || !root || !handle) {
      releaseActiveSlider();
      return true;
    }

    if (active.kind === "direct") {
      const pinchedHands = getPinchedHands();
      const hand = handsRef.current[active.handIndex];
      const indexTip = getIndexTip(hand);
      const pointerStillPinched = Boolean(
        handPointersRef.current[active.handIndex]?.isPinched?.()
      );

      if (
        (!pinchedHands[active.handIndex] && !pointerStillPinched) ||
        !indexTip
      ) {
        releaseActiveSlider();
        return true;
      }

      const tipPosition = indexTip.getWorldPosition(tmpVec1.current);
      moveSliderFromWorldPoint(target, tipPosition, active.grabOffsetX);
      return true;
    }

    const pointer = active.pointer;
    const ray = pointer?.raycaster?.ray as THREE.Ray | undefined;

    if (!pointer?.isPinched?.() || !ray) {
      releaseActiveSlider();
      return true;
    }

    root.updateWorldMatrix(true, false);
    tmpVec1.current.set(0, 0, active.planeLocalZ);
    root.localToWorld(tmpVec1.current);
    root.getWorldQuaternion(tmpQuaternion.current);
    tmpNormal.current
      .set(0, 0, 1)
      .applyQuaternion(tmpQuaternion.current)
      .normalize();
    tmpPlane.current.setFromNormalAndCoplanarPoint(
      tmpNormal.current,
      tmpVec1.current
    );

    const hitPoint = ray.intersectPlane(tmpPlane.current, tmpVec2.current);
    if (hitPoint) {
      moveSliderFromWorldPoint(target, hitPoint, active.grabOffsetX);
    }

    return true;
  }

  function tryStartDirectSlider() {
    const pinchedHands = getPinchedHands();

    for (let handIndex = 0; handIndex < handsRef.current.length; handIndex++) {
      if (!pinchedHands[handIndex]) continue;
      if (handPointersRef.current[handIndex]?.isAttached?.()) continue;

      const indexTip = getIndexTip(handsRef.current[handIndex]);
      if (!indexTip) continue;

      const tipPosition = indexTip.getWorldPosition(tmpVec1.current);

      for (const target of horizontalSliderTargets) {
        const collider = target.colliderRef.current;
        const handle = target.handleRef.current;
        if (!collider || !handle) continue;

        tmpBox.current.setFromObject(collider);
        tmpBox.current.expandByScalar(0.04);
        if (!tmpBox.current.containsPoint(tipPosition)) continue;

        const localX = sliderLocalX(target, tipPosition);
        if (localX === null) continue;

        activeSliderRef.current = {
          targetId: target.id,
          kind: "direct",
          handIndex,
          pointer: null,
          grabOffsetX: handle.position.x - localX,
          planeLocalZ: handle.position.z,
        };
        return true;
      }
    }

    return false;
  }

  function closestExistingRayHitDistance(pointer: any) {
    let closestDistance = Infinity;

    for (const button of buttons) {
      const mesh = button.ref.current;
      if (!mesh) continue;

      const intersection = pointer.intersectObject(mesh, false)?.[0];
      if (intersection) {
        closestDistance = Math.min(closestDistance, intersection.distance);
      }
    }

    for (const target of draggableTargets) {
      const collider = target.colliderRef.current;
      if (!collider) continue;

      const intersection = pointer.intersectObject(collider, false)?.[0];
      if (intersection) {
        closestDistance = Math.min(closestDistance, intersection.distance);
      }
    }

    return closestDistance;
  }

  function tryStartRaySlider() {
    for (
      let handIndex = 0;
      handIndex < handPointersRef.current.length;
      handIndex++
    ) {
      const pointer = handPointersRef.current[handIndex];
      if (pointer.isAttached?.()) continue;

      let closestTarget: HorizontalSliderTarget | null = null;
      let closestIntersection: THREE.Intersection<THREE.Object3D> | null = null;

      for (const target of horizontalSliderTargets) {
        const collider = target.colliderRef.current;
        if (!collider) continue;

        const intersections = pointer.intersectObject(collider, false);
        const intersection = intersections?.[0] ?? null;

        if (
          intersection &&
          (!closestIntersection ||
            intersection.distance < closestIntersection.distance)
        ) {
          closestTarget = target;
          closestIntersection = intersection;
        }
      }

      if (!closestTarget || !closestIntersection) continue;

      pointer.setCursor?.(closestIntersection.distance);
      if (!pointer.isPinched?.()) continue;
      if (
        closestExistingRayHitDistance(pointer) <
        closestIntersection.distance - 0.0001
      ) {
        continue;
      }

      const handle = closestTarget.handleRef.current;
      const root = closestTarget.rootRef.current;
      if (!handle || !root) continue;

      root.updateWorldMatrix(true, false);
      const localHit = root.worldToLocal(
        tmpVec3.current.copy(closestIntersection.point)
      );

      pointer.setAttached?.(true);
      pointerButtonLatchRef.current.delete(pointer);
      activeSliderRef.current = {
        targetId: closestTarget.id,
        kind: "ray",
        handIndex,
        pointer,
        grabOffsetX: handle.position.x - localHit.x,
        planeLocalZ: localHit.z,
      };
      return true;
    }

    return false;
  }

  function updateHorizontalSliders() {
    if (activeSliderRef.current) {
      return updateActiveSlider();
    }

    if (horizontalSliderTargets.length === 0) return false;
    if (rayAttachedTargetRef.current || directGrabTargetRef.current) return false;

    if (modeRef.current === "grab-scale") {
      return tryStartDirectSlider();
    }

    if (modeRef.current === "combined" && tryStartDirectSlider()) {
      return true;
    }

    return tryStartRaySlider();
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

  function releaseRayAttachedObject(object: THREE.Object3D) {
    scene.attach(object);
    rayAttachedPointerRef.current?.setAttached?.(false);
    rayAttachedPointerRef.current = null;
    rayAttachedTargetRef.current = null;
    rayAttachedHandIndexRef.current = null;
    scalingRef.current.active = false;
  }

  function updateRayAttachedScale(object: THREE.Object3D) {
    const handIndex = rayAttachedHandIndexRef.current;
    if (handIndex === null) {
      scalingRef.current.active = false;
      return;
    }

    const pinchedHands = getPinchedHands();
    const otherHandIndex = handIndex === 0 ? 1 : 0;
    const rayHand = handsRef.current[handIndex];
    const otherHand = handsRef.current[otherHandIndex];

    if (pinchedHands[otherHandIndex] && rayHand && otherHand) {
      const rayTip = getIndexTip(rayHand);
      const otherTip = getIndexTip(otherHand);

      if (rayTip && otherTip) {
        const p1 = rayTip.getWorldPosition(tmpVec1.current);
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

        return;
      }
    }

    scalingRef.current.active = false;
  }

  function updateRayAttachedObject(enableScaling: boolean) {
    const attachedPointer = rayAttachedPointerRef.current;
    const attachedTarget = rayAttachedTargetRef.current;
    const attachedObject = attachedTarget?.ref.current;

    if (attachedPointer && attachedObject) {
      if (!attachedPointer.isPinched?.()) {
        releaseRayAttachedObject(attachedObject);
      } else if (enableScaling) {
        updateRayAttachedScale(attachedObject);
      } else {
        scalingRef.current.active = false;
      }

      return true;
    }

    if (attachedPointer) {
      attachedPointer.setAttached?.(false);
      rayAttachedPointerRef.current = null;
      rayAttachedTargetRef.current = null;
      rayAttachedHandIndexRef.current = null;
      scalingRef.current.active = false;
      return true;
    }

    return false;
  }

  function attachTargetToPointer(
    handPointer: any,
    handIndex: number,
    target: DraggableTarget
  ) {
    const object = target.ref.current;
    if (!object) return false;

    const attachNode = handPointer.children?.[0] ?? handPointer;
    attachNode.attach(object);

    handPointer.setAttached?.(true);
    rayAttachedPointerRef.current = handPointer;
    rayAttachedTargetRef.current = target;
    rayAttachedHandIndexRef.current = handIndex;
    scalingRef.current.active = false;

    return true;
  }

  function updateRayDragMode() {
    if (updateRayAttachedObject(false)) return;

    for (let handIndex = 0; handIndex < handPointersRef.current.length; handIndex++) {
      const handPointer = handPointersRef.current[handIndex];
      const { closestTarget, closestDistance } =
        findClosestPointerTarget(handPointer);

      if (closestTarget) {
        handPointer.setCursor?.(closestDistance);

        if (handPointer.isPinched?.() && !handPointer.isAttached?.()) {
          if (attachTargetToPointer(handPointer, handIndex, closestTarget)) {
            break;
          }
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

  function updateActiveDirectGrab(pinchedHands: boolean[]) {
    if (directGrabHandIndexRef.current !== null && directGrabTargetRef.current) {
      const grabHandIndex = directGrabHandIndexRef.current;
      const target = directGrabTargetRef.current;
      const object = target.ref.current;

      if (!object) {
        directGrabHandIndexRef.current = null;
        directGrabTargetRef.current = null;
        scalingRef.current.active = false;
        return true;
      }

      if (!pinchedHands[grabHandIndex]) {
        scene.attach(object);
        directGrabHandIndexRef.current = null;
        directGrabTargetRef.current = null;
        scalingRef.current.active = false;
        return true;
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

      return true;
    }

    return false;
  }

  function startDirectGrab(handIndex: number, target: DraggableTarget) {
    const hand = handsRef.current[handIndex];
    const indexTip = getIndexTip(hand);
    const object = target.ref.current;

    if (!indexTip || !object) return false;

    indexTip.attach(object);
    directGrabHandIndexRef.current = handIndex;
    directGrabTargetRef.current = target;
    scalingRef.current.active = false;

    return true;
  }

  function tryStartDirectGrabFromHands(pinchedHands: boolean[]) {
    for (let handIndex = 0; handIndex < handsRef.current.length; handIndex++) {
      const hand = handsRef.current[handIndex];
      const indexTip = getIndexTip(hand);
      if (!indexTip || !pinchedHands[handIndex]) continue;
      if (directGrabTargetRef.current) return true;

      const tipPos = indexTip.getWorldPosition(tmpVec1.current);

      for (const target of draggableTargets) {
        const object = target.ref.current;
        if (!object) continue;

        if (getTargetContainsPoint(target, tipPos)) {
          return startDirectGrab(handIndex, target);
        }
      }
    }

    return false;
  }

  function updateDirectGrabScaleMode() {
    const pinchedHands = getPinchedHands();

    if (updateActiveDirectGrab(pinchedHands)) return;

    tryStartDirectGrabFromHands(pinchedHands);
  }

  function updateCombinedMode() {
    const pinchedHands = getPinchedHands();

    if (updateActiveDirectGrab(pinchedHands)) return;
    if (updateRayAttachedObject(true)) return;
    if (tryStartDirectGrabFromHands(pinchedHands)) return;

    for (let handIndex = 0; handIndex < handPointersRef.current.length; handIndex++) {
      const handPointer = handPointersRef.current[handIndex];
      const { closestTarget, closestDistance } =
        findClosestPointerTarget(handPointer);

      if (closestTarget) {
        handPointer.setCursor?.(closestDistance);

        if (handPointer.isPinched?.() && !handPointer.isAttached?.()) {
          const startedDirectGrab =
            closestDistance <= COMBINED_DIRECT_GRAB_RAY_DISTANCE &&
            startDirectGrab(handIndex, closestTarget);

          if (
            startedDirectGrab ||
            attachTargetToPointer(handPointer, handIndex, closestTarget)
          ) {
            break;
          }
        }
      } else {
        handPointer.setCursor?.(1.5);
      }
    }
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
      releaseActiveSlider();

      scene.remove(hand1);
      scene.remove(hand2);
      scene.remove(controller1);
      scene.remove(controller2);

      handsRef.current = [];
      handPointersRef.current = [];

      rayAttachedPointerRef.current?.setAttached?.(false);
      rayAttachedPointerRef.current = null;
      rayAttachedTargetRef.current = null;
      rayAttachedHandIndexRef.current = null;

      directGrabHandIndexRef.current = null;
      directGrabTargetRef.current = null;
    };
  }, [gl, scene]);

  useFrame(() => {
    if (
      (activeSliderRef.current || horizontalSliderTargets.length > 0) &&
      updateHorizontalSliders()
    ) {
      updateButtonPressAnimations();
      return;
    }

    updatePhysicalButtonPresses();
    updatePointerButtonPresses();
    updateButtonPressAnimations();

    if (modeRef.current === "ray-drag") {
      updateRayDragMode();
    } else if (modeRef.current === "grab-scale") {
      updateDirectGrabScaleMode();
    } else {
      updateCombinedMode();
    }
  });

  return null;
}
