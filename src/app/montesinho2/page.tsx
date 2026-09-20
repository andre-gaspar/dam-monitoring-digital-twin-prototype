"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Clouds,
  Cloud,
} from "@react-three/drei";
import { Water } from "three-stdlib";

import { ResizableDemo } from "@/components/Spliter3";
import {
  ScrollableCardSidebar,
  type SensorItem,
} from "@/components/ScrollableCardList";
import { NewSensorForm } from "@/components/NewSensorForm";
import { SimulationRunsManager } from "@/components/SimulationRunsManager";

// ----------------------------
// FILES
// ----------------------------
const MODEL_URL = "/nochilling.glb";

// ----------------------------
// WATER SETTINGS
// Blender Z becomes Three.js Y after GLB export.
// Your cota 1220 water level was Blender Z = 13.8125.
// The whole scene group is moved down by -2, so keep water inside that group.
// ----------------------------
const WATER_LEVEL_Y = 13.8125;
const WATER_POSITION: [number, number, number] = [0, WATER_LEVEL_Y, 0];
const WATER_SIZE_X = 200;
const WATER_SIZE_Z = 200;
const WATER_ROTATION_Y = Math.PI / 4 - 0.1;

// ----------------------------
// GEO BOUNDS OF YOUR TERRAIN
// ----------------------------
const GEO_BOUNDS = {
  minLon: -6.912542,
  maxLon: -6.900748,
  minLat: 41.435708,
  maxLat: 41.444837,
};

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function geoToLocal(lon: number, lat: number, bounds: THREE.Box3) {
  const x = mapRange(
    lon,
    GEO_BOUNDS.minLon,
    GEO_BOUNDS.maxLon,
    bounds.min.x,
    bounds.max.x
  );

  const z = mapRange(
    lat,
    GEO_BOUNDS.minLat,
    GEO_BOUNDS.maxLat,
    bounds.max.z,
    bounds.min.z
  );

  return { x, z };
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
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  return { material, hasVertexColors };
}

function VertexColorModel({
  url,
  modelRef,
}: {
  url: string;
  modelRef: React.RefObject<THREE.Object3D | null>;
}) {
  const gltf = useGLTF(url);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;
      const { material, hasVertexColors } = makeUnlitMaterialForMesh(child);

      child.material = material;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      console.log(child.name || "mesh", {
        hasVertexColors,
        vertexCount: geometry.getAttribute("position")?.count,
        colorCount: geometry.getAttribute("color")?.count,
      });
    });

    return clonedScene;
  }, [gltf.scene]);

  return <primitive ref={modelRef} object={scene} />;
}

type OceanProps = {
  position?: [number, number, number];
};

