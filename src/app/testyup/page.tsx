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

function Ocean() {
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpg");

  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []);

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

    // Up-down movement with sine wave
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 2.5 + 2.5; 
      // ↑ 0.5 = speed, 5 = amplitude
    }
  });

  return <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />;
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
  const { nodes } = useGLTF("/landscape2.glb") as any;
  console.log(nodes)
  const dep = useTexture("/textu/departamental.jpeg");
  const yup1 = useTexture('/textu/auditorio.jpeg')
  const yup2 = useTexture('/textu/biblioteca.jpeg')
  const yup3 = useTexture('/textu/ed2.jpeg')
  const yup4 = useTexture('/textu/ed7.jpeg')
  const yup5 = useTexture('/textu/lidl.jpeg')
  const yup6 = useTexture('/textu/novaId.jpeg')
  const yup7 = useTexture('/textu/tantofaz.jpeg')
  const lander = useTexture('/textu/landscape2.jpg')
  dep.flipY = false;
  yup1.flipY = false
  yup2.flipY = false
  yup3.flipY = false
  yup4.flipY = false
  yup5.flipY = false
  yup6.flipY = false
  yup7.flipY = false
  lander.flipY = false
  return (
    <>
      <group scale={100} position={[0, -2, 0]}>
        <mesh geometry={nodes.Landscape.geometry}>
          <meshBasicMaterial map={lander} />
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
        <Ocean />
        {/* <SpinningBox /> */}
        <Scene />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}
