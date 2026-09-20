"use client";

import * as THREE from "three";
import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useTexture,
  Environment,
  Clouds,
  Cloud,
  PivotControls,
  TransformControls,
} from "@react-three/drei";
import { Water } from "three-stdlib";

type OceanProps = {
  position?: [number, number, number];
};

function Ocean({ position = [0, 0, 0] }: OceanProps) {
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(76, 76), []);

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0, 1, 0),
      waterColor: 0x3399ff,
      sunColor: 0xffffff,
      distortionScale: 3.7,
      fog: false,
      format: (gl as any).encoding, // keep your working version
    }),
    [waterNormals, (gl as any).encoding]
  );

  const water = useMemo(() => new Water(geom, config), [geom, config]);
  const ref = useRef<THREE.Object3D>(null!);

  useFrame((state, delta) => {
    if (water) water.material.uniforms.time.value += delta;
    if (ref.current) {
      ref.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 1.5 + 1.5;
    }
  });

  return (
    <group position={position}>
      <group rotation={[0, Math.PI / 4 - 0.1, 0]}>
        <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />
      </group>
    </group>
  );
}

function Scene() {
  const { nodes } = useGLTF("/lnec2.glb") as any;

  const lander = useTexture("/textu/gebelim.jpg");
  const lander2 = useTexture("/textu/dammm.jpg");
  lander.flipY = false;
  lander2.flipY = false;

  return (
    <group position={[0, -2, 0]}>
      <mesh geometry={nodes.Terrain.geometry}>
        <meshBasicMaterial map={lander} />
      </mesh>
      <mesh geometry={nodes.Dam.geometry}>
        <meshBasicMaterial map={lander2} />
      </mesh>
    </group>
  );
}

function ControlledCubes({
  onStartDrag,
  onEndDrag,
}: {
  onStartDrag: () => void;
  onEndDrag: () => void;
}) {
  const [tcTarget, setTcTarget] = React.useState<THREE.Group | null>(null);

  const tcRef = React.useCallback((node: THREE.Group | null) => {
    // only set once (prevents extra renders / strict-mode double calls)
    if (node && tcTarget !== node) setTcTarget(node);
  }, [tcTarget]);

  return (
    <>
      {/* Cube A: PivotControls (centered) */}
      <PivotControls
        anchor={[0, 0, 0]}
        depthTest={false}
        fixed
        scale={110}
        lineWidth={3}
        onDragStart={onStartDrag}
        onDragEnd={onEndDrag}
      >
        {/* Position the GROUP, keep mesh at origin so gizmo is centered */}
        <group position={[20, 80, 0]}>
          <mesh>
            <boxGeometry args={[15, 15, 15]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </group>
      </PivotControls>

      {/* Cube B target (group ref) */}
      <group ref={tcRef} position={[-20, 80, 0]}>
        <mesh>
          <boxGeometry args={[15, 15, 15]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </group>

      {/* TransformControls (only render AFTER target exists => no null errors) */}
      {tcTarget && (
        <TransformControls
          mode="translate"
          object={tcTarget}
          onMouseDown={onStartDrag}
          onMouseUp={onEndDrag}
        />
      )}
    </>
  );
}

export default function Page() {
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  return (
    <Canvas
      style={{ width: "100vw", height: "100vh", display: "block" }}
      camera={{ position: [0, 10, 100], fov: 55, near: 1, far: 20000 }}
    >
      <Environment background="only" files="/skyy.hdr" />

      <group position={[0, 800, 0]}>
        <Clouds material={THREE.MeshBasicMaterial}>
          <Cloud
            concentrate="outside"
            speed={0.1}
            growth={100}
            color="#ffffff"
            opacity={1.25}
            seed={0.3}
            bounds={[1000, 100, 1000]}
            volume={400}
          />
        </Clouds>
      </group>

      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={1.2} />

      <Suspense fallback={null}>
        <Ocean position={[0, 58.5, 9]} />
        <Scene />

        <ControlledCubes
          onStartDrag={() => setOrbitEnabled(false)}
          onEndDrag={() => setOrbitEnabled(true)}
        />
      </Suspense>

      {/* makeDefault so other controls can toggle it; enabled toggles during drag */}
      <OrbitControls makeDefault enabled={orbitEnabled} />
    </Canvas>
  );
}

// Optional preload
useGLTF.preload("/lnec2.glb");