"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";
import { InvisibleCollider } from "@/components/vrtest9/VRBasics";

export const NUMERICAL_SLIDER_MIN_X = -0.43;
export const NUMERICAL_SLIDER_MAX_X = 0.43;

type SliderGroupRef = React.RefObject<THREE.Group | null>;
type SliderColliderRef = React.RefObject<THREE.Mesh | null>;

export function VRNumericalAnimationSlider({
  rootRef,
  handleRef,
  colliderRef,
  value,
  verticalOffset = 0,
}: {
  rootRef: SliderGroupRef;
  handleRef: SliderGroupRef;
  colliderRef: SliderColliderRef;
  value: number;
  verticalOffset?: number;
}) {
  const progress = THREE.MathUtils.clamp(value, 0, 1);
  const handleX = THREE.MathUtils.lerp(
    NUMERICAL_SLIDER_MIN_X,
    NUMERICAL_SLIDER_MAX_X,
    progress
  );

  return (
    <group
      ref={rootRef}
      position={[0, 1.55 + verticalOffset, -0.78]}
      rotation={[0, 0, 0]}
    >
      <mesh position={[0, 0, -0.025]}>
        <boxGeometry args={[1.08, 0.3, 0.05]} />
        <meshBasicMaterial
          color={0x020617}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[0, 0.1, 0.035]}
        fontSize={0.027}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Numerical animation {Math.round(progress * 100)}%
      </Text>

      <mesh position={[0, -0.015, 0.025]}>
        <boxGeometry
          args={[
            NUMERICAL_SLIDER_MAX_X - NUMERICAL_SLIDER_MIN_X,
            0.025,
            0.025,
          ]}
        />
        <meshBasicMaterial color={0x64748b} toneMapped={false} />
      </mesh>

      <mesh position={[NUMERICAL_SLIDER_MIN_X, -0.015, 0.026]}>
        <boxGeometry args={[0.025, 0.105, 0.035]} />
        <meshBasicMaterial color={0xe2e8f0} toneMapped={false} />
      </mesh>

      <mesh position={[NUMERICAL_SLIDER_MAX_X, -0.015, 0.026]}>
        <boxGeometry args={[0.025, 0.105, 0.035]} />
        <meshBasicMaterial color={0xe2e8f0} toneMapped={false} />
      </mesh>

      <group ref={handleRef} position={[handleX, -0.015, 0.055]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 32]} />
          <meshBasicMaterial color={0x22d3ee} toneMapped={false} />
        </mesh>

        <InvisibleCollider
          colliderRef={colliderRef}
          args={[0.14, 0.14, 0.1]}
        />
      </group>

      <Text
        position={[NUMERICAL_SLIDER_MIN_X, -0.105, 0.035]}
        fontSize={0.024}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
      >
        0%
      </Text>

      <Text
        position={[NUMERICAL_SLIDER_MAX_X, -0.105, 0.035]}
        fontSize={0.024}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
      >
        100%
      </Text>
    </group>
  );
}
