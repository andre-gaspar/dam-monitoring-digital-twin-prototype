"use client";

import * as THREE from "three";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useGLTF } from "@react-three/drei";
import { RainEffect } from "@/components/RainEffect";
import { InvisibleCollider } from "@/components/vrtest9/VRBasics";
import {
  LAKEBED_MODEL_URL,
  MODEL_URL,
  RAIN_AREA_CENTER_Y_OFFSET,
  RAIN_AREA_SIZE_X,
  RAIN_AREA_SIZE_Y,
  RAIN_AREA_SIZE_Z,
  RAIN_CLOUD_BOUNDS,
  RAIN_CLOUD_Y_OFFSET,
  TWO_TILES_MODEL_URL,
  WATER_POSITION,
  WATER_SIZE_X,
  WATER_SIZE_Z,
} from "@/components/montesinho11/constants";
import { initialSensors } from "@/components/montesinho11/initialSensors";
import { Ocean } from "@/components/montesinho11/Ocean";
import { RainCloudLayer } from "@/components/montesinho11/RainCloudLayer";
import { SensorMarker } from "@/components/montesinho11/SensorMarker";
import { VertexColorModel } from "@/components/montesinho11/VertexColorModel";
import type { MonitoringSensorItem } from "@/components/montesinho11/types";
import { geoToLocal, isMesh } from "@/components/montesinho11/utils";

import {
  AGUIEIRA_MINIATURE_MODEL_URL,
  DEFAULT_MINIATURE_MODEL,
  DRONE_MINIATURE_MODEL_URL,
  GEBELIM_MINIATURE_MODEL_URL,
  MINIATURE_INITIAL_POSITION,
  NUMERICAL_ANIMATION_LAST_FRAME,
  NUMERICAL_MINIATURE_MODEL_URL,
  SCENE_GROUP_POSITION,
  WORLD_OFFSET,
  type MiniatureModelKey,
} from "./constants";

const MINI_TERRAIN_TARGET_SIZE = 1.15;
const MINIATURE_COLLIDER_PADDING = 0.05;

type SensorPosition = {
  sensor: MonitoringSensorItem;
  position: [number, number, number];
  surfaceY: number;
};

function VRAlternateMiniature({
  url,
  position,
}: {
  url: string;
  position: [number, number, number];
}) {
  const gltf = useGLTF(url);

  const transform = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clonedScene);

    if (bounds.isEmpty()) {
      return {
        position: [0, 0, 0] as [number, number, number],
        scale: 1,
      };
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    return {
      position: [-center.x, -bounds.min.y, -center.z] as [
        number,
        number,
        number
      ],
      scale:
        MINI_TERRAIN_TARGET_SIZE / Math.max(size.x, size.z, Number.EPSILON),
    };
  }, [gltf.scene]);

  return (
    <group position={position} scale={transform.scale}>
      <group position={transform.position}>
        <VertexColorModel url={url} />
      </group>
    </group>
  );
}

function VRInteractiveMiniature({
  url,
  position,
  draggableRef,
  colliderRef,
}: {
  url: string;
  position: [number, number, number];
  draggableRef: RefObject<THREE.Group | null>;
  colliderRef: RefObject<THREE.Mesh | null>;
}) {
  const gltf = useGLTF(url);
  const modelRef = useRef<THREE.Object3D | null>(null);

  const transform = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clonedScene);

    if (bounds.isEmpty()) {
      return {
        position: [0, 0, 0] as [number, number, number],
        scale: 1,
        size: [1, 0.2, 1] as [number, number, number],
      };
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const scale =
      MINI_TERRAIN_TARGET_SIZE /
      Math.max(size.x, size.z, Number.EPSILON);

    return {
      position: [-center.x, -bounds.min.y, -center.z] as [
        number,
        number,
        number
      ],
      scale,
      size: [size.x * scale, size.y * scale, size.z * scale] as [
        number,
        number,
        number
      ],
    };
  }, [gltf.scene]);

  useEffect(() => {
    modelRef.current?.traverse((child) => {
      if (!isMesh(child)) return;

      // Interaction is handled exclusively by the lightweight box below.
      child.raycast = () => {};
      child.frustumCulled = true;
    });
  }, [gltf.scene]);

  const colliderSize: [number, number, number] = [
    Math.max(transform.size[0] + MINIATURE_COLLIDER_PADDING, 0.1),
    Math.max(transform.size[1] + MINIATURE_COLLIDER_PADDING, 0.18),
    Math.max(transform.size[2] + MINIATURE_COLLIDER_PADDING, 0.1),
  ];

  return (
    <group ref={draggableRef} position={position}>
      <group scale={transform.scale}>
        <group position={transform.position}>
          <VertexColorModel url={url} modelRef={modelRef} />
        </group>
      </group>

      <InvisibleCollider
        colliderRef={colliderRef}
        args={colliderSize}
        position={[0, transform.size[1] / 2, 0]}
      />
    </group>
  );
}

