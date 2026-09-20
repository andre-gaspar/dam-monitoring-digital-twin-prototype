"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { Water } from "three-stdlib";
import { VRButton } from "three/addons/webxr/VRButton.js";

// ----------------------------
// FILES
// ----------------------------
const MODEL_URL = "/montesinholayersDecim.glb";

// ----------------------------
// VR SPAWN
// This is your desired model/local coordinate.
// The scene is offset so your headset starts around this point.
// ----------------------------
const SPAWN_LOCAL: [number, number, number] = [32, 18, -75];

// Approximate headset eye height.
// If you feel too high/low in VR, adjust this.
const USER_EYE_HEIGHT = 1.6;

// Same scene offset as your original code.
const SCENE_GROUP_POSITION: [number, number, number] = [0, -2, 0];

// Offset the whole world so the user's VR head starts at SPAWN_LOCAL.
const WORLD_OFFSET: [number, number, number] = [
  -(SPAWN_LOCAL[0] + SCENE_GROUP_POSITION[0]),
  USER_EYE_HEIGHT - (SPAWN_LOCAL[1] + SCENE_GROUP_POSITION[1]),
  -(SPAWN_LOCAL[2] + SCENE_GROUP_POSITION[2]),
];

// ----------------------------
// WATER SETTINGS
// Same as your original code.
// ----------------------------
const WATER_LEVEL_Y = 13.8125;
const WATER_POSITION: [number, number, number] = [45, WATER_LEVEL_Y, -150];
const WATER_SIZE_X = 90;
const WATER_SIZE_Z = 150;
const WATER_ROTATION_Y = 0;

function WebXRSetup() {
  const { gl } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");

    // Quest-friendly. Try 0.85 or 1.0 later if performance is good.
    gl.xr.setFramebufferScaleFactor(2.5);

    const button = VRButton.createButton(gl, {
      optionalFeatures: ["local-floor", "bounded-floor"],
    });

    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl]);

  return null;
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    // Desktop preview position. In VR, the headset controls the camera.
    camera.position.set(0, USER_EYE_HEIGHT, 0);
    camera.lookAt(0, USER_EYE_HEIGHT, -1);
  }, [camera]);

  return null;
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function getFirstMaterial(
  material: THREE.Material | THREE.Material[] | undefined
) {
  if (!material) return null;
  return Array.isArray(material) ? material[0] ?? null : material;
}

function makeUnlitMaterialForMesh(mesh: THREE.Mesh) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const hasVertexColors = Boolean(geometry.getAttribute("color"));

  const oldMaterial = getFirstMaterial(mesh.material);
  const oldAsStandard = oldMaterial as THREE.MeshStandardMaterial | null;

  const fallbackColor = new THREE.Color(0x999999);

  const materialColor =
    oldAsStandard?.color instanceof THREE.Color
      ? oldAsStandard.color.clone()
      : fallbackColor;

  const materialMap =
    oldAsStandard && "map" in oldAsStandard ? oldAsStandard.map : null;

  const opacity =
    typeof oldMaterial?.opacity === "number" ? oldMaterial.opacity : 1;

  const isWaterFromModel = mesh.name.toLowerCase().includes("water");

  const transparent =
    Boolean(oldMaterial?.transparent) || opacity < 1 || isWaterFromModel;

  const material = new THREE.MeshBasicMaterial({
    vertexColors: hasVertexColors,
    color: hasVertexColors ? 0xffffff : materialColor,
    map: hasVertexColors ? null : materialMap,
    transparent,
    opacity,
    depthWrite: !transparent,

    // Same as your original code.
    // For more performance later, try THREE.FrontSide.
    side: THREE.DoubleSide,

    toneMapped: false,
  });

  return { material, hasVertexColors };
}

function VertexColorModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    let meshCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      meshCount += 1;

      const geometry = child.geometry as THREE.BufferGeometry;
      const { material, hasVertexColors } = makeUnlitMaterialForMesh(child);

      child.material = material;
      child.castShadow = false;
      child.receiveShadow = false;

      // Same as your original code.
      // Since your model has very few meshes, this is okay for testing.
      child.frustumCulled = false;

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const position = geometry.getAttribute("position");
      const index = geometry.getIndex();

      if (position) vertexCount += position.count;
      if (index) triangleCount += index.count / 3;
      else if (position) triangleCount += position.count / 3;

      console.log(child.name || "mesh", {
        hasVertexColors,
        vertexCount: position?.count,
        colorCount: geometry.getAttribute("color")?.count,
      });
    });

    console.log("VR GLB loaded", {
      meshCount,
      vertexCount,
      triangleCount: Math.round(triangleCount),
    });

    return clonedScene;
  }, [gltf.scene]);

  return <primitive object={scene} />;
}

type OceanProps = {
  position?: [number, number, number];
};

function Ocean({ position = [0, 0, 0] }: OceanProps) {
  const waterNormals = useLoader(THREE.TextureLoader, "/waternormals.jpg");

  waterNormals.wrapS = THREE.RepeatWrapping;
  waterNormals.wrapT = THREE.RepeatWrapping;
  waterNormals.colorSpace = THREE.NoColorSpace;

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(WATER_SIZE_X, WATER_SIZE_Z),
    []
  );

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      alpha: 0.58,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x3399ff,
      distortionScale: 3.7,
      fog: false,
    }),
    [waterNormals]
  );

  const water = useMemo(() => {
    const waterObject = new Water(geometry, config);

    waterObject.material.transparent = true;
    waterObject.material.depthWrite = false;
    waterObject.material.toneMapped = false;

    // Prevent the water plane from blocking terrain picking later.
    waterObject.raycast = () => {};

    return waterObject;
  }, [geometry, config]);

  const ref = useRef<THREE.Object3D>(null!);

  useFrame((state, delta) => {
    const material = water.material as THREE.ShaderMaterial;

    if (material.uniforms?.time) {
      //material.uniforms.time.value += delta;
      material.uniforms.time.value += delta * 0.15;
    }

    if (ref.current) {
      ref.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.18 + 0.08;
    }
  });

  return (
    <group position={position}>
      <group rotation={[0, WATER_ROTATION_Y, 0]}>
        <primitive ref={ref} object={water} rotation-x={-Math.PI / 2} />
      </group>
    </group>
  );
}

function WorldScene() {
  return (
    <group position={WORLD_OFFSET}>
      <group position={SCENE_GROUP_POSITION}>
        <VertexColorModel url={MODEL_URL} />
        <Ocean position={WATER_POSITION} />
      </group>
    </group>
  );
}

function SimpleVRScene() {
  return (
    <>
      <WebXRSetup />
      <CameraSetup />

      {/* Cloudy background only. No scene lighting contribution. */}
      <Suspense fallback={null}>
        <Environment background="only" files="/skyy.hdr" />
      </Suspense>

      <Suspense fallback={null}>
        <WorldScene />
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
        background: "black",
      }}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{
          position: [0, USER_EYE_HEIGHT, 0],
          fov: 70,
          near: 0.05,

          // Bigger than before because now the model is full scale.
          far: 2000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000");
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <SimpleVRScene />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          background: "rgba(0,0,0,0.5)",
          padding: "10px 14px",
          borderRadius: 10,
          pointerEvents: "none",
        }}
      >
        Quest 3 full-scale GLB + water test — press ENTER VR
      </div>
    </main>
  );
}

useGLTF.preload(MODEL_URL);