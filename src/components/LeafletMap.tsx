"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import { useRouter } from "next/navigation";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const center: LatLngTuple = [41.437298876163176, -6.910101331748632];

const urlOf = (img: any) => (typeof img === "string" ? img : img?.src);

const DefaultIcon = L.icon({
  iconRetinaUrl: urlOf(markerIcon2x),
  iconUrl: urlOf(markerIcon),
  shadowUrl: urlOf(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LeafletMap() {
  const router = useRouter();

  return (
    <div className="h-screen w-full">
      <MapContainer center={center} zoom={12} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={center} icon={DefaultIcon}>
          <Popup>
            <div className="space-y-2">
              <div className="font-medium">Gebelim Dam</div>
              <button
                className="rounded-md border px-3 py-1 text-sm"
                onClick={() => router.push("/gismos2")}
              >
                Open 3D viewer
              </button>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}