function numericalTimeAtFrame(clip: THREE.AnimationClip, frame: number) {
  const timeline = clip.tracks.reduce<THREE.KeyframeTrack | null>(
    (longest, track) =>
      !longest || track.times.length > longest.times.length ? track : longest,
    null
  );
  const progress =
    THREE.MathUtils.clamp(frame, 0, NUMERICAL_ANIMATION_LAST_FRAME) /
    NUMERICAL_ANIMATION_LAST_FRAME;

  if (!timeline || timeline.times.length === 0) {
    return THREE.MathUtils.lerp(0, clip.duration, progress);
  }

  const samplePosition = progress * Math.max(timeline.times.length - 1, 0);
  const lowerIndex = Math.floor(samplePosition);
  const upperIndex = Math.min(
    Math.ceil(samplePosition),
    timeline.times.length - 1
  );

  return THREE.MathUtils.lerp(
    timeline.times[lowerIndex],
    timeline.times[upperIndex],
    samplePosition - lowerIndex
  );
}

function VRNumericalMiniature({
  frame,
  position,
  draggableRef,
  colliderRef,
}: {
  frame: number;
  position: [number, number, number];
  draggableRef: RefObject<THREE.Group | null>;
  colliderRef: RefObject<THREE.Mesh | null>;
}) {
  const gltf = useGLTF(NUMERICAL_MINIATURE_MODEL_URL);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const preparedModel = useMemo(() => {
    const root = gltf.scene.clone(true);
    const materials: THREE.MeshBasicMaterial[] = [];

    root.traverse((object) => {
      if (!isMesh(object)) return;

      const geometry = object.geometry as THREE.BufferGeometry;
      const hasVertexColors = geometry.hasAttribute("color");
      const material = new THREE.MeshBasicMaterial({
        color: hasVertexColors ? 0xffffff : 0xaaaaaa,
        vertexColors: hasVertexColors,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      object.material = material;
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = false;
      object.raycast = () => {};
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      materials.push(material);
    });

    root.updateMatrixWorld(true);
    return { root, materials };
  }, [gltf.scene]);

  const transform = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(preparedModel.root);

    if (bounds.isEmpty()) {
      return {
        position: [0, 0, 0] as [number, number, number],
        scale: 1,
        size: [1, 0.2, 1] as [number, number, number],
      };
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const scale =
      MINI_TERRAIN_TARGET_SIZE /
      Math.max(size.x, size.z, Number.EPSILON);

    return {
      position: [-center.x, -bounds.min.y, -center.z] as [
        number,
        number,
        number
      ],
      scale,
      size: [size.x * scale, size.y * scale, size.z * scale] as [
        number,
        number,
        number
      ],
    };
  }, [preparedModel.root]);

  const clip = gltf.animations[0];

  useEffect(() => {
    return () => {
      preparedModel.materials.forEach((material) => material.dispose());
    };
  }, [preparedModel]);

  useEffect(() => {
    if (!clip || clip.tracks.length === 0) return;

    const mixer = new THREE.AnimationMixer(preparedModel.root);
    const action = mixer.clipAction(clip);

    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    action.paused = true;

    mixerRef.current = mixer;
    actionRef.current = action;

    return () => {
      action.stop();
      mixer.stopAllAction();
      mixer.uncacheRoot(preparedModel.root);
      actionRef.current = null;
      mixerRef.current = null;
    };
  }, [clip, preparedModel.root]);

  useEffect(() => {
    if (!clip || !actionRef.current || !mixerRef.current) return;

    actionRef.current.time = numericalTimeAtFrame(clip, frame);
    mixerRef.current.update(0);
  }, [clip, frame, preparedModel.root]);

  const colliderSize: [number, number, number] = [
    Math.max(transform.size[0] + MINIATURE_COLLIDER_PADDING, 0.1),
    Math.max(transform.size[1] + MINIATURE_COLLIDER_PADDING, 0.18),
    Math.max(transform.size[2] + MINIATURE_COLLIDER_PADDING, 0.1),
  ];

  return (
    <group ref={draggableRef} position={position}>
      <group scale={transform.scale}>
        <group position={transform.position}>
          <primitive object={preparedModel.root} />
        </group>
      </group>

      <InvisibleCollider
        colliderRef={colliderRef}
        args={colliderSize}
        position={[0, transform.size[1] / 2, 0]}
      />
    </group>
  );
}

type VRMontesinhoWorldProps = {
  rainIntensity: number;
  waterLevelY: number;
  focusedSensor: MonitoringSensorItem | null;
  travelOffset: [number, number, number];
  miniMode?: boolean;
  miniatureModel?: MiniatureModelKey;
  gebelimMiniatureRef: RefObject<THREE.Group | null>;
  gebelimMiniatureColliderRef: RefObject<THREE.Mesh | null>;
  droneMiniatureRef: RefObject<THREE.Group | null>;
  droneMiniatureColliderRef: RefObject<THREE.Mesh | null>;
  numericalMiniatureRef: RefObject<THREE.Group | null>;
  numericalMiniatureColliderRef: RefObject<THREE.Mesh | null>;
  numericalAnimationFrame: number;
  verticalOffset?: number;
  showClassificationTiles?: boolean;
  onSensorFocus: (sensor: MonitoringSensorItem) => void;
};

export function VRMontesinhoWorld({
  rainIntensity,
  waterLevelY,
  focusedSensor,
  travelOffset,
  miniMode = false,
  miniatureModel = DEFAULT_MINIATURE_MODEL,
  gebelimMiniatureRef,
  gebelimMiniatureColliderRef,
  droneMiniatureRef,
  droneMiniatureColliderRef,
  numericalMiniatureRef,
  numericalMiniatureColliderRef,
  numericalAnimationFrame,
  verticalOffset = 0,
  showClassificationTiles = false,
  onSensorFocus,
}: VRMontesinhoWorldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const lakebedModelRef = useRef<THREE.Object3D | null>(null);
  const [sensorPositions, setSensorPositions] = useState<SensorPosition[]>([]);
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

  const modelSize = useMemo(() => {
    const size = new THREE.Vector3();
    modelBounds.getSize(size);
    return size;
  }, [modelBounds]);

  const modelCenter = useMemo(() => {
    const center = new THREE.Vector3();
    modelBounds.getCenter(center);
    return center;
  }, [modelBounds]);

  const miniScale = useMemo(() => {
    const footprintSize = Math.max(modelSize.x, modelSize.z, 1);
    return THREE.MathUtils.clamp(
      MINI_TERRAIN_TARGET_SIZE / footprintSize,
      0.0015,
      0.04
    );
  }, [modelSize.x, modelSize.z]);

  const rainAreaCenter = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_AREA_CENTER_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  const rainCloudPosition = useMemo<[number, number, number]>(
    () => [
      WATER_POSITION[0],
      waterLevelY + RAIN_CLOUD_Y_OFFSET,
      WATER_POSITION[2],
    ],
    [waterLevelY]
  );

  useEffect(() => {
    if (!modelRef.current || !groupRef.current) return;
    const raycaster = new THREE.Raycaster();

    const nextPositions = initialSensors.map((sensor) => {
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

  const worldPosition = useMemo<[number, number, number]>(() => {
    if (miniMode) {
      return [
        MINIATURE_INITIAL_POSITION[0],
        MINIATURE_INITIAL_POSITION[1] + verticalOffset,
        MINIATURE_INITIAL_POSITION[2],
      ];
    }

    return [
      WORLD_OFFSET[0] + travelOffset[0],
      WORLD_OFFSET[1] + travelOffset[1] + verticalOffset,
      WORLD_OFFSET[2] + travelOffset[2],
    ];
  }, [miniMode, travelOffset, verticalOffset]);

  const sceneGroupPosition = useMemo<[number, number, number]>(() => {
    if (!miniMode) return SCENE_GROUP_POSITION;

    return [-modelCenter.x, -modelBounds.min.y, -modelCenter.z];
  }, [miniMode, modelBounds.min.y, modelCenter.x, modelCenter.z]);

  const markerVisualScale = miniMode
    ? THREE.MathUtils.clamp(0.02 / miniScale, 5, 24) / 3
    : 1;

  const staticMiniatureUrl =
    miniatureModel === "aguieira"
      ? AGUIEIRA_MINIATURE_MODEL_URL
      : null;

  const interactiveMiniatureConfig =
    miniatureModel === "gebelim"
      ? {
          url: GEBELIM_MINIATURE_MODEL_URL,
          draggableRef: gebelimMiniatureRef,
          colliderRef: gebelimMiniatureColliderRef,
        }
      : miniatureModel === "drone"
      ? {
          url: DRONE_MINIATURE_MODEL_URL,
          draggableRef: droneMiniatureRef,
          colliderRef: droneMiniatureColliderRef,
        }
      : null;

  if (miniMode && miniatureModel === "numerical") {
    return (
      <VRNumericalMiniature
        frame={numericalAnimationFrame}
        position={worldPosition}
        draggableRef={numericalMiniatureRef}
        colliderRef={numericalMiniatureColliderRef}
      />
    );
  }

  if (miniMode && interactiveMiniatureConfig) {
    return (
      <VRInteractiveMiniature
        key={miniatureModel}
        url={interactiveMiniatureConfig.url}
        position={worldPosition}
        draggableRef={interactiveMiniatureConfig.draggableRef}
        colliderRef={interactiveMiniatureConfig.colliderRef}
      />
    );
  }

  if (miniMode && staticMiniatureUrl) {
    return (
      <VRAlternateMiniature
        key={miniatureModel}
        url={staticMiniatureUrl}
        position={worldPosition}
      />
    );
  }

  return (
    <group position={worldPosition} scale={miniMode ? miniScale : 1}>
      <group ref={groupRef} position={sceneGroupPosition}>
        <VertexColorModel url={MODEL_URL} modelRef={modelRef} />
        {showClassificationTiles ? (
          <VertexColorModel url={TWO_TILES_MODEL_URL} modelRef={undefined} />
        ) : null}
        <VertexColorModel url={LAKEBED_MODEL_URL} modelRef={lakebedModelRef} />

        <Ocean position={[WATER_POSITION[0], waterLevelY, WATER_POSITION[2]]} />

        <RainCloudLayer
          rainIntensity={rainIntensity}
          position={rainCloudPosition}
          bounds={RAIN_CLOUD_BOUNDS}
        />

        <RainEffect
          enabled={rainIntensity > 0}
          intensity={rainIntensity}
          dropCount={miniMode ? 800 : 2600}
          areaCenter={rainAreaCenter}
          areaSize={[RAIN_AREA_SIZE_X, RAIN_AREA_SIZE_Y, RAIN_AREA_SIZE_Z]}
          dropLength={2.8}
          fallSpeed={38}
          wind={[3.5, -1.2]}
          opacity={0.38}
          splashesEnabled
          waterSurfaceY={waterLevelY}
          waterCenter={[WATER_POSITION[0], WATER_POSITION[2]]}
          waterSize={[WATER_SIZE_X, WATER_SIZE_Z]}
          rippleCount={70}
        />

        {sensorPositions.map((marker) => (
          <SensorMarker
            key={marker.sensor.id}
            sensor={marker.sensor}
            position={marker.position}
            surfaceY={marker.surfaceY}
            selected={focusedSensor?.id === marker.sensor.id}
            visualScale={markerVisualScale}
            flowMeterRotation={[0, -Math.PI / 2, 0]}
            onClick={() => onSensorFocus(marker.sensor)}
          />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
useGLTF.preload(TWO_TILES_MODEL_URL);
useGLTF.preload(LAKEBED_MODEL_URL);
useGLTF.preload(NUMERICAL_MINIATURE_MODEL_URL);
