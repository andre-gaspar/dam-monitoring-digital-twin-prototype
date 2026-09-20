"use client";

import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { Line, Text } from "@react-three/drei";
import { InvisibleCollider } from "@/components/vrtest9/VRBasics";
import type { MonitoringSensorItem } from "@/components/montesinho11/types";

import {
  DASHBOARD_INITIAL_SCALE,
  DASHBOARD_SLOTS,
  MENU_INITIAL_POSITION,
  MENU_INITIAL_SCALE,
  MINIATURE_MODEL_OPTIONS,
  type MiniatureModelKey,
} from "./constants";

type ButtonRef = React.RefObject<THREE.Mesh | null>;
type GroupRef = React.RefObject<THREE.Group | null>;

export type DashboardKey =
  | "reservoir"
  | "manualCota"
  | "piezometerMetadata"
  | "piezometerHistory"
  | "seepage"
  | "temporaryBica"
  | "weather"
  | "timeline"
  | "inclinometerHistory";

export type MenuDashboardKey = Exclude<DashboardKey, "inclinometerHistory">;

export type OpenDashboard = {
  id: string;
  key: DashboardKey;
};

export type VRMenuButtonRefs = {
  previousMenu: ButtonRef;
  nextMenu: ButtonRef;
  collapseMenu: ButtonRef;
  sensorPrevious: ButtonRef;
  sensorNext: ButtonRef;
  sensorSelect: ButtonRef;
  sensorDashboard: ButtonRef;
  dashboardButtons: Record<MenuDashboardKey, ButtonRef>;
  timelineLeft: ButtonRef;
  timelineRight: ButtonRef;
  timelineNarrow: ButtonRef;
  timelineWide: ButtonRef;
  timelineStartHandle: ButtonRef;
  timelineEndHandle: ButtonRef;
  playPause: ButtonRef;
  resetPlayback: ButtonRef;
  rainDown: ButtonRef;
  rainUp: ButtonRef;
};

export type VRMiniatureModelButtonRefs = Record<MiniatureModelKey, ButtonRef>;

export const VR_DASHBOARD_CONFIGS: Record<
  DashboardKey,
  {
    title: string;
    shortTitle: string;
    apiPath: string;
    dateKey: string;
    color: number;
    primaryMetric?: string;
    secondaryMetric?: string;
    qualityKey?: string;
  }
> = {
  reservoir: {
    title: "Hourly Reservoir Level",
    shortTitle: "Reservoir",
    apiPath: "/api/reservoir_level_hourly",
    dateKey: "timestamp_local",
    color: 0x2563eb,
    primaryMetric: "cota_m",
  },
  manualCota: {
    title: "Manual Cota Events",
    shortTitle: "Manual",
    apiPath: "/api/manual_cota_events",
    dateKey: "timestamp_local",
    color: 0x7c3aed,
    primaryMetric: "cota_m",
    secondaryMetric: "npa_m",
  },
  piezometerMetadata: {
    title: "Piezometer Metadata",
    shortTitle: "Piezos",
    apiPath: "/api/piezometer_metadata_latest",
    dateKey: "latest_timestamp_local",
    color: 0x0891b2,
    primaryMetric: "latest_pore_pressure_kpa",
    secondaryMetric: "latest_temperature_c",
    qualityKey: "latest_quality_flags",
  },
  piezometerHistory: {
    title: "Piezometer History",
    shortTitle: "Piezo Hist",
    apiPath: "/api/piezometer_history_long",
    dateKey: "timestamp_local",
    color: 0x16a34a,
    primaryMetric: "pore_pressure_kpa",
    secondaryMetric: "temperature_c",
  },
  seepage: {
    title: "Seepage And Percolation",
    shortTitle: "Seepage",
    apiPath: "/api/seepage_flows_long",
    dateKey: "timestamp_local",
    color: 0x0f766e,
    primaryMetric: "flow_l_s",
    secondaryMetric: "reservoir_cota_m",
  },
  temporaryBica: {
    title: "Temporary Bica Flows",
    shortTitle: "Bicas",
    apiPath: "/api/temporary_bica_flows_long",
    dateKey: "timestamp_local",
    color: 0xea580c,
    primaryMetric: "clean_flow_l_s",
    secondaryMetric: "source_flow_l_s",
  },
  weather: {
    title: "Weather Hourly",
    shortTitle: "Weather",
    apiPath: "/api/weather_hourly",
    dateKey: "timestamp_local",
    color: 0x4f46e5,
    primaryMetric: "temperature_c",
    secondaryMetric: "precipitation",
  },
  timeline: {
    title: "Unified Timeline",
    shortTitle: "Timeline",
    apiPath: "/api/timeline_events",
    dateKey: "timestamp_local",
    color: 0xbe123c,
    primaryMetric: "value_numeric",
    secondaryMetric: "source_row",
  },
  inclinometerHistory: {
    title: "Inclinometer History",
    shortTitle: "Inc. Hist",
    apiPath: "/api/inclinometer_history_long",
    dateKey: "observation_date",
    color: 0x0284c7,
    primaryMetric: "mj_displacement_mm",
    secondaryMetric: "me_md_displacement_mm",
  },
};

