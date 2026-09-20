"use client";

import * as React from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

type DamLocation = {
  id: string;
  name: string;
  location: string;
  position: LatLngTuple;
  description: string;
  viewerPath: string;
  guidePath?: string;
};

const dams: DamLocation[] = [
  {
    id: "gebelim",
    name: "Barragem de Gebelim",
    location: "Gebelim",
    position: [41.437298876163176, -6.910101331748632],
    description: "Localização da Barragem de Gebelim.",
    viewerPath: "/gebelimfiltersimplified",
  },
  {
    id: "veiguinhas",
    name: "Barragem de Veiguinhas",
    location: "Montesinho",
    position: [41.9525037709923, -6.803694733771176],
    description: "Localização da Barragem de Veiguinhas.",
    viewerPath: "/montesinho11",
    guidePath: "/montesinho11guide",
  },
  {
    id: "aguieira",
    name: "Barragem da Aguieira",
    location: "Aguieira",
    position: [40.34033401362938, -8.196708787508904],
    description: "Localização da Barragem da Aguieira.",
    viewerPath: "/aguieiratst",
  },
];

const initialCenter: LatLngTuple = [41.22, -7.3];

const damIcon = L.divIcon({
  className: "",
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
  html: `
    <div style="
      width:36px;
      height:44px;
      position:relative;
      filter:drop-shadow(0 8px 10px rgba(0,0,0,0.24));
    ">
      <div style="
        width:34px;
        height:34px;
        border-radius:999px 999px 999px 4px;
        transform:rotate(-45deg);
        background:#05519A;
        border:3px solid white;
        position:absolute;
        left:1px;
        top:0;
      "></div>
      <div style="
        position:absolute;
        left:9px;
        top:10px;
        width:18px;
        height:12px;
        border-left:4px solid white;
        border-right:4px solid white;
        border-bottom:5px solid white;
        box-sizing:border-box;
      "></div>
    </div>
  `,
});

function FlyToDam({ dam }: { dam: DamLocation }) {
  const map = useMap();

  React.useEffect(() => {
    map.flyTo(dam.position, 12, {
      animate: true,
      duration: 0.8,
    });
  }, [dam, map]);

  return null;
}

export default function DamLeafletMap() {
  const router = useRouter();
  const [selectedDamId, setSelectedDamId] = React.useState(dams[0].id);

  const selectedDam = React.useMemo(() => {
    return dams.find((dam) => dam.id === selectedDamId) ?? dams[0];
  }, [selectedDamId]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-950">
      <MapContainer
        center={initialCenter}
        zoom={8}
        minZoom={7}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; Colaboradores do OpenStreetMap"
        />

        <FlyToDam dam={selectedDam} />

        {dams.map((dam) => (
          <Marker
            key={dam.id}
            position={dam.position}
            icon={damIcon}
            eventHandlers={{
              click: () => setSelectedDamId(dam.id),
            }}
          >
            <Popup>
              <div className="w-52 space-y-2">
                <div>
                  <div className="text-sm font-bold text-neutral-950">
                    {dam.name}
                  </div>
                  <div className="text-xs text-neutral-500">{dam.location}</div>
                </div>
                <div className="text-xs text-neutral-700">
                  {dam.description}
                </div>
                <div className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-700">
                  {dam.position[0].toFixed(6)}, {dam.position[1].toFixed(6)}
                </div>
                <div className={dam.guidePath ? "grid grid-cols-2 gap-2" : "grid"}>
                  <button
                    type="button"
                    onClick={() => router.push(dam.viewerPath)}
                    className="w-full rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700"
                  >
                    Visualização 3D
                  </button>
                  {dam.guidePath ? (
                    <button
                      type="button"
                      onClick={() => router.push(dam.guidePath!)}
                      className="w-full rounded-md bg-[#05519A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#043f78]"
                    >
                      Modo guiado
                    </button>
                  ) : null}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <section className="pointer-events-none absolute inset-x-3 top-3 z-[1000] sm:inset-x-auto sm:left-4 sm:top-4 sm:w-80">
        <div className="pointer-events-auto rounded-xl border border-white/40 bg-white/95 p-3 text-black shadow-2xl backdrop-blur-md">
          <div className="mb-3">
            <div className="text-sm font-extrabold">Localização das barragens</div>
            <div className="text-xs text-neutral-600">
              Selecione uma barragem para centrar o mapa.
            </div>
          </div>

          <div className="grid gap-2">
            {dams.map((dam) => {
              const isSelected = dam.id === selectedDam.id;

              return (
                <button
                  key={dam.id}
                  type="button"
                  onClick={() => setSelectedDamId(dam.id)}
                  className={[
                    "rounded-lg border px-3 py-2 text-left transition",
                    isSelected
                      ? "border-[#05519A] bg-[#05519A] text-white shadow-md"
                      : "border-black/10 bg-white text-black hover:bg-neutral-100",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">{dam.name}</span>
                    <span
                      className={[
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        isSelected ? "bg-white" : "bg-[#05519A]",
                      ].join(" ")}
                    />
                  </div>
                  <div
                    className={[
                      "mt-0.5 text-xs",
                      isSelected ? "text-white/80" : "text-neutral-500",
                    ].join(" ")}
                  >
                    {dam.location}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
