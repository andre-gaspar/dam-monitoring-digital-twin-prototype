"use client";

import * as THREE from "three";
import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// ----------------------------
// SENSOR TYPES
// ----------------------------
type MonitoringSensorType =
  | "leveling_mark"
  | "reference_leveling_mark"
  | "piezometer_pneumatic"
  | "inclinometer_vertical"
  | "inclinometer_inclined"
  | "flow_meter"
  | "water_level_gauge";

type MonitoringSensorItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: string;
  lat: number;
  lon: number;
  type?: MonitoringSensorType;
  depth?: number;
  length?: number;
  inclinationDeg?: number;
  azimuthDeg?: number;

  // Manual Three.js local position: [x, y, z]
  // If this exists, the sensor ignores lat/lon mapping.
  manualPosition?: [number, number, number];
};

// ----------------------------
// LEVELING MARKS ON DAM CREST
// ----------------------------
const CREST_LEVELING_START: [number, number, number] = [
  20.728, 14.378, -75.028,
];

const CREST_LEVELING_END: [number, number, number] = [
  57.951, 14.374, -76.129,
];

function createLevelingMarksAlongLine({
  start,
  end,
  count = 12,
}: {
  start: [number, number, number];
  end: [number, number, number];
  count?: number;
}): MonitoringSensorItem[] {
  // Keep all marks visually at the same height.
  const fixedY = Number(((start[1] + end[1]) / 2).toFixed(3));

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);

    const x = Number(THREE.MathUtils.lerp(start[0], end[0], t).toFixed(3));
    const z = Number(THREE.MathUtils.lerp(start[2], end[2], t).toFixed(3));

    const number = String(i + 1).padStart(2, "0");

    return {
      id: `TN-${number}`,
      title: `TN-${number}`,
      description: "Taco de nivelamento no coroamento da barragem.",
      image: `https://avatar.vercel.sh/TN-${number}`,
      badge: "Settlement",
      lat: 0,
      lon: 0,
      type: "leveling_mark",
      manualPosition: [x, fixedY, z],
    };
  });
}

// ----------------------------
// GEO BOUNDS OF YOUR TERRAIN
// Kept here in case later you add sensors by lat/lon instead of manualPosition.
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