export const VR_MENU_DASHBOARD_KEYS: MenuDashboardKey[] = [
  "reservoir",
  "manualCota",
  "piezometerMetadata",
  "piezometerHistory",
  "seepage",
  "temporaryBica",
  "weather",
  "timeline",
];

function PanelButton({
  label,
  meshRef,
  position,
  width = 0.24,
  height = 0.072,
  color = 0x334155,
  active = false,
  fontSize = 0.024,
}: {
  label: string;
  meshRef: ButtonRef;
  position: [number, number, number];
  width?: number;
  height?: number;
  color?: number;
  active?: boolean;
  fontSize?: number;
}) {
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[width, height, 0.035]} />
        <meshBasicMaterial
          color={active ? 0xfacc15 : color}
          transparent
          opacity={0.96}
          toneMapped={false}
        />
      </mesh>
      <Text
        position={[0, 0, 0.026]}
        fontSize={fontSize}
        color={active ? "#111827" : "white"}
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 0.86}
      >
        {label}
      </Text>
    </group>
  );
}

function PanelLabel({
  children,
  position,
  size = 0.024,
  color = "#dbeafe",
  maxWidth = 0.95,
  anchorX = "left",
}: {
  children: React.ReactNode;
  position: [number, number, number];
  size?: number;
  color?: string;
  maxWidth?: number;
  anchorX?: "left" | "center" | "right";
}) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY="middle"
      maxWidth={maxWidth}
    >
      {children}
    </Text>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function formatApiDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type CsvRow = Record<string, string>;
type DashboardConfig = (typeof VR_DASHBOARD_CONFIGS)[DashboardKey];
type ChartPoint = {
  x: number;
  primary: number;
  secondary: number | null;
};
type LinePoint3 = [number, number, number];

const LINE_CHART_MAX_POINTS = 120;
const LINE_CHART_WIDTH = 0.92;
const LINE_CHART_HEIGHT = 0.38;

async function fetchRowsPage(
  apiPath: string,
  startDate: Date,
  endDate: Date,
  offset: number,
  signal: AbortSignal
) {
  const params = new URLSearchParams({
    start: formatApiDate(startDate),
    stop: formatApiDate(addOneDay(endDate)),
    limit: "1000",
    offset: String(offset),
  });

  const response = await fetch(`${apiPath}?${params.toString()}`, { signal });
  const payload = (await response.json()) as {
    ok: boolean;
    count?: number | null;
    returned?: number;
    nextOffset?: number | null;
    data?: CsvRow[];
    error?: string;
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }

  return {
    count: typeof payload.count === "number" ? payload.count : null,
    rows: payload.data ?? [],
    nextOffset: payload.nextOffset ?? null,
  };
}

function summarizeRows(rows: CsvRow[], metricKey?: string) {
  const values = metricKey
    ? rows
        .map((row) => toNumber(row[metricKey]))
        .filter((value): value is number => value !== null)
    : [];

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    avg: values.length ? total / values.length : null,
    latest: values.length ? values[values.length - 1] : null,
    count: values.length,
  };
}

function formatNumber(value: number | null, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "-";
}

function countFlaggedRows(rows: CsvRow[], qualityKey = "quality_flags") {
  return rows.filter((row) => {
    const value = (row[qualityKey] ?? "").trim().toLowerCase();
    return value && value !== "ok" && value !== "null" && value !== "blank";
  }).length;
}