function Ocean({ position = [0, 0, 0] }: OceanProps) {
  const gl = useThree((state) => state.gl);
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

    return waterObject;
  }, [geometry, config]);

  const ref = useRef<THREE.Object3D>(null!);

  useFrame((state, delta) => {
    if (water.material.uniforms.time) {
      water.material.uniforms.time.value += delta;
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

function Scene({
  showCountup,
  onCubeClick,
  focusedSensor,
  controlsRef,
  sensors,
}: {
  showCountup: boolean;
  onCubeClick: () => void;
  focusedSensor: SensorItem | null;
  controlsRef: React.RefObject<any>;
  sensors: SensorItem[];
}) {
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);

  const [sensorCubePositions, setSensorCubePositions] = useState<
    { id: string; position: [number, number, number] }[]
  >([]);

  const gltf = useGLTF(MODEL_URL);

  const modelBounds = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clonedScene);

    if (box.isEmpty()) {
      return new THREE.Box3(
        new THREE.Vector3(-500, 0, -500),
        new THREE.Vector3(500, 100, 500)
      );
    }

    return box;
  }, [gltf.scene, showCountup]);

  useEffect(() => {
    if (!modelRef.current || !groupRef.current) return;

    const raycaster = new THREE.Raycaster();

    const nextPositions = sensors.map((sensor) => {
      const { x, z } = geoToLocal(sensor.lon, sensor.lat, modelBounds);

      const localOrigin = new THREE.Vector3(x, modelBounds.max.y + 500, z);
      const worldOrigin = groupRef.current!.localToWorld(localOrigin.clone());

      raycaster.set(worldOrigin, new THREE.Vector3(0, -1, 0));

      const hits = raycaster.intersectObject(modelRef.current!, true);

      if (hits.length > 0) {
        const hitWorld = hits[0].point.clone();
        const hitLocal = groupRef.current!.worldToLocal(hitWorld);

        return {
          id: sensor.id,
          position: [hitLocal.x, hitLocal.y + 3, hitLocal.z] as [
            number,
            number,
            number
          ],
        };
      }

      return {
        id: sensor.id,
        position: [x, modelBounds.max.y + 8, z] as [number, number, number],
      };
    });

    setSensorCubePositions(nextPositions);
  }, [sensors, modelBounds, showCountup]);

  useEffect(() => {
    if (!focusedSensor) return;

    const { x, z } = geoToLocal(
      focusedSensor.lon,
      focusedSensor.lat,
      modelBounds
    );

    const y = modelBounds.max.y + 8;

    camera.position.set(x + 35, y + 35, z + 35);

    if (controlsRef.current) {
      controlsRef.current.target.set(x, y - 2, z);
      controlsRef.current.update();
    }
  }, [focusedSensor, modelBounds, camera, controlsRef]);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <VertexColorModel url={MODEL_URL} modelRef={modelRef} />

      <Ocean position={WATER_POSITION} />

      {sensorCubePositions.map((cube) => (
        <mesh
          key={cube.id}
          position={cube.position}
          onClick={(e) => {
            e.stopPropagation();
            onCubeClick();
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <boxGeometry args={[6, 6, 6]} />
          <meshBasicMaterial color="red" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Page() {
  const controlsRef = useRef<any>(null);

  const [showCountup, setShowCountup] = useState(false);
  const [isSlipterOpen, setIsSlipterOpen] = useState(false);
  const [focusedSensor, setFocusedSensor] = useState<SensorItem | null>(null);
  const [isCreateSensorOpen, setIsCreateSensorOpen] = useState(false);
  const [isRunsManagerOpen, setIsRunsManagerOpen] = useState(false);

  const [sensors, setSensors] = useState<SensorItem[]>([
    {
      id: "sensor-1",
      title: "Sensor A1",
      description: "Test sensor on the terrain.",
      image: "https://avatar.vercel.sh/shadcn1",
      badge: "Active",
      lat: 41.438029790514456,
      lon: -6.904858274077607,
    },
    {
      id: "sensor-2",
      title: "Sensor B3",
      description: "Another test card in the sidebar.",
      image: "https://avatar.vercel.sh/shadcn2",
      badge: "Warning",
      lat: 41.437905122229715,
      lon: -6.904954833597143,
    },
  ]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <button
        onClick={() => setShowCountup((prev) => !prev)}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          padding: "12px 18px",
          background: "white",
          color: "black",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Switch to {showCountup ? "Categorization" : "Terrain"}
      </button>

      <button
        onClick={() => setIsCreateSensorOpen(true)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          padding: "12px 18px",
          background: "white",
          color: "black",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        New Sensor
      </button>

      <button
        onClick={() => setIsRunsManagerOpen(true)}
        style={{
          position: "absolute",
          top: 70,
          right: 20,
          zIndex: 10,
          padding: "12px 18px",
          background: "white",
          color: "black",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Simulation Manager
      </button>

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 20,
          bottom: 20,
          width: 360,
          zIndex: 9,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
            background: "transparent",
          }}
        >
          <ScrollableCardSidebar
            items={sensors}
            onCardClick={(sensor) => setFocusedSensor(sensor)}
          />
        </div>
      </div>

      <Canvas
        shadows={false}
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 80, 140], fov: 55, near: 1, far: 100000 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Environment background="only" files="/skyy.hdr" />

        <group position={[30, 10, 0]}>
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

        <Suspense fallback={null}>
          <Scene
            showCountup={showCountup}
            onCubeClick={() => setIsSlipterOpen(true)}
            focusedSensor={focusedSensor}
            controlsRef={controlsRef}
            sensors={sensors}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[70, -2, -70]}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {isRunsManagerOpen && (
        <div
          onClick={() => setIsRunsManagerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1400px, 96vw)",
              height: "min(92vh, 1000px)",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setIsRunsManagerOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1001,
                border: "none",
                background: "#111",
                color: "white",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>

            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                padding: "24px",
              }}
            >
              <SimulationRunsManager />
            </div>
          </div>
        </div>
      )}

      {isCreateSensorOpen && (
        <div
          onClick={() => setIsCreateSensorOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(700px, 92vw)",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              position: "relative",
              padding: "24px",
            }}
          >
            <button
              onClick={() => setIsCreateSensorOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1001,
                border: "none",
                background: "#111",
                color: "white",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>

            <NewSensorForm
              onCreateSensor={(sensor) => {
                setSensors((prev) => [sensor, ...prev]);
                setIsCreateSensorOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {isSlipterOpen && (
        <div
          onClick={() => setIsSlipterOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1200px, 95vw)",
              height: "min(90vh, 900px)",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setIsSlipterOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1001,
                border: "none",
                background: "#111",
                color: "white",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>

            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                padding: "24px",
              }}
            >
              <ResizableDemo />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(MODEL_URL);