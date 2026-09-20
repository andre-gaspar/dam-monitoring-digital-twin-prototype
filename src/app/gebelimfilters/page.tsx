"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useTexture,
  Environment,
  Clouds,
  Cloud,
} from "@react-three/drei";
import { MapIcon } from "lucide-react";
import { ResizableDemo } from "@/components/Spliter3";
import {
  ScrollableCardSidebar,
  type SensorItem,
} from "@/components/ScrollableCardList";
import { NewSensorForm } from "@/components/NewSensorForm";
import { SimulationRunsManager } from "@/components/SimulationRunsManager";
import { Button } from "@/components/ui/button";

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
  const terrainRef = useRef<THREE.Mesh>(null);
  const [sensorCubePositions, setSensorCubePositions] = useState<
    { id: string; position: [number, number, number] }[]
  >([]);

  const { nodes: countdownNodes } = useGLTF("/countdown.glb") as any;
  const { nodes: countupNodes } = useGLTF("/countup2.glb") as any;

  const countdownTexture = useTexture("/textu/countdown.jpg");
  const countupTexture = useTexture("/textu/countupper.jpg");

  countdownTexture.flipY = false;
  countupTexture.flipY = false;

  countdownTexture.colorSpace = THREE.SRGBColorSpace;
  countupTexture.colorSpace = THREE.SRGBColorSpace;

  const activeGeometry = showCountup
    ? countupNodes.gebelimraw.geometry
    : countdownNodes.gebelimgreen.geometry;

  const activeTexture = showCountup ? countupTexture : countdownTexture;

  const activeBounds = useMemo(() => {
    activeGeometry.computeBoundingBox();
    return activeGeometry.boundingBox!.clone();
  }, [activeGeometry]);

  useEffect(() => {
    if (!terrainRef.current || !groupRef.current) return;

    const raycaster = new THREE.Raycaster();

    const nextPositions = sensors.map((sensor) => {
      const { x, z } = geoToLocal(sensor.lon, sensor.lat, activeBounds);

      const localOrigin = new THREE.Vector3(x, activeBounds.max.y + 500, z);
      const worldOrigin = groupRef.current!.localToWorld(localOrigin.clone());

      raycaster.set(worldOrigin, new THREE.Vector3(0, -1, 0));

      const hits = raycaster.intersectObject(terrainRef.current!, false);

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
        position: [x, activeBounds.max.y + 8, z] as [number, number, number],
      };
    });

    setSensorCubePositions(nextPositions);
  }, [sensors, activeBounds, showCountup]);

  useEffect(() => {
    if (!focusedSensor) return;

    const { x, z } = geoToLocal(
      focusedSensor.lon,
      focusedSensor.lat,
      activeBounds
    );
    const y = activeBounds.max.y + 8;

    camera.position.set(x + 35, y + 35, z + 35);

    if (controlsRef.current) {
      controlsRef.current.target.set(x, y - 2, z);
      controlsRef.current.update();
    }
  }, [focusedSensor, activeBounds, camera, controlsRef]);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <mesh
        ref={terrainRef}
        key={showCountup ? "countup" : "countdown"}
        geometry={activeGeometry}
      >
        <meshBasicMaterial map={activeTexture} toneMapped={false} />
      </mesh>

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
          <meshStandardMaterial color="red" />
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
      <Button
        asChild
        className="absolute right-5 top-5 z-20 rounded-lg border border-white/50 bg-white/90 text-black shadow-2xl backdrop-blur-md hover:bg-white"
      >
        <Link href="/maptest2">
          <MapIcon className="size-4" />
          Voltar ao mapa
        </Link>
      </Button>

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
        New Sensor
      </button>
      <button
        onClick={() => setIsRunsManagerOpen(true)}
        style={{
          position: "absolute",
          top: 120,
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
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 80, 140], fov: 55, near: 1, far: 20000 }}
      >
        <Environment background="only" files="/skyy.hdr" />

        <ambientLight intensity={1} />
        <directionalLight position={[100, 100, 100]} intensity={1.5} />

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

        <OrbitControls ref={controlsRef} target={[70, -2, -70]} maxPolarAngle={Math.PI / 2.05} />
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
