import type { MonitoringSensorItem } from "@/components/montesinho9/types";

export type SensorDataKind = "piezometer" | "inclinometer";

export type SensorDataMapping = {
  kind: SensorDataKind;
  instrumentId: string;
};

const SENSOR_DATA_BY_SCENE_TITLE: Record<string, SensorDataMapping> = {
  "PZ-01": { kind: "piezometer", instrumentId: "PP1" },
  "PZ-02": { kind: "piezometer", instrumentId: "PP2" },
  "PZ-03": { kind: "piezometer", instrumentId: "PP3" },
  "IV-01": { kind: "inclinometer", instrumentId: "IV-1" },
  "IV-02": { kind: "inclinometer", instrumentId: "IV-3" },
  "IV-03": { kind: "inclinometer", instrumentId: "IV-5" },
  "II-01": { kind: "inclinometer", instrumentId: "II-2" },
  "II-02": { kind: "inclinometer", instrumentId: "II-4" },
  "II-03": { kind: "inclinometer", instrumentId: "II-6" },
};

export function getSensorDataMapping(
  sensor: MonitoringSensorItem
): SensorDataMapping | null {
  return SENSOR_DATA_BY_SCENE_TITLE[sensor.title] ?? null;
}
