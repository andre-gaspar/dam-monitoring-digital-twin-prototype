"use client";

import * as THREE from "three";
import React, { Suspense, useRef, useMemo, useState, useEffect } from "react";
import {
  Canvas,
  useThree,
  useLoader,
  useFrame,
} from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, Environment, Clouds, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import mqtt, { MqttClient } from "mqtt";

const HOST = process.env.NEXT_PUBLIC_MQTT_HOST; // e.g. yourcluster.s1.eu.hivemq.cloud
const USER = process.env.NEXT_PUBLIC_MQTT_USERNAME;
const PASS = process.env.NEXT_PUBLIC_MQTT_PASSWORD;
const TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "local/#";

type OceanProps = {
  position?: [number, number, number]; // 🟩 define prop type
  drive?: number;
};

function useMqttFeed(limit: number = 100) {
    const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
    >("idle");
    const [messages, setMessages] = useState<
    { topic: string; payload: string; ts: number }[]
    >([]);
    const clientRef = useRef<MqttClient | null>(null);

    const [latestNum, setLatestNum] = useState<number | null>(null);

    const url = useMemo(() => {
    return HOST ? `wss://${HOST}:8884/mqtt` : null; // HiveMQ Cloud WS TLS
    }, []);


    useEffect(() => {
    if (!url || !USER || !PASS) {
    setStatus("idle");
    return;
    }


    setStatus("connecting");
    const client = mqtt.connect(url, {
    username: USER,
    password: PASS,
    protocol: "wss",
    protocolVersion: 4, // MQTT 3.1.1
    reconnectPeriod: 2000,
    clean: true,
    connectTimeout: 10000,
    });


    clientRef.current = client;


    client.on("connect", () => {
    setStatus("connected");
    client.subscribe(TOPIC, { qos: 0 }, (err) => {
    if (err) setStatus("error");
    });
    });


    client.on("reconnect", () => setStatus("reconnecting"));
    client.on("error", () => setStatus("error"));


    client.on("message", (topic, payload) => {
    const text = decode(payload as Uint8Array);
    setMessages((prev) => [{ topic, payload: text, ts: Date.now() }, ...prev].slice(0, limit));

     // 👇 plain numbers 0..24
    const n = Number(text.trim());
    if (Number.isFinite(n)) setLatestNum(Math.max(0, Math.min(24, n)));
    });


    return () => {
    client.end(true);
    clientRef.current = null;
    };
    }, [url]);


    return { status, messages, latestNum };
}
function decode(buf: Uint8Array) {
    try {
    return new TextDecoder().decode(buf);
    } catch {
    try {
    return JSON.stringify(buf);
    } catch {
    return String(buf);
    }
    }
}


function Ocean({ position = [0, 0, 0], drive = 0 }: OceanProps) {
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
console.log(drive);
console.log(drive);
console.log(drive);
  useFrame((_, delta) => {
    if (water) water.material.uniforms.time.value += delta;
    //console.log(ref.current.position.y);
    //ref.current.position.y = 3;
    const yuppp = THREE.MathUtils.clamp((drive / 24) * 3, 0, 3);
    //ref.current.position.y = yuppp;
    const k = 0.01; // 0..1 (higher = faster)
    ref.current.position.y += (yuppp - ref.current.position.y) * k;
    // 🟩 Animate only local Y — parent <group> handles the base offset
    //if (ref.current) {
    //  ref.current.position.y =
    //    Math.sin(state.clock.elapsedTime * 0.5) * 1.5 + 1.5;
    //}
    
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
const { status, messages, latestNum } = useMqttFeed(200);
const drive = latestNum ?? 0;

return (
<div style={{ position: "relative", width: "100vw", height: "100vh" }}>
<Canvas style={{ position: "absolute", inset: 0 }} camera={{ position: [0, 10, 100], fov: 55, near: 1, far: 20000 }}>
<Environment background="only" files="/skyy.hdr" />
<group position={[0, 800, 0]}>
<Clouds material={THREE.MeshBasicMaterial}>
<Cloud concentrate="outside" speed={0.1} growth={100} color="#ffffff" opacity={1.25} seed={0.3} bounds={[1000, 100, 1000]} volume={400} />
</Clouds>
</group>


<Suspense fallback={null}>
<Ocean position={[0, 58.5, 9]} drive={drive} />
<Scene /> 
</Suspense>
<OrbitControls />
</Canvas>


{/* Overlay panel showing live MQTT messages */}
<div
style={{
position: "absolute",
top: 16,
right: 16,
width: 320,
maxHeight: "60vh",
background: "rgba(0,0,0,0.65)",
color: "#fff",
padding: "12px 14px",
borderRadius: 12,
boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
backdropFilter: "blur(6px)",
WebkitBackdropFilter: "blur(6px)",
fontSize: 12,
lineHeight: 1.35,
pointerEvents: "auto",
display: "flex",
flexDirection: "column",
gap: 8,
}}
>
<strong style={{ display: "block" }}>MQTT Feed</strong>
<div style={{ fontSize: 11, opacity: 0.85 }}>
status: <b>{status}</b> • topic: <code>{TOPIC}</code>
</div>
<div
style={{
overflow: "auto",
flex: 1,
borderRadius: 8,
background: "rgba(255,255,255,0.06)",
padding: 8,
}}
>
{messages.length === 0 ? (
<div style={{ opacity: 0.7 }}>No messages yet.</div>
) : (
<ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
{messages.map((m, i) => (
<li key={m.ts + ":" + i}>
<div style={{ opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
<span style={{ opacity: 0.7 }}>{new Date(m.ts).toLocaleTimeString()} · </span>
<code>{m.topic}</code>
</div>
<div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
{m.payload}
</div>
</li>
))}
</ul>
)}
</div>
</div>
</div>
);
}