// ----------------------------
// SENSOR DATA
// Same sensor placement as your complete digital twin demo.
// ----------------------------
const MONITORING_SENSORS: MonitoringSensorItem[] = [
  {
    id: "sensor-1",
    title: "PZ-01",
    description: "Piezómetro pneumático na fundação.",
    image: "https://avatar.vercel.sh/shadcn1",
    badge: "Piezometer",
    lat: 0,
    lon: 0,
    type: "piezometer_pneumatic",
    depth: 2,
    manualPosition: [27, 7.5, -74.567],
  },
  {
    id: "sensor-11",
    title: "PZ-02",
    description: "Piezómetro pneumático na fundação.",
    image: "https://avatar.vercel.sh/shadcn1",
    badge: "Piezometer",
    lat: 0,
    lon: 0,
    type: "piezometer_pneumatic",
    depth: 2,
    manualPosition: [30, 7.5, -74.567],
  },
  {
    id: "sensor-111",
    title: "PZ-03",
    description: "Piezómetro pneumático na fundação.",
    image: "https://avatar.vercel.sh/shadcn1",
    badge: "Piezometer",
    lat: 0,
    lon: 0,
    type: "piezometer_pneumatic",
    depth: 2,
    manualPosition: [32, 7.5, -74.567],
  },
  {
    id: "sensor-2",
    title: "IV-01",
    description: "Inclinómetro vertical no aterro.",
    image: "https://avatar.vercel.sh/shadcn2",
    badge: "Inclinometer",
    lat: 0,
    lon: 0,
    type: "inclinometer_vertical",
    length: 6,
    manualPosition: [26.613, 14.38, -74.567],
  },
  {
    id: "sensor-22",
    title: "IV-02",
    description: "Inclinómetro vertical no aterro.",
    image: "https://avatar.vercel.sh/shadcn2",
    badge: "Inclinometer",
    lat: 0,
    lon: 0,
    type: "inclinometer_vertical",
    length: 6,
    manualPosition: [29.613, 14.38, -74.567],
  },
  {
    id: "sensor-222",
    title: "IV-03",
    description: "Inclinómetro vertical no aterro.",
    image: "https://avatar.vercel.sh/shadcn2",
    badge: "Inclinometer",
    lat: 0,
    lon: 0,
    type: "inclinometer_vertical",
    length: 6,
    manualPosition: [32.613, 14.38, -74.567],
  },
  {
    id: "sensor-4",
    title: "II-01",
    description: "Inclinómetro inclinado na laje de impermeabilização.",
    image: "https://avatar.vercel.sh/shadcn4",
    badge: "Slab",
    lat: 0,
    lon: 0,
    type: "inclinometer_inclined",
    length: 3,
    inclinationDeg: 32,
    azimuthDeg: 183,
    manualPosition: [26.613, 14.38, -75.567],
  },
  {
    id: "sensor-44",
    title: "II-02",
    description: "Inclinómetro inclinado na laje de impermeabilização.",
    image: "https://avatar.vercel.sh/shadcn4",
    badge: "Slab",
    lat: 0,
    lon: 0,
    type: "inclinometer_inclined",
    length: 3,
    inclinationDeg: 32,
    azimuthDeg: 183,
    manualPosition: [29.613, 14.38, -75.567],
  },
  {
    id: "sensor-444",
    title: "II-03",
    description: "Inclinómetro inclinado na laje de impermeabilização.",
    image: "https://avatar.vercel.sh/shadcn4",
    badge: "Slab",
    lat: 0,
    lon: 0,
    type: "inclinometer_inclined",
    length: 3,
    inclinationDeg: 32,
    azimuthDeg: 183,
    manualPosition: [32.613, 14.38, -75.567],
  },
  {
    id: "sensor-5",
    title: "MC-01",
    description: "Medidor de caudais a jusante.",
    image: "https://avatar.vercel.sh/shadcn5",
    badge: "Flow",
    lat: 0,
    lon: 0,
    type: "flow_meter",
    manualPosition: [29.999, 9.5, -64.73],
  },
  {
    id: "sensor-6",
    title: "NA-01",
    description: "Escala limnimétrica / nível de água.",
    image: "https://avatar.vercel.sh/shadcn6",
    badge: "Water level",
    lat: 0,
    lon: 0,
    type: "water_level_gauge",
    manualPosition: [29.439, 15.755, -89.719],
  },
  {
    id: "TR-01",
    title: "TR-01",
    description: "Taco de nivelamento de referência apoiado no maciço rochoso.",
    image: "https://avatar.vercel.sh/TR-01",
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [61.526, 14.406, -76.936],
  },
  {
    id: "TR-02",
    title: "TR-02",
    description: "Taco de nivelamento de referência apoiado no maciço rochoso.",
    image: "https://avatar.vercel.sh/TR-02",
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [61.481, 14.337, -75.137],
  },
  {
    id: "TR-03",
    title: "TR-03",
    description: "Taco de nivelamento de referência apoiado no maciço rochoso.",
    image: "https://avatar.vercel.sh/TR-03",
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [18.414, 14.813, -74.201],
  },
  {
    id: "TR-04",
    title: "TR-04",
    description: "Taco de nivelamento de referência apoiado no maciço rochoso.",
    image: "https://avatar.vercel.sh/TR-04",
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [18.17, 14.522, -75.97],
  },

  // 12 tacos de nivelamento equidistantes no coroamento.
  ...createLevelingMarksAlongLine({
    start: CREST_LEVELING_START,
    end: CREST_LEVELING_END,
    count: 12,
  }),
];

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

