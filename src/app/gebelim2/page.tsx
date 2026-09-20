"use client";

import * as THREE from "three";
import React, { Suspense, useRef, useMemo } from "react";
import {
  Canvas,
  useThree,
  useLoader,
  useFrame,
} from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, Environment, Clouds, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";

type OceanProps = {
  position?: [number, number, number]; // 🟩 define prop type
};


function Ocean({ position = [0, 0, 0] }: OceanProps) {
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpg");

  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(76, 76), []);

  const config = useMemo(() => ({
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(0, 1, 0),
    waterColor: 0x3399ff, // bright, watery blue
    sunColor: 0xffffff,  // natural white sun
    distortionScale: 3.7,
    fog: false,
    format: (gl as any).encoding,
  }), [waterNormals, (gl as any).encoding]);

  const water = useMemo(() => new Water(geom, config), [geom, config]);
  const ref = useRef<THREE.Object3D>(null!);

  useFrame((state, delta) => {
    if (water) water.material.uniforms.time.value += delta;

    // 🟩 Animate only local Y — parent <group> handles the base offset
    if (ref.current) {
      ref.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 1.5 + 1.5;
    }
  });

  //return <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />;
  // 🔑 Outer group: rotate around world Y (change Math.PI/4 to your angle)
  return (
    <group position={position}>
      <group rotation={[0, Math.PI / 4 - 0.1, 0]}>
        {/* Inner primitive: lays the plane flat */}
        <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />
      </group>
    </group>
  );
}

function SpinningBox() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.7;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 50, 0]}>
      <boxGeometry args={[50, 50, 50]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
function Scene() {
  //const { nodes } = useGLTF("/fctverse.glb") as any;
  const { nodes } = useGLTF("/lnec2.glb") as any;
  console.log(nodes)
  const lander = useTexture('/textu/gebelim.jpg')
  const lander2 = useTexture('/textu/dammm.jpg')
  lander.flipY = false
  lander2.flipY = false
  return (
    <>
      <group position={[0, -2, 0]}>
        <mesh geometry={nodes.Terrain.geometry}>
          <meshBasicMaterial map={lander} />
        </mesh>
        <mesh geometry={nodes.Dam.geometry}>
          <meshBasicMaterial map={lander2} />
        </mesh>
        {/*<mesh geometry={nodes.departamental.geometry}>
          <meshBasicMaterial map={dep} />
        </mesh>
        <mesh geometry={nodes.auditorio.geometry}>
          <meshBasicMaterial map={yup1} />
        </mesh>
        <mesh geometry={nodes.biblioteca.geometry}>
          <meshBasicMaterial map={yup2} />
        </mesh>
        <mesh geometry={nodes.ed2.geometry}>
          <meshBasicMaterial map={yup3} />
        </mesh>
        <mesh geometry={nodes.ed7.geometry}>
          <meshBasicMaterial map={yup4} />
        </mesh>
        <mesh geometry={nodes.lidl.geometry}>
          <meshBasicMaterial map={yup5} />
        </mesh>
        <mesh geometry={nodes.novaId.geometry}>
          <meshBasicMaterial map={yup6} />
        </mesh>
        <mesh geometry={nodes.tantofaz.geometry}>
          <meshBasicMaterial map={yup7} />
        </mesh>*/}
      </group>
    </>
  );
}
export default function Page() {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh', display: 'block' }}
      camera={{ position: [0, 10, 100], fov: 55, near: 1, far: 20000 }}
    >
      <Environment
        background="only" // can be true, false or "only" (which only sets the background) (default: false)
        files="/skyy.hdr"
      />
      <group position={[0, 800, 0]} >
        <Clouds material={THREE.MeshBasicMaterial}>
          {/*<Cloud scale={5} segments={40} bounds={[10, 2, 2]} volume={10} color="orange" />*/}
          {/*<Cloud seed={1} scale={10} volume={5} color="hotpink" fade={100} />*/}
          <Cloud concentrate="outside" speed={0.10} growth={100} color="#ffffff" opacity={1.25} seed={0.3} bounds={[1000, 100, 1000]} volume={400} />
        </Clouds>
      </group>
      {/*}
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 100]} intensity={1} />
      {*/}
      
      <Suspense fallback={null}>
        <Ocean position={[0, 58.5, 9]} />
        {/* <SpinningBox /> */}
        <Scene />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}