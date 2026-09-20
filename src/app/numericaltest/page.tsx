"use client";

import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { MapIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const MODEL_PATH = "/numericalmodelanim2.glb";
const LAST_FRAME = 30;

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function timeAtFrame(clip: THREE.AnimationClip, frame: number) {
  const timeline = clip.tracks.reduce<THREE.KeyframeTrack | null>(
    (longest, track) =>
      !longest || track.times.length > longest.times.length ? track : longest,
    null
  );

  if (!timeline || timeline.times.length === 0) {
    return THREE.MathUtils.lerp(0, clip.duration, frame / LAST_FRAME);
  }

  const samplePosition =
    (frame / LAST_FRAME) * Math.max(timeline.times.length - 1, 0);
  const lowerIndex = Math.floor(samplePosition);
  const upperIndex = Math.min(
    Math.ceil(samplePosition),
    timeline.times.length - 1
  );
  const blend = samplePosition - lowerIndex;

  return THREE.MathUtils.lerp(
    timeline.times[lowerIndex],
    timeline.times[upperIndex],
    blend
  );
}

function NumericalModel({ frame }: { frame: number }) {
  const gltf = useGLTF(MODEL_PATH);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const preparedModel = useMemo(() => {
    const root = gltf.scene.clone(true);
    const materials: THREE.MeshBasicMaterial[] = [];

    root.traverse((object) => {
      if (!isMesh(object)) return;

      const hasVertexColors = object.geometry.hasAttribute("color");
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
      materials.push(material);
    });

    return { root, materials };
  }, [gltf.scene]);

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

    actionRef.current.time = timeAtFrame(clip, frame);
    mixerRef.current.update(0);
  }, [clip, frame, preparedModel.root]);

  return <primitive object={preparedModel.root} />;
}

useGLTF.preload(MODEL_PATH);

export default function NumericalTestPage() {
  const [frame, setFrame] = useState(0);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Button
        asChild
        className="absolute right-5 top-5 z-20 rounded-lg border border-white/50 bg-white/90 text-black shadow-2xl backdrop-blur-md hover:bg-white"
      >
        <Link href="/maptest2">
          <MapIcon className="size-4" />
          Voltar ao mapa
        </Link>
      </Button>

      <Canvas
        shadows={false}
        camera={{ position: [3, 2, 3], fov: 50, near: 0.01, far: 100000 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <Environment background="only" files="/skyy.hdr" />

          <Bounds fit clip margin={1.2}>
            <NumericalModel frame={frame} />
          </Bounds>
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 24,
          zIndex: 10,
          width: "min(420px, calc(100vw - 40px))",
          transform: "translateX(-50%)",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          padding: "14px 16px",
          color: "#111111",
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <label htmlFor="animation-frame">Animation frame</label>
          <output htmlFor="animation-frame">
            {frame} / {LAST_FRAME}
          </output>
        </div>

        <input
          id="animation-frame"
          type="range"
          min={0}
          max={LAST_FRAME}
          step={1}
          value={frame}
          onChange={(event) => setFrame(Number(event.target.value))}
          style={{ display: "block", width: "100%", cursor: "pointer" }}
        />
      </div>
    </main>
  );
}