function VertexColorModel({
  url,
  modelRef,
}: {
  url: string;
  modelRef?: React.RefObject<THREE.Object3D | null>;
}) {
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

  return <primitive ref={modelRef} object={scene} />;
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
      // material.uniforms.time.value += delta;
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

// ----------------------------
// SENSOR MARKER LOGIC
// Visual only for this VR phase.
// ----------------------------
function SensorLine({
  points,
  color,
  opacity = 1,
  throughTerrain = false,
}: {
  points: THREE.Vector3[];
  color: number;
  opacity?: number;
  throughTerrain?: boolean;
}) {
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: !throughTerrain,
      depthWrite: false,
      toneMapped: false,
    });

    const line = new THREE.Line(geometry, material);

    if (throughTerrain) {
      line.renderOrder = 10;
    }

    return line;
  }, [points, color, opacity, throughTerrain]);

  useEffect(() => {
    return () => {
      lineObject.geometry.dispose();

      if (Array.isArray(lineObject.material)) {
        lineObject.material.forEach((mat) => mat.dispose());
      } else {
        lineObject.material.dispose();
      }
    };
  }, [lineObject]);

  return <primitive object={lineObject} />;
}

function SensorMarker({
  sensor,
  position,
  surfaceY,
  selected = false,
}: {
  sensor: MonitoringSensorItem;
  position: [number, number, number];
  surfaceY: number;
  selected?: boolean;
}) {
  const type = sensor.type ?? "leveling_mark";
  const depth = sensor.depth ?? 0;
  const length = sensor.length ?? Math.max(depth, 15);

  // Smaller for the 12 crest leveling marks.
  // Other sensors remain larger and easier to identify.
  const S =
    type === "piezometer_pneumatic"
      ? 0.14
      : type === "leveling_mark"
      ? 0.28
      : 0.30;

  const color = (() => {
    if (selected) return 0xffff00;

    switch (type) {
      case "leveling_mark":
        return 0xffaa00;
      case "reference_leveling_mark":
        return 0xffffff;
      case "piezometer_pneumatic":
        return 0x00d4ff;
      case "inclinometer_vertical":
        return 0xa855f7;
      case "inclinometer_inclined":
        return 0xff4fd8;
      case "flow_meter":
        return 0x22c55e;
      case "water_level_gauge":
        return 0x2563eb;
      default:
        return 0xff3333;
    }
  })();

  const undergroundY = -depth;

  const inclinedAngle = THREE.MathUtils.degToRad(sensor.inclinationDeg ?? 28);
  const azimuth = THREE.MathUtils.degToRad(sensor.azimuthDeg ?? 0);

  const inclinedEnd = useMemo(() => {
    const horizontal = Math.sin(inclinedAngle) * length;
    const vertical = Math.cos(inclinedAngle) * length;

    return new THREE.Vector3(
      Math.sin(azimuth) * horizontal,
      -vertical,
      Math.cos(azimuth) * horizontal
    );
  }, [inclinedAngle, azimuth, length]);

  return (
    <group position={[position[0], surfaceY, position[2]]}>
      {/* Surface highlight ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.25 * S, 0]}>
        <ringGeometry
          args={[selected ? 6 * S : 4 * S, selected ? 8 * S : 5.5 * S, 48]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.75 : 0.35}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Leveling marks */}
      {(type === "leveling_mark" || type === "reference_leveling_mark") && (
        <>
          <mesh position={[0, 0.45 * S, 0]}>
            <cylinderGeometry args={[2.2 * S, 2.2 * S, 0.9 * S, 24]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>

          <mesh position={[0, 1.25 * S, 0]}>
            <boxGeometry args={[3.2 * S, 0.35 * S, 3.2 * S]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Pneumatic piezometer */}
      {type === "piezometer_pneumatic" && (
        <>
          <SensorLine
            points={[
              new THREE.Vector3(0, 1.5 * S, 0),
              new THREE.Vector3(0, undergroundY, 0),
            ]}
            color={color}
            opacity={0.9}
            throughTerrain
          />

          <mesh position={[0, 1.25 * S, 0]}>
            <cylinderGeometry args={[2.5 * S, 2.5 * S, 0.7 * S, 24]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.95}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, undergroundY, 0]}>
            <sphereGeometry args={[3.2 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, undergroundY - 1, 0]}>
            <cylinderGeometry args={[1.1 * S, 1.1 * S, 2, 16]} />
            <meshBasicMaterial
              color={0x99f6e4}
              transparent
              opacity={0.65}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Vertical inclinometer */}
      {type === "inclinometer_vertical" && (
        <>
          <mesh position={[0, -length / 2, 0]}>
            <cylinderGeometry args={[0.9 * S, 0.9 * S, length, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.55}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {Array.from({ length: Math.floor(length / 3) + 1 }).map((_, i) => (
            <mesh
              key={i}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, -i * 3, 0]}
            >
              <torusGeometry args={[2.0 * S, 0.15 * S, 8, 32]} />
              <meshBasicMaterial
                color={0xffffff}
                transparent
                opacity={0.85}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}

          <mesh position={[0, 1.5 * S, 0]}>
            <cylinderGeometry args={[2.7 * S, 2.7 * S, 0.8 * S, 24]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Inclined inclinometer */}
      {type === "inclinometer_inclined" && (
        <>
          <SensorLine
            points={[new THREE.Vector3(0, 0.8 * S, 0), inclinedEnd]}
            color={color}
            opacity={0.95}
            throughTerrain
          />

          <mesh position={[0, 0.8 * S, 0]}>
            <sphereGeometry args={[2.6 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[inclinedEnd.x, inclinedEnd.y, inclinedEnd.z]}>
            <sphereGeometry args={[2.2 * S, 24, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.8}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Flow meter */}
      {type === "flow_meter" && (
        <>
          <mesh position={[0, 0.3 * S, 0]}>
            <boxGeometry args={[8 * S, 0.6 * S, 5 * S]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.75}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[5 * S, 0.3 * S, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.8 * S, 0.8 * S, 7 * S, 16]} />
            <meshBasicMaterial color={0x93c5fd} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Water level gauge */}
      {type === "water_level_gauge" && (
        <>
          <mesh position={[0, 8 * S, 0]}>
            <cylinderGeometry args={[0.45 * S, 0.45 * S, 16 * S, 16]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>

          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[1.2 * S, (i * 3 + 1) * S, 0]}>
              <boxGeometry args={[2.2 * S, 0.18 * S, 0.18 * S]} />
              <meshBasicMaterial color={0xffffff} toneMapped={false} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function WorldScene() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);

  const [sensorPositions, setSensorPositions] = useState<
    {
      sensor: MonitoringSensorItem;
      position: [number, number, number];
      surfaceY: number;
    }[]
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
  }, [gltf.scene]);

  useEffect(() => {
    if (!modelRef.current || !groupRef.current) return;

    const raycaster = new THREE.Raycaster();

    const nextPositions = MONITORING_SENSORS.map((sensor) => {
      if (sensor.manualPosition) {
        return {
          sensor,
          surfaceY: sensor.manualPosition[1],
          position: sensor.manualPosition,
        };
      }

      const { x, z } = geoToLocal(sensor.lon, sensor.lat, modelBounds);

      const localOrigin = new THREE.Vector3(x, modelBounds.max.y + 500, z);
      const worldOrigin = groupRef.current!.localToWorld(localOrigin.clone());

      raycaster.set(worldOrigin, new THREE.Vector3(0, -1, 0));

      const hits = raycaster.intersectObject(modelRef.current!, true);

      if (hits.length > 0) {
        const hitWorld = hits[0].point.clone();
        const hitLocal = groupRef.current!.worldToLocal(hitWorld);

        return {
          sensor,
          surfaceY: hitLocal.y,
          position: [hitLocal.x, hitLocal.y, hitLocal.z] as [
            number,
            number,
            number
          ],
        };
      }

      return {
        sensor,
        surfaceY: modelBounds.max.y,
        position: [x, modelBounds.max.y, z] as [number, number, number],
      };
    });

    setSensorPositions(nextPositions);
  }, [modelBounds]);

  return (
    <group position={WORLD_OFFSET}>
      <group ref={groupRef} position={SCENE_GROUP_POSITION}>
        <VertexColorModel url={MODEL_URL} modelRef={modelRef} />
        <Ocean position={WATER_POSITION} />

        {sensorPositions.map((marker) => (
          <SensorMarker
            key={marker.sensor.id}
            sensor={marker.sensor}
            position={marker.position}
            surfaceY={marker.surfaceY}
          />
        ))}
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
        Quest 3 full-scale GLB + water + sensors test — press ENTER VR
      </div>
    </main>
  );
}

useGLTF.preload(MODEL_URL);