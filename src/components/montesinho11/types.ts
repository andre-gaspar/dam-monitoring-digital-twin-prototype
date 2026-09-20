import type * as THREE from "three";
import type { SensorItem } from "@/components/ScrollableCardList";

export type WaterLevelRow = {
  timestamp: string;
  level: number | null;
};

export type ApiResponse =
  | {
      ok: true;
      data: WaterLevelRow[];
    }
  | {
      ok: false;
      error: string;
    };

export type WaterStats = {
  count: number;
  min: number;
  max: number;
  latest: number;
};

export type MonitoringSensorType =
  | "leveling_mark"
  | "reference_leveling_mark"
  | "piezometer_pneumatic"
  | "inclinometer_vertical"
  | "inclinometer_inclined"
  | "flow_meter"
  | "water_level_gauge";

export type MonitoringSensorItem = SensorItem & {
  type?: MonitoringSensorType;
  depth?: number;
  length?: number;
  inclinationDeg?: number;
  azimuthDeg?: number;
  manualPosition?: [number, number, number];
};

export type OrbitControlsRef = {
  target: THREE.Vector3;
  update: () => void;
} | null;
