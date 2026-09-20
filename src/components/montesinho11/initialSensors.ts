import * as THREE from "three";
import {
  CREST_LEVELING_END,
  CREST_LEVELING_START,
} from "./constants";
import type { MonitoringSensorItem } from "./types";

export const SENSOR_CARD_IMAGES = {
  piezometer: "/sensors/piezometer-groundwater.jpg",
  inclinometerVertical: "/sensors/inclinometer-vertical.jpg",
  inclinometerInclined: "/sensors/inclinometer-inclined.jpg",
  flowMeter: "/sensors/flow-meter.jpg",
  waterLevelGauge: "/sensors/water-level-gauge.jpg",
  levelingMark: "/sensors/survey-marker.jpg",
} as const;

function createLevelingMarksAlongLine({
  start,
  end,
  count = 12,
}: {
  start: [number, number, number];
  end: [number, number, number];
  count?: number;
}): MonitoringSensorItem[] {
  const fixedY = Number(((start[1] + end[1]) / 2).toFixed(3));

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);

    const x = Number(THREE.MathUtils.lerp(start[0], end[0], t).toFixed(3));
    const z = Number(THREE.MathUtils.lerp(start[2], end[2], t).toFixed(3));

    const number = String(i + 1).padStart(2, "0");

    return {
      id: `TN-${number}`,
      title: `TN-${number}`,
      description: "Leveling mark on the dam crest.",
      image: SENSOR_CARD_IMAGES.levelingMark,
      badge: "Settlement",
      lat: 0,
      lon: 0,
      type: "leveling_mark",
      manualPosition: [x, fixedY, z],
    };
  });
}

export const initialSensors: MonitoringSensorItem[] = [
  {
    id: "sensor-1",
    title: "PZ-01",
    description: "Pneumatic piezometer in the foundation.",
    image: SENSOR_CARD_IMAGES.piezometer,
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
    description: "Pneumatic piezometer in the foundation.",
    image: SENSOR_CARD_IMAGES.piezometer,
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
    description: "Pneumatic piezometer in the foundation.",
    image: SENSOR_CARD_IMAGES.piezometer,
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
    description: "Vertical inclinometer in the embankment.",
    image: SENSOR_CARD_IMAGES.inclinometerVertical,
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
    description: "Vertical inclinometer in the embankment.",
    image: SENSOR_CARD_IMAGES.inclinometerVertical,
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
    description: "Vertical inclinometer in the embankment.",
    image: SENSOR_CARD_IMAGES.inclinometerVertical,
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
    description: "Inclined inclinometer in the waterproofing slab.",
    image: SENSOR_CARD_IMAGES.inclinometerInclined,
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
    description: "Inclined inclinometer in the waterproofing slab.",
    image: SENSOR_CARD_IMAGES.inclinometerInclined,
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
    description: "Inclined inclinometer in the waterproofing slab.",
    image: SENSOR_CARD_IMAGES.inclinometerInclined,
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
    description: "Downstream flow meter.",
    image: SENSOR_CARD_IMAGES.flowMeter,
    badge: "Flow",
    lat: 0,
    lon: 0,
    type: "flow_meter",
    manualPosition: [29.999, 9.5, -64.73],
  },
  {
    id: "sensor-6",
    title: "NA-01",
    description: "Staff gauge / water level.",
    image: SENSOR_CARD_IMAGES.waterLevelGauge,
    badge: "Water level",
    lat: 0,
    lon: 0,
    type: "water_level_gauge",
    manualPosition: [29.439, 15.755, -89.719],
  },
  {
    id: "TR-01",
    title: "TR-01",
    description: "Reference leveling mark anchored in the rock mass.",
    image: SENSOR_CARD_IMAGES.levelingMark,
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [61.526, 14.406, -76.936],
  },
  {
    id: "TR-02",
    title: "TR-02",
    description: "Reference leveling mark anchored in the rock mass.",
    image: SENSOR_CARD_IMAGES.levelingMark,
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [61.481, 14.337, -75.137],
  },
  {
    id: "TR-03",
    title: "TR-03",
    description: "Reference leveling mark anchored in the rock mass.",
    image: SENSOR_CARD_IMAGES.levelingMark,
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [18.414, 14.813, -74.201],
  },
  {
    id: "TR-04",
    title: "TR-04",
    description: "Reference leveling mark anchored in the rock mass.",
    image: SENSOR_CARD_IMAGES.levelingMark,
    badge: "Reference",
    lat: 0,
    lon: 0,
    type: "reference_leveling_mark",
    manualPosition: [18.17, 14.522, -75.97],
  },
  ...createLevelingMarksAlongLine({
    start: CREST_LEVELING_START,
    end: CREST_LEVELING_END,
    count: 12,
  }),
];
