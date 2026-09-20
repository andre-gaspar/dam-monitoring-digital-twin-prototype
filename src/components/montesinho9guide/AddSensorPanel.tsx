"use client";

import { PlusIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { SENSOR_CARD_IMAGES } from "@/components/montesinho9/initialSensors";
import type {
  MonitoringSensorItem,
  MonitoringSensorType,
} from "@/components/montesinho9/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GEO_BOUNDS } from "@/components/montesinho9/constants";
import { cn } from "@/lib/utils";
import type { GuideLanguage } from "./guideContent";

type SensorTypeOption = {
  type: MonitoringSensorType;
  label: string;
  badge: string;
  image: string;
  defaults?: Pick<
    MonitoringSensorItem,
    "depth" | "length" | "inclinationDeg" | "azimuthDeg"
  >;
};

const SENSOR_TYPE_OPTIONS: SensorTypeOption[] = [
  {
    type: "piezometer_pneumatic",
    label: "Pneumatic piezometer",
    badge: "Piezometer",
    image: SENSOR_CARD_IMAGES.piezometer,
    defaults: { depth: 4 },
  },
  {
    type: "inclinometer_vertical",
    label: "Vertical inclinometer",
    badge: "Inclinometer",
    image: SENSOR_CARD_IMAGES.inclinometerVertical,
    defaults: { length: 8 },
  },
  {
    type: "inclinometer_inclined",
    label: "Inclined inclinometer",
    badge: "Slab",
    image: SENSOR_CARD_IMAGES.inclinometerInclined,
    defaults: { length: 5, inclinationDeg: 32, azimuthDeg: 183 },
  },
  {
    type: "flow_meter",
    label: "Flow meter",
    badge: "Flow",
    image: SENSOR_CARD_IMAGES.flowMeter,
  },
  {
    type: "water_level_gauge",
    label: "Water level gauge",
    badge: "Water level",
    image: SENSOR_CARD_IMAGES.waterLevelGauge,
  },
  {
    type: "leveling_mark",
    label: "Leveling mark",
    badge: "Settlement",
    image: SENSOR_CARD_IMAGES.levelingMark,
  },
  {
    type: "reference_leveling_mark",
    label: "Reference leveling mark",
    badge: "Reference",
    image: SENSOR_CARD_IMAGES.levelingMark,
  },
];

type AddSensorPanelProps = {
  createdCount: number;
  language: GuideLanguage;
  onCreateSensor: (sensor: MonitoringSensorItem) => void;
};

const ADD_SENSOR_COPY = {
  en: {
    addSensor: "Add sensor",
    sensorName: "Sensor name",
    sensorType: "Sensor type",
    useCoordinates: "Use coordinate input",
    longitude: "Longitude",
    latitude: "Latitude",
    bounds: "Bounds",
    cancel: "Cancel",
    create: "Create",
    nameError: "Give the sensor a name before adding it.",
    numberError: "Longitude and latitude must be valid numbers.",
    boundsError: "Coordinates must be inside the two loaded tile bounds.",
  },
  pt: {
    addSensor: "Adicionar sensor",
    sensorName: "Nome do sensor",
    sensorType: "Tipo de sensor",
    useCoordinates: "Usar introdução de coordenadas",
    longitude: "Longitude",
    latitude: "Latitude",
    bounds: "Limites",
    cancel: "Cancelar",
    create: "Criar",
    nameError: "Dê um nome ao sensor antes de o adicionar.",
    numberError: "A longitude e a latitude têm de ser números válidos.",
    boundsError: "As coordenadas têm de estar dentro dos limites dos dois tiles carregados.",
  },
} satisfies Record<GuideLanguage, Record<string, string>>;

function isCoordinateInsideBounds(lon: number, lat: number) {
  return (
    lon >= GEO_BOUNDS.minLon &&
    lon <= GEO_BOUNDS.maxLon &&
    lat >= GEO_BOUNDS.minLat &&
    lat <= GEO_BOUNDS.maxLat
  );
}

function createFallbackPosition(index: number): [number, number, number] {
  const column = index % 5;
  const row = Math.floor(index / 5);

  return [
    Number((24 + column * 6).toFixed(3)),
    15.2,
    Number((-66 - row * 5).toFixed(3)),
  ];
}

export function AddSensorPanel({
  createdCount,
  language,
  onCreateSensor,
}: AddSensorPanelProps) {
  const copy = ADD_SENSOR_COPY[language];
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sensorName, setSensorName] = useState("");
  const [selectedType, setSelectedType] =
    useState<MonitoringSensorType>("piezometer_pneumatic");
  const [useCoordinates, setUseCoordinates] = useState(true);
  const [longitude, setLongitude] = useState("-6.800200");
  const [latitude, setLatitude] = useState("41.956900");
  const [error, setError] = useState<string | null>(null);

  const selectedOption = useMemo(
    () =>
      SENSOR_TYPE_OPTIONS.find((option) => option.type === selectedType) ??
      SENSOR_TYPE_OPTIONS[0],
    [selectedType]
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedName = sensorName.trim();

    if (!trimmedName) {
      setError(copy.nameError);
      return;
    }

    const newSensorBase: MonitoringSensorItem = {
      id: `guide-sensor-${Date.now()}`,
      title: trimmedName,
      description: `Guide-created ${selectedOption.label.toLowerCase()}.`,
      image: selectedOption.image,
      badge: selectedOption.badge,
      lat: 0,
      lon: 0,
      type: selectedOption.type,
      ...selectedOption.defaults,
    };

    if (useCoordinates) {
      const lon = Number(longitude);
      const lat = Number(latitude);

      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        setError(copy.numberError);
        return;
      }

      if (!isCoordinateInsideBounds(lon, lat)) {
        setError(copy.boundsError);
        return;
      }

      onCreateSensor({
        ...newSensorBase,
        lon,
        lat,
      });
    } else {
      onCreateSensor({
        ...newSensorBase,
        manualPosition: createFallbackPosition(createdCount),
      });
    }

    setSensorName("");
    setError(null);
    setIsFormOpen(false);
  }

  return (
    <div className="mt-5 rounded-md border border-cyan-200/25 bg-cyan-300/10 p-3">
      {!isFormOpen ? (
        <Button
          type="button"
          className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          onClick={() => setIsFormOpen(true)}
        >
          <PlusIcon className="size-4" />
          {copy.addSensor}
        </Button>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="guide-sensor-name" className="text-white">
              {copy.sensorName}
            </Label>
            <Input
              id="guide-sensor-name"
              value={sensorName}
              onChange={(event) => setSensorName(event.target.value)}
              placeholder="PZ-New-01"
              className="border-white/20 bg-white/95 text-slate-950 placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guide-sensor-type" className="text-white">
              {copy.sensorType}
            </Label>
            <select
              id="guide-sensor-type"
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value as MonitoringSensorType)
              }
              className="h-9 w-full rounded-md border border-white/20 bg-white/95 px-3 text-sm text-slate-950 outline-none"
            >
              {SENSOR_TYPE_OPTIONS.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-white">
            <input
              type="checkbox"
              checked={useCoordinates}
              onChange={(event) => setUseCoordinates(event.target.checked)}
              className="size-4 accent-cyan-300"
            />
            {copy.useCoordinates}
          </label>

          <div
            className={cn(
              "grid grid-cols-2 gap-2",
              !useCoordinates && "pointer-events-none opacity-45"
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="guide-sensor-lon" className="text-white">
                {copy.longitude}
              </Label>
              <Input
                id="guide-sensor-lon"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                className="border-white/20 bg-white/95 text-slate-950"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guide-sensor-lat" className="text-white">
                {copy.latitude}
              </Label>
              <Input
                id="guide-sensor-lat"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                className="border-white/20 bg-white/95 text-slate-950"
              />
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-300">
            {copy.bounds}: lon {GEO_BOUNDS.minLon} to {GEO_BOUNDS.maxLon}, lat{" "}
            {GEO_BOUNDS.minLat} to {GEO_BOUNDS.maxLat}.
          </p>

          {error ? <p className="text-xs text-red-200">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsFormOpen(false);
                setError(null);
              }}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            >
              {copy.create}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
