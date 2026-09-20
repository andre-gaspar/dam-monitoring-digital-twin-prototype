"use client";

import * as React from "react";
import * as THREE from "three";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  OrbitControls,
  Environment,
  useGLTF,
} from "@react-three/drei";
import {
  CameraIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  MapIcon,
  Rotate3DIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DroneCapture = {
  id: string;
  title: string;
  area: string;
  modelUrl?: string;
  status: "available" | "unavailable";
};

const DRONE_CAPTURES: DroneCapture[] = [
  {
    id: "embankment-01",
    title: "Captura 01",
    area: "",
    modelUrl: "/droner.glb",
    status: "available",
  },
  {
    id: "upstream-face-01",
    title: "Captura 02",
    area: "",
    status: "unavailable",
  },
  {
    id: "downstream-valley-01",
    title: "Captura 03",
    area: "",
    status: "unavailable",
  },
];

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}

function VertexColorDroneModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  const scene = React.useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (!isMesh(child)) return;

      const geometry = child.geometry as THREE.BufferGeometry;
      const hasVertexColors = Boolean(geometry.getAttribute("color"));

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else if (child.material) {
        child.material.dispose();
      }

      child.material = new THREE.MeshBasicMaterial({
        vertexColors: hasVertexColors,
        color: hasVertexColors ? 0xffffff : 0x999999,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      console.log(child.name || "drone mesh", {
        hasVertexColors,
        vertexCount: geometry.getAttribute("position")?.count,
        colorCount: geometry.getAttribute("color")?.count,
      });
    });

    return clonedScene;
  }, [gltf.scene]);

  return <primitive object={scene} />;
}

function DroneScene({ selected }: { selected: DroneCapture }) {
  const modelUrl =
    selected.status === "available" ? selected.modelUrl : undefined;

  return (
    <>
      <color attach="background" args={["#101014"]} />
      <Environment background="only" files="/skyy.hdr" />

      <React.Suspense fallback={null}>
        {modelUrl ? (
          <Bounds fit clip observe margin={1.2}>
            <VertexColorDroneModel url={modelUrl} />
          </Bounds>
        ) : null}
      </React.Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        enableZoom
        enableRotate
        enablePan
      />
    </>
  );
}

export function DroneCaptureViewer() {
  const [selectedCapture, setSelectedCapture] = React.useState<DroneCapture>(
    DRONE_CAPTURES[0]
  );
  const [isMenuOpen, setIsMenuOpen] = React.useState(true);
  const isCaptureAvailable = selectedCapture.status === "available";

  return (
    <div
      lang="pt-PT"
      className="relative h-dvh w-screen overflow-hidden bg-slate-950 text-slate-950"
    >
      <Canvas
        shadows={false}
        camera={{
          position: [70, 55, 90],
          fov: 55,
          near: 0.1,
          far: 100000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
      >
        <DroneScene selected={selectedCapture} />
      </Canvas>

      <Button
        type="button"
        size="icon-lg"
        variant={isMenuOpen ? "secondary" : "default"}
        onClick={() => setIsMenuOpen((current) => !current)}
        className={cn(
          "absolute top-5 z-20 rounded-full shadow-2xl backdrop-blur-md transition-colors duration-300",
          isMenuOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        style={{
          left: isMenuOpen ? "min(392px, calc(100vw - 68px))" : 20,
          transition: "left 280ms ease",
        }}
        aria-label={
          isMenuOpen
            ? "Ocultar menu de capturas"
            : "Mostrar menu de capturas"
        }
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? (
          <ChevronLeftIcon className="size-6" />
        ) : (
          <ChevronRightIcon className="size-6" />
        )}
      </Button>

      <Button
        asChild
        className="absolute right-5 top-5 z-20 rounded-lg border border-white/50 bg-white/90 text-black shadow-2xl backdrop-blur-md hover:bg-white"
      >
        <Link href="/maptest2">
          <MapIcon className="size-4" />
          Voltar ao mapa
        </Link>
      </Button>

      <Button
        asChild
        className="absolute right-5 top-[68px] z-20 rounded-lg border border-white/50 bg-white/90 text-black shadow-2xl backdrop-blur-md hover:bg-white"
      >
        <Link href="/numericaltest">Modelo Numérico</Link>
      </Button>

      <aside
        className="absolute bottom-5 left-5 top-5 z-[9] w-[min(360px,calc(100vw-40px))] transition-[opacity,transform] duration-300 ease-out"
        style={{
          pointerEvents: isMenuOpen ? "auto" : "none",
          opacity: isMenuOpen ? 1 : 0,
          transform: isMenuOpen
            ? "translateX(0)"
            : "translateX(calc(-100% - 32px))",
        }}
        aria-hidden={!isMenuOpen}
        aria-labelledby="drone-captures-heading"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/45 bg-white/92 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black text-white shadow-sm">
                <CameraIcon className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Visualizador 3D
                </p>
                <h1
                  id="drone-captures-heading"
                  className="text-lg font-bold leading-tight"
                >
                  Capturas de drone
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-slate-600">
              Selecione uma captura para explorar o respetivo levantamento.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {DRONE_CAPTURES.map((capture) => {
              const isSelected = capture.id === selectedCapture.id;
              const isAvailable = capture.status === "available";

              return (
                <button
                  key={capture.id}
                  type="button"
                  onClick={() => setSelectedCapture(capture)}
                  disabled={!isMenuOpen}
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-950 hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{capture.title}</p>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          isSelected ? "text-slate-300" : "text-slate-500"
                        )}
                      >
                        {capture.area}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                        isAvailable
                          ? isSelected
                            ? "bg-emerald-300 text-emerald-950"
                            : "bg-emerald-100 text-emerald-800"
                          : isSelected
                            ? "bg-white/12 text-slate-200"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isAvailable ? (
                        <CheckCircle2Icon className="size-3" />
                      ) : (
                        <Clock3Icon className="size-3" />
                      )}
                      {isAvailable ? "Disponível" : "Sem captura ainda"}
                    </span>
                  </div>

                </button>
              );
            })}
          </div>

          <div
            className="border-t border-slate-200 bg-slate-50 px-4 py-3"
            aria-live="polite"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Captura selecionada
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {selectedCapture.title}
                </p>
                <p className="text-xs text-slate-500">{selectedCapture.area}</p>
              </div>
              <span className="text-right text-xs font-semibold text-slate-600">
                {isCaptureAvailable
                  ? "Modelo 3D disponível"
                  : "Sem captura ainda"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {!isCaptureAvailable ? (
        <div className="pointer-events-none absolute inset-0 z-[8] grid place-items-center px-5">
          <div className="w-[min(380px,calc(100vw-40px))] rounded-xl border border-white/50 bg-white/94 p-6 text-center shadow-2xl backdrop-blur-md">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white">
              <CameraIcon className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Sem captura ainda</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ainda não existe um modelo 3D da área “{selectedCapture.area}”.
              Selecione a Captura 01 para visualizar o levantamento disponível.
            </p>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-5 right-5 z-[8] flex max-w-[calc(100vw-40px)] items-center gap-3 rounded-xl border border-white/45 bg-white/92 px-4 py-3 text-sm text-slate-700 shadow-2xl backdrop-blur-md">
          <span className="flex size-9 items-center justify-center rounded-lg bg-black text-white">
            <Rotate3DIcon className="size-4" />
          </span>
          <p>
            Arraste para rodar · Use a roda do rato para aproximar · Botão
            direito para deslocar
          </p>
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/droner.glb");
