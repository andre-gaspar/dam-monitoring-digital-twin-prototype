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

import { Button } from "@/components/ui/button";
import { IpiDashboard } from "@/components/IpiDashboard";

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
      format: (gl as any).encoding,
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

  const tcRef = React.useCallback(
    (node: THREE.Group | null) => {
      if (node && tcTarget !== node) setTcTarget(node);
    },
    [tcTarget]
  );

  return (
    <>
      <PivotControls
        anchor={[0, 0, 0]}
        depthTest={false}
        fixed
        scale={110}
        lineWidth={3}
        onDragStart={onStartDrag}
        onDragEnd={onEndDrag}
      >
        <group position={[20, 80, 0]}>
          <mesh>
            <boxGeometry args={[15, 15, 15]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </group>
      </PivotControls>

      <group ref={tcRef} position={[-20, 80, 0]}>
        <mesh>
          <boxGeometry args={[15, 15, 15]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </group>

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
  const [dashOpen, setDashOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen">
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 170, 150], fov: 55, near: 1, far: 20000 }}
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

        <OrbitControls makeDefault enabled={orbitEnabled} target={[0, 90, 0]}/>
      </Canvas>

      {/* Toggle button overlay */}
      <div className="absolute left-4 top-4 z-50">
        <Button onClick={() => setDashOpen((v) => !v)}>
          {dashOpen ? "Close dashboard" : "Open dashboard"}
        </Button>
      </div>

      {/* Dashboard overlay */}
      {dashOpen && (
        <div className="absolute right-4 top-4 z-50 w-[min(500px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-auto">
          <IpiDashboard />
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/lnec2.glb");