function hexColor(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function metricLabel(metricKey?: string) {
  if (!metricKey) return "metric";
  return metricKey.replace(/_/g, " ");
}

function parseChartDate(value: string | undefined) {
  if (!value) return null;

  const match = value
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

  if (!match) return null;

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    0
  ).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function expandRange(min: number, max: number): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 1);
    return [min - padding, max + padding];
  }

  const padding = Math.abs(max - min) * 0.08;
  return [min - padding, max + padding];
}

function normalizeValue(value: number, min: number, max: number) {
  if (max <= min) return 0.5;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

function compactChartNumber(value: number) {
  const abs = Math.abs(value);

  if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (abs >= 10000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1000) return value.toFixed(0);
  if (abs >= 100) return value.toFixed(1);
  if (abs >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function compactChartDate(value: number, useTimeAxis: boolean) {
  if (!useTimeAxis) {
    return `#${Math.max(1, Math.round(value + 1)).toLocaleString()}`;
  }

  return new Date(value).toLocaleDateString("en-GB", {
    year: "2-digit",
    month: "short",
    day: "2-digit",
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleChartPoints(points: ChartPoint[]) {
  if (points.length <= LINE_CHART_MAX_POINTS) return points;

  const sampled: ChartPoint[] = [];
  const bucketSize = points.length / LINE_CHART_MAX_POINTS;

  for (
    let bucketIndex = 0;
    bucketIndex < LINE_CHART_MAX_POINTS;
    bucketIndex += 1
  ) {
    const start = Math.floor(bucketIndex * bucketSize);
    const end = Math.max(start + 1, Math.floor((bucketIndex + 1) * bucketSize));
    const bucket = points.slice(start, end);
    const secondaryValues = bucket
      .map((point) => point.secondary)
      .filter((value): value is number => value !== null);

    sampled.push({
      x:
        bucket[Math.floor(bucket.length / 2)]?.x ??
        points[start]?.x ??
        bucketIndex,
      primary: average(bucket.map((point) => point.primary)),
      secondary: secondaryValues.length ? average(secondaryValues) : null,
    });
  }

  return sampled;
}

function buildLineChartData(rows: CsvRow[], config: DashboardConfig) {
  if (!config.primaryMetric) return null;

  const datePoints = rows
    .map((row) => {
      const primary = toNumber(row[config.primaryMetric!]);
      const x = parseChartDate(row[config.dateKey]);

      if (primary === null || x === null) return null;

      return {
        x,
        primary,
        secondary: config.secondaryMetric
          ? toNumber(row[config.secondaryMetric])
          : null,
      };
    })
    .filter((point): point is ChartPoint => point !== null)
    .sort((a, b) => a.x - b.x);

  const useTimeAxis =
    new Set(datePoints.map((point) => point.x)).size > 1 && datePoints.length > 1;
  const sourcePoints = useTimeAxis
    ? datePoints
    : rows
        .map((row, index) => {
          const primary = toNumber(row[config.primaryMetric!]);
          if (primary === null) return null;

          return {
            x: index,
            primary,
            secondary: config.secondaryMetric
              ? toNumber(row[config.secondaryMetric])
              : null,
          };
        })
        .filter((point): point is ChartPoint => point !== null);

  if (sourcePoints.length === 0) return null;

  const primaryValues = sourcePoints.map((point) => point.primary);
  const secondaryValues = sourcePoints
    .map((point) => point.secondary)
    .filter((value): value is number => value !== null);
  const xValues = sourcePoints.map((point) => point.x);

  return {
    points: sampleChartPoints(sourcePoints),
    xRange: expandRange(Math.min(...xValues), Math.max(...xValues)),
    primaryRange: expandRange(Math.min(...primaryValues), Math.max(...primaryValues)),
    secondaryRange: secondaryValues.length
      ? expandRange(Math.min(...secondaryValues), Math.max(...secondaryValues))
      : null,
    useTimeAxis,
    hasSecondary: secondaryValues.length > 0,
  };
}

function chartLinePoints(
  points: ChartPoint[],
  xRange: [number, number],
  yRange: [number, number],
  series: "primary" | "secondary"
): LinePoint3[] {
  return points
    .map((point) => {
      const value = series === "primary" ? point.primary : point.secondary;
      if (value === null) return null;

      return [
        -LINE_CHART_WIDTH / 2 +
          normalizeValue(point.x, xRange[0], xRange[1]) * LINE_CHART_WIDTH,
        -LINE_CHART_HEIGHT / 2 +
          normalizeValue(value, yRange[0], yRange[1]) * LINE_CHART_HEIGHT,
        0.06,
      ] as LinePoint3;
    })
    .filter((point): point is LinePoint3 => point !== null);
}

function LineEndpoint({
  point,
  color,
}: {
  point: LinePoint3 | undefined;
  color: string;
}) {
  if (!point) return null;

  return (
    <mesh position={point}>
      <sphereGeometry args={[0.012, 16, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function VRLineChart({
  rows,
  config,
  position,
}: {
  rows: CsvRow[];
  config: DashboardConfig;
  position: [number, number, number];
}) {
  const chart = useMemo(() => buildLineChartData(rows, config), [rows, config]);
  const primaryColor = hexColor(config.color);
  const secondaryColor = "#f97316";
  const primaryPoints = useMemo(
    () =>
      chart
        ? chartLinePoints(chart.points, chart.xRange, chart.primaryRange, "primary")
        : [],
    [chart]
  );
  const secondaryPoints = useMemo(
    () =>
      chart?.secondaryRange
        ? chartLinePoints(
            chart.points,
            chart.xRange,
            chart.secondaryRange,
            "secondary"
          )
        : [],
    [chart]
  );

  return (
    <group position={position}>
      <mesh position={[0, 0, 0.038]}>
        <planeGeometry args={[LINE_CHART_WIDTH + 0.08, LINE_CHART_HEIGHT + 0.1]} />
        <meshBasicMaterial
          color={0x020617}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {Array.from({ length: 5 }).map((_, index) => {
        const x = -LINE_CHART_WIDTH / 2 + (index / 4) * LINE_CHART_WIDTH;
        const y = -LINE_CHART_HEIGHT / 2 + (index / 4) * LINE_CHART_HEIGHT;

        return (
          <group key={`grid-${index}`}>
            <Line
              points={[
                [x, -LINE_CHART_HEIGHT / 2, 0.055],
                [x, LINE_CHART_HEIGHT / 2, 0.055],
              ]}
              color="#1e293b"
              lineWidth={0.7}
            />
            <Line
              points={[
                [-LINE_CHART_WIDTH / 2, y, 0.055],
                [LINE_CHART_WIDTH / 2, y, 0.055],
              ]}
              color="#1e293b"
              lineWidth={0.7}
            />
          </group>
        );
      })}

      <Line
        points={[
          [-LINE_CHART_WIDTH / 2, -LINE_CHART_HEIGHT / 2, 0.057],
          [LINE_CHART_WIDTH / 2, -LINE_CHART_HEIGHT / 2, 0.057],
          [LINE_CHART_WIDTH / 2, LINE_CHART_HEIGHT / 2, 0.057],
          [-LINE_CHART_WIDTH / 2, LINE_CHART_HEIGHT / 2, 0.057],
          [-LINE_CHART_WIDTH / 2, -LINE_CHART_HEIGHT / 2, 0.057],
        ]}
        color="#475569"
        lineWidth={1.2}
      />

      {chart && primaryPoints.length > 1 ? (
        <Line points={primaryPoints} color={primaryColor} lineWidth={3.2} />
      ) : null}
      {chart && secondaryPoints.length > 1 ? (
        <Line points={secondaryPoints} color={secondaryColor} lineWidth={2.4} />
      ) : null}
      <LineEndpoint point={primaryPoints.at(-1)} color={primaryColor} />
      <LineEndpoint point={secondaryPoints.at(-1)} color={secondaryColor} />

      {chart ? (
        <group>
          <PanelLabel
            position={[-LINE_CHART_WIDTH / 2, LINE_CHART_HEIGHT / 2 - 0.032, 0.07]}
            size={0.016}
            color={primaryColor}
            maxWidth={0.42}
          >
            {metricLabel(config.primaryMetric)}
          </PanelLabel>
          {chart.hasSecondary ? (
            <PanelLabel
              position={[
                LINE_CHART_WIDTH / 2,
                LINE_CHART_HEIGHT / 2 - 0.032,
                0.07,
              ]}
              size={0.016}
              color={secondaryColor}
              maxWidth={0.42}
              anchorX="right"
            >
              {metricLabel(config.secondaryMetric)}
            </PanelLabel>
          ) : null}
          <PanelLabel
            position={[-LINE_CHART_WIDTH / 2 - 0.018, LINE_CHART_HEIGHT / 2, 0.07]}
            size={0.014}
            color="#94a3b8"
            anchorX="right"
            maxWidth={0.16}
          >
            {compactChartNumber(chart.primaryRange[1])}
          </PanelLabel>
          <PanelLabel
            position={[-LINE_CHART_WIDTH / 2 - 0.018, -LINE_CHART_HEIGHT / 2, 0.07]}
            size={0.014}
            color="#94a3b8"
            anchorX="right"
            maxWidth={0.16}
          >
            {compactChartNumber(chart.primaryRange[0])}
          </PanelLabel>
          <PanelLabel
            position={[-LINE_CHART_WIDTH / 2, -LINE_CHART_HEIGHT / 2 - 0.04, 0.07]}
            size={0.014}
            color="#64748b"
            maxWidth={0.28}
          >
            {compactChartDate(chart.xRange[0], chart.useTimeAxis)}
          </PanelLabel>
          <PanelLabel
            position={[LINE_CHART_WIDTH / 2, -LINE_CHART_HEIGHT / 2 - 0.04, 0.07]}
            size={0.014}
            color="#64748b"
            maxWidth={0.28}
            anchorX="right"
          >
            {compactChartDate(chart.xRange[1], chart.useTimeAxis)}
          </PanelLabel>
        </group>
      ) : (
        <PanelLabel
          position={[0, 0, 0.07]}
          size={0.025}
          color="#94a3b8"
          maxWidth={0.74}
          anchorX="center"
        >
          Waiting for numeric line data
        </PanelLabel>
      )}
    </group>
  );
}

export function VRMiniatureModelPanel({
  buttonRefs,
  selectedModel,
  verticalOffset = 0,
}: {
  buttonRefs: VRMiniatureModelButtonRefs;
  selectedModel: MiniatureModelKey;
  verticalOffset?: number;
}) {
  const buttonSpacing = 0.38;
  const panelWidth = Math.max(
    1.2,
    (MINIATURE_MODEL_OPTIONS.length - 1) * buttonSpacing + 0.44
  );
  const firstButtonX =
    -((MINIATURE_MODEL_OPTIONS.length - 1) * buttonSpacing) / 2;

  return (
    <group
      position={[-0.82, 1.25 + verticalOffset, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <mesh position={[0, 0, -0.025]}>
        <boxGeometry args={[panelWidth, 0.32, 0.05]} />
        <meshBasicMaterial
          color={0x020617}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[panelWidth - 0.06, 0.26]} />
        <meshBasicMaterial
          color={0x0f172a}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <PanelLabel
        position={[-panelWidth / 2 + 0.07, 0.095, 0.035]}
        size={0.027}
        color="white"
      >
        Miniature model
      </PanelLabel>

      {MINIATURE_MODEL_OPTIONS.map((option, index) => (
        <PanelButton
          key={option.id}
          label={option.label}
          meshRef={buttonRefs[option.id]}
          position={[firstButtonX + index * buttonSpacing, -0.065, 0.035]}
          width={0.32}
          height={0.082}
          color={0x2563eb}
          active={selectedModel === option.id}
          fontSize={0.018}
        />
      ))}
    </group>
  );
}

export function VRMenuPanel({
  panelRef,
  colliderRef,
  position = MENU_INITIAL_POSITION,
  buttonRefs,
  activeMenuIndex,
  isCollapsed,
  currentSensor,
  selectedSensor,
  dashboardLimitReached,
  timelineValues,
  selectedStartDate,
  selectedEndDate,
  activeTimelineHandle,
  rainIntensity,
  waterRowsCount,
  isPlaying,
}: {
  panelRef: GroupRef;
  colliderRef: ButtonRef;
  position?: [number, number, number];
  buttonRefs: VRMenuButtonRefs;
  activeMenuIndex: number;
  isCollapsed: boolean;
  currentSensor: MonitoringSensorItem;
  selectedSensor: MonitoringSensorItem | null;
  dashboardLimitReached: boolean;
  timelineValues: [number, number];
  selectedStartDate: Date;
  selectedEndDate: Date;
  activeTimelineHandle: "start" | "end";
  rainIntensity: number;
  waterRowsCount: number;
  isPlaying: boolean;
}) {
  const menuNames = ["Sensors", "Dashboards", "Timeline", "Scene"];
  const menuName = menuNames[activeMenuIndex] ?? menuNames[0];
  return (
    <group
      ref={panelRef}
      position={position}
      scale={MENU_INITIAL_SCALE}
    >
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.24, isCollapsed ? 0.28 : 1.18, 0.05]} />
        <meshBasicMaterial color={0x020617} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[1.18, isCollapsed ? 0.22 : 1.1]} />
        <meshBasicMaterial
          color={0x0f172a}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <PanelLabel
        position={[-0.52, isCollapsed ? 0.04 : 0.49, 0.035]}
        size={0.042}
        color="white"
      >
        VR11 {menuName}
      </PanelLabel>
      <PanelButton
        label="<"
        meshRef={buttonRefs.previousMenu}
        position={[0.2, isCollapsed ? 0.04 : 0.49, 0.035]}
        width={0.12}
        color={0x334155}
      />
      <PanelButton
        label=">"
        meshRef={buttonRefs.nextMenu}
        position={[0.36, isCollapsed ? 0.04 : 0.49, 0.035]}
        width={0.12}
        color={0x334155}
      />
      <PanelButton
        label={isCollapsed ? "OPEN" : "HIDE"}
        meshRef={buttonRefs.collapseMenu}
        position={[0.5, isCollapsed ? 0.04 : 0.49, 0.035]}
        width={0.18}
        color={0x475569}
      />

      {!isCollapsed && activeMenuIndex === 0 ? (
        <group>
          <PanelLabel position={[-0.5, 0.34, 0.035]} size={0.028} color="#bfdbfe">
            Current sensor
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.24, 0.035]} size={0.05} color="white">
            {currentSensor.title}
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.13, 0.035]} size={0.024}>
            {currentSensor.badge ?? currentSensor.description}
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.035, 0.035]} size={0.021} color="#94a3b8">
            Selected: {selectedSensor?.title ?? "none"}
          </PanelLabel>
          <PanelButton
            label="PREV"
            meshRef={buttonRefs.sensorPrevious}
            position={[-0.33, -0.12, 0.035]}
            color={0x2563eb}
          />
          <PanelButton
            label="NEXT"
            meshRef={buttonRefs.sensorNext}
            position={[-0.04, -0.12, 0.035]}
            color={0x2563eb}
          />
          <PanelButton
            label="SELECT"
            meshRef={buttonRefs.sensorSelect}
            position={[0.27, -0.12, 0.035]}
            width={0.26}
            color={0xfacc15}
          />
          <PanelButton
            label="OPEN DATA"
            meshRef={buttonRefs.sensorDashboard}
            position={[0, -0.28, 0.035]}
            width={0.52}
            color={0x16a34a}
          />
        </group>
      ) : null}

      {!isCollapsed && activeMenuIndex === 1 ? (
        <group>
          <PanelLabel position={[-0.5, 0.34, 0.035]} size={0.026}>
            Open up to three movable dashboards
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.26, 0.035]} size={0.021} color="#94a3b8">
            {dashboardLimitReached
              ? "Limit reached: close one panel first"
              : "Pinch a dataset button to open it"}
          </PanelLabel>
          {VR_MENU_DASHBOARD_KEYS.map((key, index) => {
            const x = -0.32 + (index % 2) * 0.64;
            const y = 0.12 - Math.floor(index / 2) * 0.145;
            const config = VR_DASHBOARD_CONFIGS[key];
            return (
              <PanelButton
                key={key}
                label={config.shortTitle}
                meshRef={buttonRefs.dashboardButtons[key]}
                position={[x, y, 0.035]}
                width={0.46}
                color={config.color}
                fontSize={0.022}
              />
            );
          })}
        </group>
      ) : null}

      {!isCollapsed && activeMenuIndex === 2 ? (
        <group>
          <PanelLabel position={[-0.5, 0.34, 0.035]} size={0.023}>
            {formatDate(selectedStartDate)} to {formatDate(selectedEndDate)}
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.26, 0.035]} size={0.021} color="#94a3b8">
            Active handle: {activeTimelineHandle.toUpperCase()}
          </PanelLabel>
          <mesh position={[0, 0.08, 0.035]}>
            <boxGeometry args={[0.9, 0.018, 0.018]} />
            <meshBasicMaterial color={0x64748b} toneMapped={false} />
          </mesh>
          <mesh
            ref={buttonRefs.timelineStartHandle}
            position={[-0.45 + timelineValues[0] * 0.009, 0.08, 0.06]}
          >
            <sphereGeometry args={[0.045, 24, 12]} />
            <meshBasicMaterial
              color={activeTimelineHandle === "start" ? 0xfacc15 : 0x38bdf8}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={buttonRefs.timelineEndHandle}
            position={[-0.45 + timelineValues[1] * 0.009, 0.08, 0.06]}
          >
            <sphereGeometry args={[0.045, 24, 12]} />
            <meshBasicMaterial
              color={activeTimelineHandle === "end" ? 0xfacc15 : 0x38bdf8}
              toneMapped={false}
            />
          </mesh>
          <PanelButton
            label="< RANGE"
            meshRef={buttonRefs.timelineLeft}
            position={[-0.33, -0.08, 0.035]}
            width={0.26}
            color={0x334155}
          />
          <PanelButton
            label="RANGE >"
            meshRef={buttonRefs.timelineRight}
            position={[-0.03, -0.08, 0.035]}
            width={0.26}
            color={0x334155}
          />
          <PanelButton
            label="ZOOM +"
            meshRef={buttonRefs.timelineNarrow}
            position={[0.28, -0.08, 0.035]}
            width={0.24}
            color={0x334155}
          />
          <PanelButton
            label="ZOOM -"
            meshRef={buttonRefs.timelineWide}
            position={[0.28, -0.21, 0.035]}
            width={0.24}
            color={0x334155}
          />
          <PanelButton
            label={isPlaying ? "PAUSE" : "PLAY"}
            meshRef={buttonRefs.playPause}
            position={[-0.21, -0.31, 0.035]}
            width={0.3}
            color={0x16a34a}
          />
          <PanelButton
            label="RESET"
            meshRef={buttonRefs.resetPlayback}
            position={[0.17, -0.31, 0.035]}
            width={0.3}
            color={0xdc2626}
          />
        </group>
      ) : null}

      {!isCollapsed && activeMenuIndex === 3 ? (
        <group>
          <PanelLabel position={[-0.5, 0.34, 0.035]} size={0.028}>
            Rain {Math.round(rainIntensity * 100)}%
          </PanelLabel>
          <PanelLabel position={[-0.5, 0.24, 0.035]} size={0.022} color="#94a3b8">
            Reservoir playback rows: {waterRowsCount}
          </PanelLabel>
          <PanelButton
            label="- RAIN"
            meshRef={buttonRefs.rainDown}
            position={[-0.22, 0.08, 0.035]}
            width={0.3}
            color={0x1d4ed8}
          />
          <PanelButton
            label="+ RAIN"
            meshRef={buttonRefs.rainUp}
            position={[0.16, 0.08, 0.035]}
            width={0.3}
            color={0x1d4ed8}
          />
          <PanelLabel position={[-0.5, -0.1, 0.035]} size={0.021} color="#cbd5e1">
            Movement, teleport and UI reset live on the hand mode panel below.
          </PanelLabel>
        </group>
      ) : null}

      <InvisibleCollider
        colliderRef={colliderRef}
        args={[1.25, isCollapsed ? 0.32 : 1.2, 0.16]}
        position={[0, 0, 0.04]}
      />
    </group>
  );
}

export function VRDatasetDashboardPanel({
  dashboard,
  slotIndex,
  panelRef,
  colliderRef,
  closeButtonRef,
  position,
  selectedStartDate,
  selectedEndDate,
}: {
  dashboard: OpenDashboard;
  slotIndex: number;
  panelRef: GroupRef;
  colliderRef: ButtonRef;
  closeButtonRef: ButtonRef;
  position?: [number, number, number];
  selectedStartDate: Date;
  selectedEndDate: Date;
}) {
  const config = VR_DASHBOARD_CONFIGS[dashboard.key];
  const slot = DASHBOARD_SLOTS[slotIndex] ?? DASHBOARD_SLOTS[0];
  const panelPosition = position ?? slot.position;
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [expectedCount, setExpectedCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRows() {
      setRows([]);
      setExpectedCount(null);
      setError(null);
      setIsLoading(true);

      try {
        const nextRows: CsvRow[] = [];
        let offset = 0;

        while (nextRows.length < 16000) {
          const page = await fetchRowsPage(
            config.apiPath,
            selectedStartDate,
            selectedEndDate,
            offset,
            controller.signal
          );

          if (page.count !== null) setExpectedCount(page.count);
          nextRows.push(...page.rows);
          setRows([...nextRows]);

          if (page.rows.length < 1000 || page.nextOffset === null) break;
          offset = page.nextOffset;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadRows();

    return () => controller.abort();
  }, [config.apiPath, selectedStartDate, selectedEndDate]);

  const primarySummary = useMemo(
    () => summarizeRows(rows, config.primaryMetric),
    [rows, config.primaryMetric]
  );
  const secondarySummary = useMemo(
    () => summarizeRows(rows, config.secondaryMetric),
    [rows, config.secondaryMetric]
  );
  const flaggedRows = useMemo(
    () => countFlaggedRows(rows, config.qualityKey),
    [rows, config.qualityKey]
  );

  return (
    <group
      ref={panelRef}
      position={panelPosition}
      rotation={slot.rotation}
      scale={DASHBOARD_INITIAL_SCALE}
    >
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.16, 1.12, 0.05]} />
        <meshBasicMaterial color={0x020617} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[1.09, 1.05]} />
        <meshBasicMaterial
          color={0x0f172a}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <PanelLabel position={[-0.49, 0.455, 0.035]} size={0.036} color="white">
        {config.title}
      </PanelLabel>
      <PanelButton
        label="X"
        meshRef={closeButtonRef}
        position={[0.47, 0.455, 0.035]}
        width={0.11}
        color={0xdc2626}
      />
      <PanelLabel position={[-0.49, 0.36, 0.035]} size={0.021} color="#93c5fd">
        {formatDate(selectedStartDate)} to {formatDate(selectedEndDate)}
      </PanelLabel>
      <PanelLabel position={[-0.49, 0.285, 0.035]} size={0.023}>
        {error
          ? error
          : isLoading
          ? `Loading ${rows.length.toLocaleString()} rows...`
          : `Rows ${rows.length.toLocaleString()}${
              expectedCount ? ` / ${expectedCount.toLocaleString()}` : ""
            }`}
      </PanelLabel>
      <PanelLabel position={[-0.49, 0.19, 0.035]} size={0.024} color="#e2e8f0">
        {config.primaryMetric ?? "metric"} latest{" "}
        {formatNumber(primarySummary.latest)}
      </PanelLabel>
      <PanelLabel position={[-0.49, 0.115, 0.035]} size={0.021}>
        min {formatNumber(primarySummary.min)} | avg{" "}
        {formatNumber(primarySummary.avg)} | max {formatNumber(primarySummary.max)}
      </PanelLabel>
      <PanelLabel position={[-0.49, 0.045, 0.035]} size={0.02} color="#cbd5e1">
        {config.secondaryMetric
          ? `${config.secondaryMetric} latest ${formatNumber(
              secondarySummary.latest
            )}`
          : "Secondary metric unavailable"}
      </PanelLabel>
      <PanelLabel position={[-0.49, -0.02, 0.035]} size={0.02} color="#cbd5e1">
        Flagged rows {flaggedRows.toLocaleString()}
      </PanelLabel>
      <VRLineChart rows={rows} config={config} position={[0, -0.255, 0.035]} />
      <PanelLabel position={[-0.49, -0.505, 0.035]} size={0.018} color="#64748b">
        Grab this panel with ray or hand mode. Up to three dashboards can stay open.
      </PanelLabel>
      <InvisibleCollider
        colliderRef={colliderRef}
        args={[1.18, 1.14, 0.16]}
        position={[0, 0, 0.04]}
      />
    </group>
  );
}
