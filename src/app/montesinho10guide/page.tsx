"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloudRainIcon,
  DatabaseIcon,
  DropletsIcon,
  GaugeIcon,
  MapPinIcon,
  RulerIcon,
  WavesIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { initialSensors } from "@/components/montesinho9/initialSensors";
import { OverlayModal } from "@/components/montesinho9/OverlayModal";
import { RainControlPanel } from "@/components/montesinho9/RainControlPanel";
import { SensorSidebar } from "@/components/montesinho9/SensorSidebar";
import { TimelineDock } from "@/components/montesinho9/TimelineDock";
import { WaterPlaybackPanel } from "@/components/montesinho9/WaterPlaybackPanel";
import {
  PLAYBACK_INTERVAL_MS,
  WATER_LEVEL_Y,
  WATER_VISUAL_MIN_Y,
} from "@/components/montesinho9/constants";
import type {
  MonitoringSensorItem,
  WaterLevelRow,
} from "@/components/montesinho9/types";
import {
  getSensorDataMapping,
  type SensorDataMapping,
} from "@/components/montesinho10/sensorDataMapping";
import {
  SensorDataPanel,
  type SensorDataView,
} from "@/components/montesinho10/SensorDataPanel";
import { AddSensorPanel } from "@/components/montesinho9guide/AddSensorPanel";
import { GuideCallouts } from "@/components/montesinho9guide/GuideCallouts";
import {
  GuideGizmoModePanel,
  type SensorGizmoMode,
} from "@/components/montesinho9guide/GuideGizmoModePanel";
import { GuideMontesinhoScene } from "@/components/montesinho9guide/GuideMontesinhoScene";
import { GuidePanel } from "@/components/montesinho9guide/GuidePanel";
import { GuideSensorGizmoSidebar } from "@/components/montesinho9guide/GuideSensorGizmoSidebar";
import {
  GUIDE_STEPS,
  type GuideLanguage,
  type GuideObjective,
} from "@/components/montesinho9guide/guideContent";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CsvRow = Record<string, string>;

type DatasetKey =
  | "reservoir"
  | "manualCota"
  | "piezometerMetadata"
  | "piezometerHistory"
  | "seepage"
  | "temporaryBica"
  | "weather"
  | "timeline"
  | "inclinometerMetadata"
  | "inclinometerSummary"
  | "inclinometerHistory";

type DatasetConfig = {
  key: DatasetKey;
  title: string;
  shortTitle: string;
  fileName: string;
  basePath?: string;
  dateKey: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

type NumericSummary = {
  key: string;
  label: string;
  unit?: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
  count: number;
};

type SummaryStat = "latest" | "max";

type OrbitSnapshot = {
  radius: number;
  theta: number;
  phi: number;
};

type ObjectiveStatus = Record<GuideObjective["id"], boolean>;

const DAM_CSV_BASE = "/dam_supabase_csvs";
const INCLINOMETER_CSV_BASE = "/inclinometer_dt_csvs";
const RESERVOIR_LEVEL_CSV = `${DAM_CSV_BASE}/01_reservoir_level_hourly.csv`;
const RESERVOIR_TIMELINE_START_DATE = new Date(2014, 9, 7, 0, 0, 0, 0);
const RESERVOIR_TIMELINE_END_DATE = new Date(2026, 4, 25, 0, 0, 0, 0);
const RESERVOIR_COTA_MIN_M = 1192.5;
const RESERVOIR_COTA_MAX_M = 1218.63;
const MAX_WATER_PLAYBACK_ROWS = 5000;
const GUIDE_TARGET = new THREE.Vector3(70, -2, -70);

const INITIAL_OBJECTIVES: ObjectiveStatus = {
  rotate: false,
  zoom: false,
  selectSensor: false,
  openGraph: false,
  changeRain: false,
  showTwoTiles: false,
  addSensor: false,
  useGizmos: false,
  openTimeline: false,
  chooseDateInterval: false,
  runAnimation: false,
};

const DATASETS: DatasetConfig[] = [
  {
    key: "reservoir",
    title: "Hourly Reservoir Level",
    shortTitle: "Reservoir",
    fileName: "01_reservoir_level_hourly.csv",
    dateKey: "timestamp_local",
    description: "Hourly cota driving future water-surface height playback.",
    icon: WavesIcon,
    color: "#2563eb",
  },
  {
    key: "manualCota",
    title: "Manual Cota Events",
    shortTitle: "Manual cota",
    fileName: "02_manual_cota_events.csv",
    dateKey: "timestamp_local",
    description: "Manual observations, weather notes and reference levels.",
    icon: CalendarClockIcon,
    color: "#7c3aed",
  },
  {
    key: "piezometerMetadata",
    title: "Piezometer Metadata",
    shortTitle: "Piezometers",
    fileName: "03_piezometer_metadata_latest.csv",
    dateKey: "latest_timestamp_local",
    description: "Latest instrument metadata for future 3D sensor markers.",
    icon: MapPinIcon,
    color: "#0891b2",
  },
  {
    key: "piezometerHistory",
    title: "Piezometer History",
    shortTitle: "Piezo history",
    fileName: "04_piezometer_history_long.csv",
    dateKey: "timestamp_local",
    description: "Pressure, piezometric level and temperature histories.",
    icon: GaugeIcon,
    color: "#16a34a",
  },
  {
    key: "seepage",
    title: "Seepage And Percolation",
    shortTitle: "Seepage",
    fileName: "05_seepage_flows_long.csv",
    dateKey: "timestamp_local",
    description: "Component flow readings and computed totals.",
    icon: DropletsIcon,
    color: "#0f766e",
  },
  {
    key: "temporaryBica",
    title: "Temporary Bica Flows",
    shortTitle: "Bicas",
    fileName: "06_temporary_bica_flows_long.csv",
    dateKey: "timestamp_local",
    description: "Provisional bica flow status, totals and quality flags.",
    icon: ActivityIcon,
    color: "#ea580c",
  },
  {
    key: "weather",
    title: "Weather Hourly",
    shortTitle: "Weather",
    fileName: "07_weather_hourly.csv",
    dateKey: "timestamp_local",
    description: "Temperature, humidity and precipitation context.",
    icon: CloudRainIcon,
    color: "#4f46e5",
  },
  {
    key: "timeline",
    title: "Unified Timeline",
    shortTitle: "Timeline",
    fileName: "08_timeline_events.csv",
    dateKey: "timestamp_local",
    description: "Global synchronization layer for measurements and flags.",
    icon: DatabaseIcon,
    color: "#be123c",
  },
  {
    key: "inclinometerMetadata",
    title: "Inclinometer Metadata",
    shortTitle: "Inc. metadata",
    fileName: "09_inclinometer_metadata.csv",
    basePath: INCLINOMETER_CSV_BASE,
    dateKey: "latest_observation_date",
    description: "Instrument inventory, depth coverage and latest displacement extremes.",
    icon: RulerIcon,
    color: "#9333ea",
  },
  {
    key: "inclinometerSummary",
    title: "Inclinometer Observation Summary",
    shortTitle: "Inc. summary",
    fileName: "10_inclinometer_observation_summary.csv",
    basePath: INCLINOMETER_CSV_BASE,
    dateKey: "observation_date",
    description: "Observation-level displacement envelopes, roles and quality signals.",
    icon: ActivityIcon,
    color: "#ca8a04",
  },
  {
    key: "inclinometerHistory",
    title: "Inclinometer History",
    shortTitle: "Inc. history",
    fileName: "11_inclinometer_history_long.csv",
    basePath: INCLINOMETER_CSV_BASE,
    dateKey: "observation_date",
    description: "Depth-by-depth historical displacement profiles for each inclinometer.",
    icon: GaugeIcon,
    color: "#0284c7",
  },
];

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  const [headers = [], ...body] = rows;

  return body.map((values) => {
    const entry: CsvRow = {};
    headers.forEach((header, index) => {
      entry[header.trim()] = values[index]?.trim() ?? "";
    });
    return entry;
  });
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number | null, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "-";
}

function compactDate(value: string | undefined) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function sampleRows<T>(rows: T[], maxRows = 420): T[] {
  if (rows.length <= maxRows) return rows;
  const step = Math.ceil(rows.length / maxRows);
  return rows.filter((_, index) => index % step === 0).slice(0, maxRows);
}

function parseLocalCsvTimestamp(value: string | undefined) {
  if (!value) return null;
  const match = value
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

  if (!match) return null;

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    0
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfSelectedLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0
  );
}

function filterRowsByDateRange(
  rows: CsvRow[],
  dateKey: string,
  selectedStartDate: Date | null,
  selectedEndDate: Date | null
) {
  if (!selectedStartDate || !selectedEndDate) return rows;

  const startTime = selectedStartDate.getTime();
  const endTime = endOfSelectedLocalDay(selectedEndDate).getTime();

  return rows.filter((row) => {
    const rowDate = parseLocalCsvTimestamp(row[dateKey]);
    if (!rowDate) return false;

    const rowTime = rowDate.getTime();
    return rowTime >= startTime && rowTime < endTime;
  });
}

function reservoirRowsToWaterLevels(
  rows: CsvRow[],
  selectedStartDate: Date,
  selectedEndDate: Date
): WaterLevelRow[] {
  const startTime = selectedStartDate.getTime();
  const endTime = endOfSelectedLocalDay(selectedEndDate).getTime();

  const waterRows = rows.flatMap((row): WaterLevelRow[] => {
    const timestamp = row.timestamp_local || row.timestamp_original;
    const timestampDate = parseLocalCsvTimestamp(timestamp);
    const level = toNumber(row.cota_m);

    if (!timestamp || !timestampDate || level === null) return [];

    const rowTime = timestampDate.getTime();
    if (rowTime < startTime || rowTime >= endTime) return [];

    return [
      {
        timestamp: timestampDate.toISOString(),
        level,
      },
    ];
  });

  return sampleRows(waterRows, MAX_WATER_PLAYBACK_ROWS);
}

function mapReservoirLevelToSceneY(level: number | null | undefined) {
  if (typeof level !== "number") {
    return WATER_LEVEL_Y;
  }

  if (RESERVOIR_COTA_MAX_M <= RESERVOIR_COTA_MIN_M) {
    return WATER_LEVEL_Y;
  }

  const normalized = Math.min(
    Math.max(
      (level - RESERVOIR_COTA_MIN_M) /
        (RESERVOIR_COTA_MAX_M - RESERVOIR_COTA_MIN_M),
      0
    ),
    1
  );

  return WATER_VISUAL_MIN_Y + normalized * (WATER_LEVEL_Y - WATER_VISUAL_MIN_Y);
}

function summarizeMetric(
  rows: CsvRow[],
  key: string,
  label: string,
  unit?: string
): NumericSummary {
  const values = rows
    .map((row) => toNumber(row[key]))
    .filter((value): value is number => value !== null);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    key,
    label,
    unit,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    avg: values.length ? total / values.length : null,
    latest: values.length ? values[values.length - 1] : null,
    count: values.length,
  };
}

function hasNumericValue(rows: CsvRow[], key: string) {
  return rows.some((row) => toNumber(row[key]) !== null);
}

function getSummaryValue(metric: NumericSummary | undefined, stat: SummaryStat) {
  if (!metric) return null;
  return stat === "max" ? metric.max : metric.latest;
}

function formatCategoryName(value: string) {
  return value.trim() === "" || value === "blank" ? "No flags" : value;
}

function isUnflaggedQualityValue(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "ok" ||
    normalized === "null" ||
    normalized === "blank" ||
    normalized === "no flags"
  );
}

function formatPercent(part: number, total: number) {
  if (total === 0) return "0%";
  const percent = (part / total) * 100;
  if (percent > 0 && percent < 0.01) return `${percent.toFixed(3)}%`;
  return `${percent.toFixed(2)}%`;
}

function getOrbitSnapshot(controls: any): OrbitSnapshot | null {
  const camera = controls?.object;
  const target = controls?.target;

  if (!camera || !target) return null;

  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);

  return {
    radius: spherical.radius,
    theta: spherical.theta,
    phi: spherical.phi,
  };
}

function angleDelta(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function summarizeQualityRows(rows: CsvRow[], key: string) {
  const flaggedRows = rows.filter(
    (row) => !isUnflaggedQualityValue(row[key])
  ).length;

  return {
    flaggedRows,
    totalRows: rows.length,
    percentLabel: formatPercent(flaggedRows, rows.length),
  };
}

function countQualityFlags(rows: CsvRow[], key: string) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const rawValue = row[key];
    if (isUnflaggedQualityValue(rawValue)) return;

    rawValue
      .split(";")
      .map((value) => formatCategoryName(value))
      .filter((value) => !isUnflaggedQualityValue(value))
      .forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
  });

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );
}

function countBy(rows: CsvRow[], key: string, fallback = "No flags") {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = formatCategoryName(row[key] || fallback);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );
}

function groupWeatherByDay(rows: CsvRow[]) {
  const grouped = new Map<
    string,
    { date: string; tempSum: number; humiditySum: number; precipSum: number; tempCount: number; humidityCount: number }
  >();

  rows.forEach((row) => {
    const date = row.date_local || compactDate(row.timestamp_local);
    if (!date) return;

    const entry =
      grouped.get(date) ??
      {
        date,
        tempSum: 0,
        humiditySum: 0,
        precipSum: 0,
        tempCount: 0,
        humidityCount: 0,
      };
    const temperature = toNumber(row.temperature_c);
    const humidity = toNumber(row.relative_humidity_pct);
    const precipitation = toNumber(row.precipitation);

    if (temperature !== null) {
      entry.tempSum += temperature;
      entry.tempCount += 1;
    }
    if (humidity !== null) {
      entry.humiditySum += humidity;
      entry.humidityCount += 1;
    }
    if (precipitation !== null) {
      entry.precipSum += precipitation;
    }

    grouped.set(date, entry);
  });

  return Array.from(grouped.values()).map((entry) => ({
    date: entry.date,
    temperature:
      entry.tempCount > 0 ? entry.tempSum / entry.tempCount : null,
    humidity:
      entry.humidityCount > 0 ? entry.humiditySum / entry.humidityCount : null,
    precipitation: entry.precipSum,
  }));
}

function getRange(rows: CsvRow[], key: string) {
  const values = rows.map((row) => row[key]).filter(Boolean);
  if (!values.length) return "-";
  return `${compactDate(values[0])} to ${compactDate(values[values.length - 1])}`;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <BarChart3Icon className="size-4 text-slate-500" />
        {title}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className="mt-1 break-words text-base font-bold leading-tight text-slate-950"
        title={value}
      >
        {value}
      </div>
      <div
        className="mt-2 h-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

function SummaryGrid({
  rows,
  config,
  metrics,
  rangeKey,
  primaryStat = "latest",
  qualityKey = "quality_flags",
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  metrics: NumericSummary[];
  rangeKey: string;
  primaryStat?: SummaryStat;
  qualityKey?: string;
}) {
  const qualitySummary = useMemo(
    () => summarizeQualityRows(rows, qualityKey),
    [rows, qualityKey]
  );
  const qualityValue =
    qualitySummary.flaggedRows === 0
      ? "0 flagged rows (All rows OK)"
      : `${qualitySummary.flaggedRows.toLocaleString()} flagged rows / ${qualitySummary.totalRows.toLocaleString()} (${qualitySummary.percentLabel})`;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile label="Rows" value={rows.length.toLocaleString()} accent={config.color} />
      <StatTile label="Range" value={getRange(rows, rangeKey)} accent="#0f172a" />
      <StatTile label="Data quality" value={qualityValue} accent="#64748b" />
      <StatTile
        label={metrics[0]?.label ?? "Latest"}
        value={`${formatNumber(getSummaryValue(metrics[0], primaryStat))}${metrics[0]?.unit ? ` ${metrics[0].unit}` : ""}`}
        accent={config.color}
      />
    </div>
  );
}

function DataPreview({ rows }: { rows: CsvRow[] }) {
  const columns = Object.keys(rows[0] ?? {}).slice(0, 8);
  const preview = rows.slice(0, 60);

  return (
    <div className="h-full overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-950 text-white">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 odd:bg-slate-50">
              {columns.map((column) => (
                <td key={column} className="max-w-[220px] truncate px-3 py-2">
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricTable({ metrics }: { metrics: NumericSummary[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-3 py-2">Metric</th>
            <th className="px-3 py-2">Min</th>
            <th className="px-3 py-2">Avg</th>
            <th className="px-3 py-2">Max</th>
            <th className="px-3 py-2">Latest</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.key} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-950">
                {metric.label}
              </td>
              <td className="px-3 py-2">{formatNumber(metric.min)}</td>
              <td className="px-3 py-2">{formatNumber(metric.avg)}</td>
              <td className="px-3 py-2">{formatNumber(metric.max)}</td>
              <td className="px-3 py-2">
                {formatNumber(metric.latest)}
                {metric.unit ? ` ${metric.unit}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatasetMenu({
  activeKey,
  isOpen,
  onOpenChange,
  onSelect,
}: {
  activeKey: DatasetKey | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (key: DatasetKey) => void;
}) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-5 z-20 flex w-[min(760px,calc(100vw-440px))] -translate-x-1/2 flex-col items-center"
      style={{ minWidth: 360 }}
    >
      <div
        className={cn(
          "pointer-events-auto w-full overflow-hidden rounded-xl bg-white/92 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out",
          isOpen
            ? "max-h-44 translate-y-0 border border-white/45 p-2 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-4 border-0 p-0 opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="grid grid-cols-4 gap-2">
          {DATASETS.map((dataset) => {
            const Icon = dataset.icon;
            const isActive = activeKey === dataset.key;

            return (
              <Button
                key={dataset.key}
                type="button"
                variant={isActive ? "default" : "secondary"}
                size="sm"
                onClick={() => onSelect(dataset.key)}
                className="h-10 justify-start overflow-hidden px-3 text-xs"
                title={dataset.title}
                style={{
                  backgroundColor: isActive ? dataset.color : undefined,
                  color: isActive ? "white" : undefined,
                }}
              >
                <Icon className="size-4" />
                <span className="truncate">{dataset.shortTitle}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        size="icon-lg"
        variant={isOpen ? "secondary" : "default"}
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "pointer-events-auto rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "mt-2" : "mt-0",
          isOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        aria-label={isOpen ? "Hide CSV visualizations" : "Show CSV visualizations"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronUpIcon className="size-6" />
        ) : (
          <ChevronDownIcon className="size-6" />
        )}
      </Button>
    </div>
  );
}

function ReservoirAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const nmeReference = 1197;
  const npaReference = 1217.5;
  const metrics = useMemo(
    () => [summarizeMetric(rows, "cota_m", "Cota", "m")],
    [rows]
  );
  const data = useMemo(
    () =>
      sampleRows(rows).map((row) => ({
        date: compactDate(row.timestamp_local),
        cota: toNumber(row.cota_m),
      })),
    [rows]
  );

  return (
    <AnalysisLayout
      rows={rows}
      config={config}
      metrics={metrics}
      rangeKey="timestamp_local"
      mainTitle="Hourly reservoir cota"
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={32} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={nmeReference} stroke="#0f766e" strokeDasharray="4 4" label="NME 1197 m" />
          <ReferenceLine y={npaReference} stroke="#dc2626" strokeDasharray="4 4" label="NPA 1217.5 m" />
          <Line type="monotone" dataKey="cota" stroke={config.color} dot={false} strokeWidth={2} />
        </LineChart>
      }
      sideTitle="Non-ok quality flags"
      sideChart={<QualityBar rows={rows} color={config.color} nonOkOnly />}
    />
  );
}

function ManualCotaAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const metrics = useMemo(
    () => [
      summarizeMetric(rows, "cota_m", "Manual cota", "m"),
      summarizeMetric(rows, "nme_m", "NME", "m"),
      summarizeMetric(rows, "npa_m", "NPA", "m"),
    ],
    [rows]
  );
  const data = useMemo(
    () =>
      sampleRows(rows, 360).map((row) => ({
        date: compactDate(row.timestamp_local),
        cota: toNumber(row.cota_m),
        nme: toNumber(row.nme_m),
        npa: toNumber(row.npa_m),
      })),
    [rows]
  );

  return (
    <AnalysisLayout
      rows={rows}
      config={config}
      metrics={metrics}
      rangeKey="timestamp_local"
      mainTitle="Manual cota against references"
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={28} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cota" stroke={config.color} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="nme" stroke="#0f766e" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="npa" stroke="#dc2626" dot={false} strokeWidth={1.5} />
        </LineChart>
      }
      sideTitle="Weather notes"
      sideChart={<CategoryBar rows={rows} field="weather_normalized" color={config.color} />}
    />
  );
}

const PIEZOMETER_LINE_COLORS = [
  "#1d4ed8",
  "#ef4444",
  "#d946ef",
  "#22c55e",
  "#f97316",
  "#1e3a8a",
  "#0f766e",
  "#7c3aed",
];

function PiezometerPressureCotasChart({ rows }: { rows: CsvRow[] }) {
  const instruments = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.piezometer_id).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [rows]
  );
  const data = useMemo(() => {
    const grouped = new Map<string, Record<string, string | number | null>>();

    rows.forEach((row) => {
      const date = compactDate(row.timestamp_local || row.measurement_date);
      const instrument = row.piezometer_id;
      if (!date || !instrument) return;

      const entry = grouped.get(date) ?? {
        date,
        naa: null,
        aterro: null,
      };
      const pressure = toNumber(row.pore_pressure_kpa);
      const naa = toNumber(row.naa_m);
      const aterro = toNumber(row.aterro_m);

      if (pressure !== null) entry[instrument] = pressure;
      if (naa !== null) entry.naa = naa;
      if (aterro !== null) entry.aterro = aterro;

      grouped.set(date, entry);
    });

    return Array.from(grouped.values());
  }, [rows]);

  if (data.length === 0) {
    return (
      <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
        No piezometer history rows found in the selected timeline range.
      </div>
    );
  }

  return (
    <LineChart data={data} margin={{ left: 12, right: 16, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" minTickGap={30} />
      <YAxis
        yAxisId="pressure"
        domain={[-20, 200]}
        label={{
          value: "Pressao intersticial (kPa)",
          angle: -90,
          position: "insideLeft",
          style: { textAnchor: "middle" },
        }}
      />
      <YAxis
        yAxisId="cota"
        orientation="right"
        domain={[1180, 1252]}
        label={{
          value: "Cota NAA / aterro (m)",
          angle: 90,
          position: "insideRight",
          style: { textAnchor: "middle" },
        }}
      />
      <Tooltip />
      <Legend />
      {instruments.map((instrument, index) => (
        <Line
          key={instrument}
          yAxisId="pressure"
          type="linear"
          dataKey={instrument}
          stroke={PIEZOMETER_LINE_COLORS[index % PIEZOMETER_LINE_COLORS.length]}
          dot={false}
          strokeWidth={2}
          connectNulls
          name={instrument}
        />
      ))}
      <Line
        yAxisId="cota"
        type="stepAfter"
        dataKey="aterro"
        stroke="#9a3412"
        dot={false}
        strokeWidth={3}
        connectNulls
        name="C. ATERRO"
      />
      <Line
        yAxisId="cota"
        type="stepAfter"
        dataKey="naa"
        stroke="#8ecae6"
        dot={false}
        strokeWidth={3}
        connectNulls
        name="NAA"
      />
    </LineChart>
  );
}

function PiezometerMetadataAnalysis({
  rows,
  config,
  selectedStartDate,
  selectedEndDate,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
}) {
  const [historyRows, setHistoryRows] = useState<CsvRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const metrics = useMemo(
    () => [
      summarizeMetric(rows, "latest_pore_pressure_kpa", "Max latest pressure", "kPa"),
      summarizeMetric(rows, "latest_piezometric_cota_m", "Piezometric cota", "m"),
      summarizeMetric(rows, "latest_temperature_c", "Temperature", "C"),
    ],
    [rows]
  );
  const data = useMemo(
    () =>
      rows.map((row) => ({
        id: row.piezometer_id,
        pressure: toNumber(row.latest_pore_pressure_kpa),
        cota: toNumber(row.latest_piezometric_cota_m),
        temperature: toNumber(row.latest_temperature_c),
      })),
    [rows]
  );
  const filteredHistoryRows = useMemo(
    () =>
      filterRowsByDateRange(
        historyRows,
        "timestamp_local",
        selectedStartDate,
        selectedEndDate
      ),
    [historyRows, selectedStartDate, selectedEndDate]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistoryCsv() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(`${DAM_CSV_BASE}/04_piezometer_history_long.csv`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        setHistoryRows(parseCsv(text));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setHistoryError(
          err instanceof Error ? err.message : "Failed to load piezometer history"
        );
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistoryCsv();

    return () => controller.abort();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <SummaryGrid
        rows={rows}
        config={config}
        metrics={metrics}
        rangeKey="latest_timestamp_local"
        primaryStat="max"
        qualityKey="latest_quality_flags"
      />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={68}>
          <ChartCard title="Pressao intersticial, NAA e cota do aterro">
            {historyLoading ? (
              <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
                Loading piezometer history
              </div>
            ) : historyError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {historyError}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PiezometerPressureCotasChart rows={filteredHistoryRows} />
              </ResponsiveContainer>
            )}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={32}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={38}>
              <ChartCard title="Latest temperatures">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="temperature" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30}>
              <ChartCard title="Latest pore pressure by instrument">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pressure" fill={config.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={32}>
              <DataPreview rows={rows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function PiezometerHistoryAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const instruments = useMemo(
    () => Array.from(new Set(rows.map((row) => row.piezometer_id).filter(Boolean))),
    [rows]
  );
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (instruments[0] && !instruments.includes(selected)) {
      setSelected(instruments[0]);
    } else if (!instruments.length && selected) {
      setSelected("");
    }
  }, [instruments, selected]);

  const filteredRows = useMemo(
    () => rows.filter((row) => row.piezometer_id === (selected || instruments[0])),
    [rows, selected, instruments]
  );
  const metrics = useMemo(
    () => [
      summarizeMetric(filteredRows, "pore_pressure_kpa", "Pore pressure", "kPa"),
      summarizeMetric(filteredRows, "piezometric_cota_m", "Piezometric cota", "m"),
      summarizeMetric(filteredRows, "temperature_c", "Temperature", "C"),
    ],
    [filteredRows]
  );
  const data = useMemo(
    () =>
      sampleRows(filteredRows, 420).map((row) => ({
        date: compactDate(row.timestamp_local),
        pressure: toNumber(row.pore_pressure_kpa),
        cota: toNumber(row.piezometric_cota_m),
        temperature: toNumber(row.temperature_c),
      })),
    [filteredRows]
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <SummaryGrid rows={filteredRows} config={config} metrics={metrics} rangeKey="timestamp_local" />
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {instruments.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={`Pressure and cota - ${selected || instruments[0] || ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={28} />
                <YAxis yAxisId="left" domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="pressure" stroke={config.color} dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="cota" stroke="#2563eb" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title="Temperature history">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={28} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <DataPreview rows={filteredRows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const SEEPAGE_OVERVIEW = "__overview__";
const SEEPAGE_SERIES = [
  { id: "right_cell_percolated", label: "Caudal percolado (MD)", color: "#c94c4c" },
  { id: "bmd_percolated", label: "Caudal percolado (ME)", color: "#3b82f6" },
  { id: "left_cell_resurgence", label: "Ressurgencia (ME)", color: "#84cc16" },
  { id: "bmd_resurgence", label: "Ressurgencia (MD)", color: "#7c3aed" },
  { id: "total_percolated_and_resurgence_flow", label: "Caudal total", color: "#16a34a" },
];

function SeepageAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const components = useMemo(
    () => Array.from(new Set(rows.map((row) => row.component_id).filter(Boolean))),
    [rows]
  );
  const [selected, setSelected] = useState(SEEPAGE_OVERVIEW);
  const isOverview = selected === SEEPAGE_OVERVIEW;

  useEffect(() => {
    if (selected === SEEPAGE_OVERVIEW) return;

    if (components[0] && !components.includes(selected)) {
      setSelected(SEEPAGE_OVERVIEW);
    } else if (!components.length && selected !== SEEPAGE_OVERVIEW) {
      setSelected(SEEPAGE_OVERVIEW);
    }
  }, [components, selected]);

  const displayRows = useMemo(
    () =>
      isOverview
        ? rows
        : rows.filter((row) => row.component_id === selected),
    [rows, selected, isOverview]
  );
  const metrics = useMemo(
    () => [
      summarizeMetric(displayRows, "flow_l_s", "Flow", "l/s"),
      summarizeMetric(displayRows, "reservoir_cota_m", "Reservoir cota", "m"),
      summarizeMetric(displayRows, "computed_total_from_components_l_s", "Computed total", "l/s"),
    ],
    [displayRows]
  );
  const data = useMemo(
    () =>
      sampleRows(displayRows, 420).map((row) => ({
        date: compactDate(row.timestamp_local),
        flow: toNumber(row.flow_l_s),
        cota: toNumber(row.reservoir_cota_m),
      })),
    [displayRows]
  );
  const overviewData = useMemo(() => {
    const grouped = new Map<string, Record<string, string | number | null>>();

    rows.forEach((row) => {
      const date = compactDate(row.timestamp_local);
      const componentId = row.component_id;
      if (!date || !componentId) return;

      const entry = grouped.get(date) ?? { date, naa: null };
      const flow = toNumber(row.flow_l_s);
      const cota = toNumber(row.reservoir_cota_m);

      if (flow !== null) entry[componentId] = flow;
      if (cota !== null) entry.naa = cota;

      grouped.set(date, entry);
    });

    return Array.from(grouped.values());
  }, [rows]);
  const totalData = useMemo(
    () =>
      sampleRows(
        rows.filter(
          (row) => row.component_id === "total_percolated_and_resurgence_flow"
        ),
        420
      ).map((row) => ({
        date: compactDate(row.timestamp_local),
        total: toNumber(row.flow_l_s),
        computedTotal: toNumber(row.computed_total_from_components_l_s),
      })),
    [rows]
  );
  const selectedLabel =
    SEEPAGE_SERIES.find((item) => item.id === selected)?.label ?? selected;
  const mainChart = isOverview ? (
    overviewData.length > 0 ? (
      <LineChart data={overviewData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" minTickGap={28} />
        <YAxis yAxisId="flow" domain={[0, "auto"]} />
        <YAxis yAxisId="cota" orientation="right" domain={["auto", "auto"]} />
        <Tooltip />
        <Legend />
        {SEEPAGE_SERIES.map((series) => (
          <Line
            key={series.id}
            yAxisId="flow"
            type="linear"
            dataKey={series.id}
            stroke={series.color}
            dot={false}
            strokeWidth={series.id === "total_percolated_and_resurgence_flow" ? 3 : 2}
            connectNulls
            name={series.label}
          />
        ))}
        <Line
          yAxisId="cota"
          type="linear"
          dataKey="naa"
          stroke="#0ea5e9"
          dot={false}
          strokeWidth={3}
          connectNulls
          name="NAA"
        />
      </LineChart>
    ) : (
      <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
        No seepage rows found in the selected timeline range.
      </div>
    )
  ) : (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" minTickGap={28} />
      <YAxis yAxisId="left" domain={["auto", "auto"]} />
      <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} />
      <Tooltip />
      <Legend />
      <Line yAxisId="left" type="monotone" dataKey="flow" stroke={config.color} dot={false} strokeWidth={2} />
      <Line yAxisId="right" type="monotone" dataKey="cota" stroke="#2563eb" dot={false} strokeWidth={2} />
    </LineChart>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <SummaryGrid rows={displayRows} config={config} metrics={metrics} rangeKey="timestamp_local" />
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value={SEEPAGE_OVERVIEW}>Overview</option>
          {components.map((id) => (
            <option key={id} value={id}>
              {SEEPAGE_SERIES.find((item) => item.id === id)?.label ?? id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={isOverview ? "Caudais percolados" : `Component flow and reservoir cota - ${selectedLabel}`}>
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title={isOverview ? "Component status overview" : "Selected component status"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countBy(displayRows, "status").slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={config.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25}>
              <ChartCard title="Total seepage over time">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={28} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke={config.color} dot={false} strokeWidth={2} name="Total flow l/s" />
                    <Line type="monotone" dataKey="computedTotal" stroke="#64748b" dot={false} strokeWidth={1.5} name="Computed total l/s" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30}>
              <DataPreview rows={displayRows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const TEMPORARY_BICA_OVERVIEW = "__overview__";
const TEMPORARY_BICA_SERIES = [
  { id: "bica_1", label: "Bica 1", color: "#22c55e" },
  { id: "bica_2_totalizadora", label: "Bica 2 (Totalizadora)", color: "#c94c4c" },
  { id: "bica_3", label: "Bica 3", color: "#111827" },
];

function TemporaryBicaAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const components = useMemo(
    () => Array.from(new Set(rows.map((row) => row.component_id).filter(Boolean))),
    [rows]
  );
  const [selected, setSelected] = useState(TEMPORARY_BICA_OVERVIEW);
  const isOverview = selected === TEMPORARY_BICA_OVERVIEW;

  useEffect(() => {
    if (selected === TEMPORARY_BICA_OVERVIEW) return;

    if (components[0] && !components.includes(selected)) {
      setSelected(TEMPORARY_BICA_OVERVIEW);
    } else if (!components.length && selected !== TEMPORARY_BICA_OVERVIEW) {
      setSelected(TEMPORARY_BICA_OVERVIEW);
    }
  }, [components, selected]);

  const displayRows = useMemo(
    () =>
      isOverview
        ? rows
        : rows.filter((row) => row.component_id === selected),
    [rows, selected, isOverview]
  );
  const metrics = useMemo(
    () => [
      summarizeMetric(displayRows, "clean_flow_l_s", "Clean flow", "l/s"),
      summarizeMetric(displayRows, "source_flow_l_s", "Source flow", "l/s"),
      summarizeMetric(displayRows, "computed_clean_sum_l_s", "Clean sum", "l/s"),
    ],
    [displayRows]
  );
  const data = useMemo(
    () =>
      sampleRows(displayRows, 420).map((row) => ({
        date: compactDate(row.timestamp_local),
        component: row.component_id,
        clean: toNumber(row.clean_flow_l_s),
        source: toNumber(row.source_flow_l_s),
      })),
    [displayRows]
  );
  const overviewData = useMemo(() => {
    const grouped = new Map<string, Record<string, string | number | null>>();

    rows.forEach((row) => {
      const date = compactDate(row.timestamp_local);
      const componentId = row.component_id;
      if (!date || !componentId) return;

      const entry = grouped.get(date) ?? { date, naa: null };
      const flow = toNumber(row.clean_flow_l_s);
      const cota = toNumber(row.reservoir_cota_m);

      if (flow !== null) entry[componentId] = flow;
      if (cota !== null) entry.naa = cota;

      grouped.set(date, entry);
    });

    return sampleRows(Array.from(grouped.values()), 620);
  }, [rows]);
  const selectedLabel =
    TEMPORARY_BICA_SERIES.find((item) => item.id === selected)?.label ??
    selected;
  const overviewHasData = overviewData.length > 0;

  const mainChart = isOverview ? (
    overviewHasData ? (
      <LineChart data={overviewData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" minTickGap={30} />
        <YAxis yAxisId="flow" domain={[0, "auto"]} />
        <YAxis yAxisId="cota" orientation="right" domain={["auto", "auto"]} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="cota"
          type="linear"
          dataKey="naa"
          stroke="#0ea5e9"
          dot={false}
          strokeWidth={3}
          connectNulls
          name="NAA"
        />
        {TEMPORARY_BICA_SERIES.map((series) => (
          <Line
            key={series.id}
            yAxisId="flow"
            type="linear"
            dataKey={series.id}
            stroke={series.color}
            dot={false}
            strokeWidth={2}
            connectNulls
            name={series.label}
          />
        ))}
      </LineChart>
    ) : (
      <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
        No bica rows found in the selected timeline range.
      </div>
    )
  ) : (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" minTickGap={30} />
      <YAxis domain={["auto", "auto"]} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="clean" stroke={config.color} dot={false} strokeWidth={2} name="Clean flow l/s" />
      <Line type="monotone" dataKey="source" stroke="#64748b" dot={false} strokeWidth={1.5} name="Source flow l/s" />
    </LineChart>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <SummaryGrid
          rows={displayRows}
          config={config}
          metrics={metrics}
          rangeKey="timestamp_local"
        />
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value={TEMPORARY_BICA_OVERVIEW}>Overview</option>
          {components.map((id) => (
            <option key={id} value={id}>
              {TEMPORARY_BICA_SERIES.find((item) => item.id === id)?.label ?? id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={isOverview ? "Temporary bica overview" : `Clean and source flow - ${selectedLabel}`}>
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title={isOverview ? "Component status overview" : "Selected component status"}>
                <ResponsiveContainer width="100%" height="100%">
                  <CategoryBar rows={displayRows} field="status" color={config.color} />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <DataPreview rows={displayRows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function WeatherAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const metrics = useMemo(
    () => [
      summarizeMetric(rows, "temperature_c", "Temperature", "C"),
      summarizeMetric(rows, "relative_humidity_pct", "Humidity", "%"),
      summarizeMetric(rows, "precipitation", "Precipitation", "mm"),
    ],
    [rows]
  );
  const data = useMemo(
    () => sampleRows(groupWeatherByDay(rows), 520),
    [rows]
  );

  return (
    <AnalysisLayout
      rows={rows}
      config={config}
      metrics={metrics}
      rangeKey="timestamp_local"
      mainTitle="Daily temperature and humidity"
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={34} />
          <YAxis yAxisId="left" domain={["auto", "auto"]} />
          <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" stroke={config.color} dot={false} strokeWidth={2} />
        </LineChart>
      }
      sideTitle="Daily precipitation"
      sideChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={34} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Bar dataKey="precipitation" fill="#0ea5e9" />
        </BarChart>
      }
    />
  );
}

function TimelineAnalysis({ rows, config }: { rows: CsvRow[]; config: DatasetConfig }) {
  const datasetCounts = useMemo(() => countBy(rows, "source_dataset").slice(0, 12), [rows]);
  const metricCounts = useMemo(() => countBy(rows, "metric").slice(0, 12), [rows]);
  const eventCounts = useMemo(() => countBy(rows, "event_type").slice(0, 8), [rows]);
  const qualitySummary = useMemo(
    () => summarizeQualityRows(rows, "quality_flags"),
    [rows]
  );
  const qualityValue =
    qualitySummary.flaggedRows === 0
      ? "0 flagged rows (All rows OK)"
      : `${qualitySummary.flaggedRows.toLocaleString()} flagged rows / ${qualitySummary.totalRows.toLocaleString()} (${qualitySummary.percentLabel})`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Rows" value={rows.length.toLocaleString()} accent={config.color} />
        <StatTile label="Range" value={getRange(rows, "timestamp_local")} accent="#0f172a" />
        <StatTile label="Data quality" value={qualityValue} accent="#64748b" />
        <StatTile label="Datasets" value={datasetCounts.length.toString()} accent="#64748b" />
        <StatTile label="Metrics" value={metricCounts.length.toString()} accent={config.color} />
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={58}>
          <ChartCard title="Events by source dataset">
            <ResponsiveContainer width="100%" height="100%">
              <HorizontalCategoryBar data={datasetCounts} color={config.color} />
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={42}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title="Metric coverage">
                <ResponsiveContainer width="100%" height="100%">
                  <HorizontalCategoryBar data={metricCounts} color="#334155" />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={22}>
              <ChartCard title="Event types">
                <ResponsiveContainer width="100%" height="100%">
                  <HorizontalCategoryBar data={eventCounts} color="#64748b" />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={33}>
              <DataPreview rows={rows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function InclinometerMetadataAnalysis({
  rows,
  config,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
}) {
  const metrics = useMemo(
    () => [
      summarizeMetric(
        rows,
        "latest_max_abs_mj_displacement_mm",
        "Max latest MJ",
        "mm"
      ),
      summarizeMetric(
        rows,
        "latest_max_abs_me_md_displacement_mm",
        "Max latest ME/MD",
        "mm"
      ),
      summarizeMetric(rows, "depth_max_m", "Max depth", "m"),
      summarizeMetric(rows, "observation_count", "Observations"),
    ],
    [rows]
  );
  const data = useMemo(
    () =>
      rows.map((row) => ({
        id: row.inclinometer_id,
        mj: toNumber(row.latest_max_abs_mj_displacement_mm),
        meMd: toNumber(row.latest_max_abs_me_md_displacement_mm),
        depth: toNumber(row.depth_max_m),
        observations: toNumber(row.observation_count),
      })),
    [rows]
  );

  return (
    <AnalysisLayout
      rows={rows}
      config={config}
      metrics={metrics}
      rangeKey="latest_observation_date"
      primaryStat="max"
      mainTitle="Latest max displacement by inclinometer"
      mainChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="mj" fill={config.color} name="MJ max abs mm" />
          <Bar dataKey="meMd" fill="#0f766e" name="ME/MD max abs mm" />
        </BarChart>
      }
      sideTitle="Depth coverage"
      sideChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="depth" fill="#2563eb" name="Depth max m" />
          <Bar dataKey="observations" fill="#64748b" name="Observations" />
        </BarChart>
      }
    />
  );
}

function InclinometerSummaryAnalysis({
  rows,
  config,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
}) {
  const instruments = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.inclinometer_id).filter(Boolean))),
    [rows]
  );
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (instruments[0] && !instruments.includes(selected)) {
      setSelected(instruments[0]);
    } else if (!instruments.length && selected) {
      setSelected("");
    }
  }, [instruments, selected]);

  const filteredRows = useMemo(
    () => rows.filter((row) => row.inclinometer_id === (selected || instruments[0])),
    [rows, selected, instruments]
  );
  const hasMeMd = useMemo(
    () => hasNumericValue(filteredRows, "max_abs_me_md_displacement_mm"),
    [filteredRows]
  );
  const metrics = useMemo(
    () => {
      const nextMetrics = [
      summarizeMetric(filteredRows, "max_abs_mj_displacement_mm", "Max abs MJ", "mm"),
      summarizeMetric(filteredRows, "depth_at_max_abs_mj_m", "Depth at max MJ", "m"),
      summarizeMetric(filteredRows, "depth_count_including_bottom_zero", "Depth rows"),
      ];

      if (hasMeMd) {
        nextMetrics.splice(
          1,
          0,
          summarizeMetric(
            filteredRows,
            "max_abs_me_md_displacement_mm",
            "Max abs ME/MD",
            "mm"
          )
        );
      }

      return nextMetrics;
    },
    [filteredRows, hasMeMd]
  );
  const data = useMemo(
    () =>
      filteredRows.map((row) => ({
        date: compactDate(row.observation_date),
        mj: toNumber(row.max_abs_mj_displacement_mm),
        meMd: toNumber(row.max_abs_me_md_displacement_mm),
        depthMj: toNumber(row.depth_at_max_abs_mj_m),
      })),
    [filteredRows]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <SummaryGrid
          rows={filteredRows}
          config={config}
          metrics={metrics}
          rangeKey="observation_date"
          primaryStat="max"
        />
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {instruments.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={`Observation envelope - ${selected || instruments[0] || ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={26} />
                <YAxis yAxisId="left" domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="mj" stroke={config.color} dot={false} strokeWidth={2} name="Max abs MJ mm" />
                {hasMeMd ? (
                  <Line yAxisId="left" type="monotone" dataKey="meMd" stroke="#0f766e" dot={false} strokeWidth={2} name="Max abs ME/MD mm" />
                ) : null}
                <Line yAxisId="right" type="monotone" dataKey="depthMj" stroke="#2563eb" dot={false} strokeWidth={1.5} name="Depth at max MJ m" />
              </LineChart>
            </ResponsiveContainer>
            {!hasMeMd ? (
              <div className="mt-2 text-xs font-medium text-slate-500">
                ME/MD direction is not available for this inclinometer.
              </div>
            ) : null}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={42}>
              <ChartCard title="Observation role coverage">
                <ResponsiveContainer width="100%" height="100%">
                  <CategoryBar rows={filteredRows} field="observation_role" color={config.color} />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={22}>
              <MetricTable metrics={metrics} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={36}>
              <DataPreview rows={filteredRows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function InclinometerHistoryAnalysis({
  rows,
  config,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
}) {
  const profileColors = [
    "#111827",
    "#6b7280",
    "#0284c7",
    "#eab308",
    "#93c5fd",
    "#1e3a8a",
    "#ea580c",
    "#4d7c0f",
    "#0f2d6b",
    "#92400e",
    "#7c3aed",
    "#0ea5e9",
    "#c4b5fd",
    "#f97316",
    "#16a34a",
    "#facc15",
    "#9ca3af",
    "#fdba74",
    "#a16207",
    "#22c55e",
    "#0f766e",
    "#71717a",
    "#ea580c",
    "#dc2626",
  ];
  const instruments = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.inclinometer_id).filter(Boolean))),
    [rows]
  );
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [profileView, setProfileView] = useState<
    "current" | "allMj" | "allMeMd" | "geometryMj" | "geometryMeMd"
  >("current");

  useEffect(() => {
    if (instruments[0] && !instruments.includes(selectedInstrument)) {
      setSelectedInstrument(instruments[0]);
    } else if (!instruments.length && selectedInstrument) {
      setSelectedInstrument("");
    }
  }, [instruments, selectedInstrument]);

  const instrumentRows = useMemo(
    () =>
      rows.filter(
        (row) => row.inclinometer_id === (selectedInstrument || instruments[0])
      ),
    [rows, selectedInstrument, instruments]
  );
  const observations = useMemo(
    () =>
      Array.from(
        new Map(
          instrumentRows
            .filter((row) => row.observation_number)
            .map((row) => [
              row.observation_number,
              {
                number: row.observation_number,
                label: row.observation_label || `OBS ${row.observation_number}`,
                date: compactDate(row.observation_date),
              },
            ])
        ).values()
      ),
    [instrumentRows]
  );
  const [selectedObservation, setSelectedObservation] = useState("");

  useEffect(() => {
    if (
      observations.length &&
      !observations.some((item) => item.number === selectedObservation)
    ) {
      setSelectedObservation(observations[observations.length - 1].number);
    }
  }, [observations, selectedObservation]);

  const profileRows = useMemo(
    () =>
      instrumentRows
        .filter(
          (row) =>
            row.observation_number ===
            (selectedObservation || observations[observations.length - 1]?.number)
        )
        .slice()
        .sort((a, b) => (toNumber(a.depth_h_m) ?? 0) - (toNumber(b.depth_h_m) ?? 0)),
    [instrumentRows, selectedObservation, observations]
  );
  const hasMeMd = useMemo(
    () => hasNumericValue(profileRows, "me_md_displacement_mm"),
    [profileRows]
  );
  const metrics = useMemo(
    () => {
      const nextMetrics = [
        summarizeMetric(profileRows, "mj_displacement_mm", "MJ displacement", "mm"),
        summarizeMetric(profileRows, "depth_h_m", "Depth", "m"),
        summarizeMetric(instrumentRows, "observation_number", "Observations"),
      ];

      if (hasMeMd) {
        nextMetrics.splice(
          1,
          0,
          summarizeMetric(
            profileRows,
            "me_md_displacement_mm",
            "ME/MD displacement",
            "mm"
          )
        );
      }

      return nextMetrics;
    },
    [profileRows, instrumentRows, hasMeMd]
  );
  const profileData = useMemo(
    () =>
      profileRows.map((row) => ({
        depth: toNumber(row.depth_h_m),
        mj: toNumber(row.mj_displacement_mm),
        meMd: toNumber(row.me_md_displacement_mm),
        geometryMj: toNumber(row.stat_m_j_raw),
        geometryMeMd: toNumber(row.stat_e_d_raw),
        rawMj: toNumber(row.stat_m_j_raw),
      })),
    [profileRows]
  );
  const depthTicks = useMemo(() => {
    const maxDepth = Math.max(
      0,
      ...profileData
        .map((row) => row.depth)
        .filter((value): value is number => value !== null)
    );
    const tickStep = maxDepth > 50 ? 10 : 5;
    const ticks = Array.from(
      { length: Math.floor(maxDepth / tickStep) + 1 },
      (_, index) => index * tickStep
    );

    if (maxDepth > 0 && ticks[ticks.length - 1] !== maxDepth) {
      ticks.push(maxDepth);
    }

    return ticks;
  }, [profileData]);
  const multiProfileData = useMemo(() => {
    const grouped = new Map<string, Record<string, string | number | null>>();

    instrumentRows.forEach((row) => {
      const depth = toNumber(row.depth_h_m);
      const observationNumber = row.observation_number;
      if (depth === null || !observationNumber) return;

      const entry = grouped.get(String(depth)) ?? { depth };
      entry[`obs_${observationNumber}`] =
        profileView === "allMeMd"
          ? toNumber(row.me_md_displacement_mm)
          : toNumber(row.mj_displacement_mm);
      grouped.set(String(depth), entry);
    });

    return Array.from(grouped.values()).sort(
      (a, b) => Number(a.depth) - Number(b.depth)
    );
  }, [instrumentRows, profileView]);
  const observationTrend = useMemo(() => {
    const grouped = new Map<
      string,
      { date: string; maxMj: number; maxMeMd: number | null }
    >();

    instrumentRows.forEach((row) => {
      const key = row.observation_number;
      if (!key) return;
      const mjValue = toNumber(row.mj_displacement_mm);
      const meMdValue = toNumber(row.me_md_displacement_mm);
      const mj = Math.abs(mjValue ?? 0);
      const current = grouped.get(key) ?? {
        date: compactDate(row.observation_date),
        maxMj: 0,
        maxMeMd: null,
      };
      current.maxMj = Math.max(current.maxMj, mj);
      if (meMdValue !== null) {
        const meMd = Math.abs(meMdValue);
        current.maxMeMd =
          current.maxMeMd === null ? meMd : Math.max(current.maxMeMd, meMd);
      }
      grouped.set(key, current);
    });

    return Array.from(grouped.values());
  }, [instrumentRows]);
  const hasMultiMeMd = useMemo(
    () => hasNumericValue(instrumentRows, "me_md_displacement_mm"),
    [instrumentRows]
  );
  const selectedObservationDate =
    observations.find((observation) => observation.number === selectedObservation)
      ?.date ?? observations[observations.length - 1]?.date ?? "";
  const mainTitle =
    profileView === "allMj"
      ? "MJ displacement profiles by observation"
      : profileView === "allMeMd"
        ? "ME/MD displacement profiles by observation"
        : profileView === "geometryMj"
          ? `Geometry MJ profile - ${selectedObservationDate}`
          : profileView === "geometryMeMd"
            ? `Geometry ME/MD profile - ${selectedObservationDate}`
            : "Depth profile displacement";
  const mainChart =
    profileView === "allMj" || profileView === "allMeMd" ? (
      <LineChart data={multiProfileData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={["auto", "auto"]} />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
        />
        <Tooltip />
        <Legend />
        {observations.map((observation, index) => (
          <Line
            key={observation.number}
            type="linear"
            dataKey={`obs_${observation.number}`}
            stroke={profileColors[index % profileColors.length]}
            dot={false}
            strokeWidth={
              observation.number === selectedObservation ? 3 : 1.8
            }
            connectNulls
            name={observation.date}
          />
        ))}
      </LineChart>
    ) : profileView === "geometryMj" || profileView === "geometryMeMd" ? (
      <LineChart data={profileData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={["auto", "auto"]} />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
        />
        <Tooltip />
        <Legend />
        <Line
          type="linear"
          dataKey={
            profileView === "geometryMeMd" ? "geometryMeMd" : "geometryMj"
          }
          stroke="#00e313"
          dot={false}
          strokeWidth={3}
          name={selectedObservationDate}
        />
      </LineChart>
    ) : (
      <LineChart data={profileData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={["auto", "auto"]} />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="mj" stroke={config.color} dot={false} strokeWidth={2} name="MJ displacement mm" />
        {hasMeMd ? (
          <Line type="monotone" dataKey="meMd" stroke="#0f766e" dot={false} strokeWidth={2} name="ME/MD displacement mm" />
        ) : null}
      </LineChart>
    );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <SummaryGrid
          rows={profileRows}
          config={config}
          metrics={metrics}
          rangeKey="observation_date"
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
            value={selectedInstrument}
            onChange={(event) => setSelectedInstrument(event.target.value)}
          >
            {instruments.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
            value={selectedObservation}
            onChange={(event) => setSelectedObservation(event.target.value)}
          >
            {observations.map((observation) => (
              <option key={observation.number} value={observation.number}>
                {observation.label} - {observation.date}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
            value={profileView}
            onChange={(event) =>
              setProfileView(
                event.target.value as
                  | "current"
                  | "allMj"
                  | "allMeMd"
                  | "geometryMj"
                  | "geometryMeMd"
              )
            }
          >
            <option value="current">Selected profile</option>
            <option value="allMj">All MJ profiles</option>
            <option value="allMeMd" disabled={!hasMultiMeMd}>
              All ME/MD profiles
            </option>
            <option value="geometryMj">Geometry MJ</option>
            <option value="geometryMeMd" disabled={!hasMeMd}>
              Geometry ME/MD
            </option>
          </select>
        </div>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={mainTitle}>
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
            {!hasMeMd ? (
              <div className="mt-2 text-xs font-medium text-slate-500">
                ME/MD direction is not available for this inclinometer.
              </div>
            ) : null}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title="Max displacement per observation">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={observationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={26} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="maxMj" stroke={config.color} dot={false} strokeWidth={2} name="Max MJ mm" />
                    {hasMeMd ? (
                      <Line type="monotone" dataKey="maxMeMd" stroke="#0f766e" dot={false} strokeWidth={2} name="Max ME/MD mm" />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
                {!hasMeMd ? (
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    ME/MD direction is not available for this inclinometer.
                  </div>
                ) : null}
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <DataPreview rows={profileRows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function QualityBar({
  rows,
  color,
  field = "quality_flags",
  nonOkOnly = false,
}: {
  rows: CsvRow[];
  color: string;
  field?: string;
  nonOkOnly?: boolean;
}) {
  const data = useMemo(() => {
    const counts = nonOkOnly
      ? countQualityFlags(rows, field)
      : countBy(rows, field);
    return counts.length > 0
      ? counts.slice(0, 8)
      : [{ name: "No flagged rows", count: 0 }];
  }, [rows, field, nonOkOnly]);

  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={72} />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function CategoryBar({
  rows,
  field,
  color,
}: {
  rows: CsvRow[];
  field: string;
  color: string;
}) {
  return (
    <BarChart data={countBy(rows, field).slice(0, 8)}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={72} />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function HorizontalCategoryBar({
  data,
  color,
}: {
  data: { name: string; count: number }[];
  color: string;
}) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis
        dataKey="name"
        type="category"
        width={150}
        tick={{ fontSize: 11 }}
      />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function AnalysisLayout({
  rows,
  config,
  metrics,
  rangeKey,
  primaryStat = "latest",
  qualityKey = "quality_flags",
  mainTitle,
  mainChart,
  sideTitle,
  sideChart,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  metrics: NumericSummary[];
  rangeKey: string;
  primaryStat?: SummaryStat;
  qualityKey?: string;
  mainTitle: string;
  mainChart: React.ReactElement;
  sideTitle: string;
  sideChart: React.ReactElement;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <SummaryGrid
        rows={rows}
        config={config}
        metrics={metrics}
        rangeKey={rangeKey}
        primaryStat={primaryStat}
        qualityKey={qualityKey}
      />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard title={mainTitle}>
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title={sideTitle}>
                <ResponsiveContainer width="100%" height="100%">
                  {sideChart}
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={22}>
              <MetricTable metrics={metrics} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={33}>
              <DataPreview rows={rows} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function DatasetAnalysisWindow({
  config,
  selectedStartDate,
  selectedEndDate,
  instrumentFilter,
}: {
  config: DatasetConfig;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  instrumentFilter?: {
    key: "piezometer_id" | "inclinometer_id";
    value: string;
  };
}) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCsv() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        const response = await fetch(
          `${config.basePath ?? DAM_CSV_BASE}/${config.fileName}`,
          {
          signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        setRows(parseCsv(text));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load CSV");
      } finally {
        setLoading(false);
      }
    }

    loadCsv();

    return () => controller.abort();
  }, [config]);

  const Icon = config.icon;
  const filteredRows = useMemo(() => {
    const timelineRows = filterRowsByDateRange(
        rows,
        config.dateKey,
        selectedStartDate,
        selectedEndDate
      );

    if (!instrumentFilter) return timelineRows;

    return timelineRows.filter(
      (row) => row[instrumentFilter.key] === instrumentFilter.value
    );
  }, [
    rows,
    config.dateKey,
    selectedStartDate,
    selectedEndDate,
    instrumentFilter,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 p-5 text-slate-950">
      <div className="mb-4 flex shrink-0 items-start justify-between gap-4 pr-20">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-lg text-white shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold leading-tight">{config.title}</h2>
              <p className="text-sm text-slate-600">{config.description}</p>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
          {config.fileName}
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-0 flex-1 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600">
          Loading {config.fileName}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No rows found in the selected timeline range.
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          {config.key === "reservoir" && <ReservoirAnalysis rows={filteredRows} config={config} />}
          {config.key === "manualCota" && <ManualCotaAnalysis rows={filteredRows} config={config} />}
          {config.key === "piezometerMetadata" && (
            <PiezometerMetadataAnalysis
              rows={filteredRows}
              config={config}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
            />
          )}
          {config.key === "piezometerHistory" && <PiezometerHistoryAnalysis rows={filteredRows} config={config} />}
          {config.key === "seepage" && <SeepageAnalysis rows={filteredRows} config={config} />}
          {config.key === "temporaryBica" && <TemporaryBicaAnalysis rows={filteredRows} config={config} />}
          {config.key === "weather" && <WeatherAnalysis rows={filteredRows} config={config} />}
          {config.key === "timeline" && <TimelineAnalysis rows={filteredRows} config={config} />}
          {config.key === "inclinometerMetadata" && <InclinometerMetadataAnalysis rows={filteredRows} config={config} />}
          {config.key === "inclinometerSummary" && <InclinometerSummaryAnalysis rows={filteredRows} config={config} />}
          {config.key === "inclinometerHistory" && <InclinometerHistoryAnalysis rows={filteredRows} config={config} />}
        </div>
      )}
    </div>
  );
}

function SensorDataWindow({
  sensor,
  mapping,
  selectedStartDate,
  selectedEndDate,
}: {
  sensor: MonitoringSensorItem;
  mapping: SensorDataMapping | null;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
}) {
  const [view, setView] = useState<SensorDataView>("metadata");

  useEffect(() => {
    setView("metadata");
  }, [sensor.id]);

  if (!mapping)
    return (
      <SensorDataPanel
        sensor={sensor}
        mapping={null}
        view={view}
        onViewChange={setView}
      />
    );

  const configKey: DatasetKey =
    mapping.kind === "piezometer"
      ? view === "metadata"
        ? "piezometerMetadata"
        : "piezometerHistory"
      : view === "metadata"
        ? "inclinometerMetadata"
        : "inclinometerHistory";
  const config = DATASETS.find((dataset) => dataset.key === configKey);
  const instrumentKey =
    mapping.kind === "piezometer" ? "piezometer_id" : "inclinometer_id";

  if (!config) return null;

  return (
    <SensorDataPanel
      sensor={sensor}
      mapping={mapping}
      view={view}
      onViewChange={setView}
    >
      <DatasetAnalysisWindow
        config={config}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        instrumentFilter={{ key: instrumentKey, value: mapping.instrumentId }}
      />
    </SensorDataPanel>
  );
}

export default function Page() {
  const controlsRef = useRef<any>(null);
  const initialOrbitRef = useRef<OrbitSnapshot | null>(null);
  const initialRainIntensityRef = useRef(0.65);

  const [showCountup] = useState(false);
  const [sensors, setSensors] =
    useState<MonitoringSensorItem[]>(initialSensors);
  const [createdGuideSensorCount, setCreatedGuideSensorCount] = useState(0);
  const [showTwoTiles, setShowTwoTiles] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(0.65);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const [isRainPanelOpen, setIsRainPanelOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSensorSidebarOpen, setIsSensorSidebarOpen] = useState(true);
  const [isDatasetMenuOpen, setIsDatasetMenuOpen] = useState(false);
  const [activeDatasetKey, setActiveDatasetKey] = useState<DatasetKey | null>(null);
  const [focusedSensor, setFocusedSensor] =
    useState<MonitoringSensorItem | null>(null);
  const [dataSensor, setDataSensor] =
    useState<MonitoringSensorItem | null>(null);
  const [gizmoSensorId, setGizmoSensorId] = useState<string | null>(null);
  const [gizmoMode, setGizmoMode] = useState<SensorGizmoMode>("translate");

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [guideLanguage, setGuideLanguage] = useState<GuideLanguage>("en");
  const [objectives, setObjectives] =
    useState<ObjectiveStatus>(INITIAL_OBJECTIVES);

  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [timelineValues, setTimelineValues] = useState<[number, number]>([
    0, 100,
  ]);
  const [waterLevels, setWaterLevels] = useState<WaterLevelRow[]>([]);
  const [isWaterLoading, setIsWaterLoading] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const activeStep = GUIDE_STEPS[activeStepIndex];
  const isRainStep = activeStep.id === "change-rain";
  const isTwoTilesStep = activeStep.id === "show-two-tiles";
  const isTimelineStep = activeStep.id === "timeline-playback";
  const isRightControlsPhase = isRainStep || isTwoTilesStep;
  const isGuidePanelLeft = isRainStep || isTwoTilesStep || isTimelineStep;
  const isPostGraphGuidePhase =
    isRainStep ||
    isTwoTilesStep ||
    activeStep.id === "add-sensor" ||
    isTimelineStep;
  const isAddSensorStep = activeStep.id === "add-sensor";
  const isGizmoStep = activeStep.id === "sensor-gizmos";
  const hasChosenTimelineInterval =
    timelineValues[0] > 0.01 || timelineValues[1] < 99.99;

  const activeStepComplete = activeStep.objectives.every(
    (objective) => objectives[objective.id]
  );

  const isFinished =
    activeStepIndex === GUIDE_STEPS.length - 1 && activeStepComplete;

  const activeDataset = useMemo(
    () => DATASETS.find((dataset) => dataset.key === activeDatasetKey) ?? null,
    [activeDatasetKey]
  );
  const dataSensorMapping = useMemo(
    () => (dataSensor ? getSensorDataMapping(dataSensor) : null),
    [dataSensor]
  );

  function completeObjective(objectiveId: GuideObjective["id"]) {
    setObjectives((current) => {
      if (current[objectiveId]) return current;

      return {
        ...current,
        [objectiveId]: true,
      };
    });
  }

  const openSensorData = React.useCallback((sensor: MonitoringSensorItem) => {
    setFocusedSensor(sensor);
    setActiveDatasetKey(null);
    setDataSensor(sensor);

    if (activeStepIndex === 2) {
      completeObjective("openGraph");
    }
  }, [activeStepIndex]);

  const handleSelectedRangeChange = React.useCallback(
    (
      fromDate: Date,
      toDate: Date,
      nextTimelineValues: [number, number]
    ) => {
      setSelectedStartDate(fromDate);
      setSelectedEndDate(toDate);
      setTimelineValues(nextTimelineValues);
    },
    []
  );

  function handleTimelineOpenChange(nextIsOpen: boolean) {
    setIsTimelineOpen(nextIsOpen);

    if (isTimelineStep && nextIsOpen) {
      completeObjective("openTimeline");
    }
  }

  function handleSensorSelect(sensor: MonitoringSensorItem) {
    setFocusedSensor(sensor);

    if (activeStepIndex === 1) {
      completeObjective("selectSensor");
    }
  }

  function handleRainIntensityChange(value: number) {
    setRainIntensity(value);

    if (
      isRainStep &&
      Math.abs(value - initialRainIntensityRef.current) >= 0.05
    ) {
      completeObjective("changeRain");
    }
  }

  function handleToggleTwoTiles() {
    const nextValue = !showTwoTiles;

    setShowTwoTiles(nextValue);

    if (isTwoTilesStep && nextValue) {
      completeObjective("showTwoTiles");
    }
  }

  function handleCreateGuideSensor(sensor: MonitoringSensorItem) {
    setSensors((currentSensors) => [...currentSensors, sensor]);
    setCreatedGuideSensorCount((count) => count + 1);
    setFocusedSensor(sensor);

    if (isAddSensorStep) {
      completeObjective("addSensor");
    }
  }

  function handleActivateSensorGizmos(sensor: MonitoringSensorItem) {
    setFocusedSensor(sensor);
    setGizmoSensorId(sensor.id);

    if (isGizmoStep) {
      completeObjective("useGizmos");
    }
  }

  function handleOrbitChange() {
    const snapshot = getOrbitSnapshot(controlsRef.current);

    if (!snapshot) return;

    if (!initialOrbitRef.current) {
      initialOrbitRef.current = snapshot;
      return;
    }

    const initial = initialOrbitRef.current;
    const hasRotated =
      angleDelta(snapshot.theta, initial.theta) > 0.16 ||
      Math.abs(snapshot.phi - initial.phi) > 0.12;
    const hasZoomed = Math.abs(snapshot.radius - initial.radius) > 8;

    if (activeStepIndex === 0 && hasRotated) {
      completeObjective("rotate");
    }

    if (activeStepIndex === 0 && hasZoomed) {
      completeObjective("zoom");
    }
  }

  function handleAdvance() {
    if (!activeStepComplete) return;

    const nextCompletedCount = Math.max(
      completedStepCount,
      activeStepIndex + 1
    );

    setCompletedStepCount(nextCompletedCount);

    if (activeStepIndex < GUIDE_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  }

  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsWaterLoading(true);
        setWaterError(null);
        setIsPlaying(false);
        setPlaybackIndex(0);

        const response = await fetch(RESERVOIR_LEVEL_CSV, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load reservoir level CSV");
        }

        const csvText = await response.text();
        const csvRows = parseCsv(csvText);
        const nextWaterLevels = reservoirRowsToWaterLevels(
          csvRows,
          selectedStartDate,
          selectedEndDate
        );

        setWaterLevels(nextWaterLevels);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setWaterError(err instanceof Error ? err.message : "Unknown error");
        setWaterLevels([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
      } finally {
        setIsWaterLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedStartDate, selectedEndDate]);

  useEffect(() => {
    if (!isPlaying || waterLevels.length === 0) return;

    const intervalId = window.setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev + 1;

        if (next >= waterLevels.length) {
          setIsPlaying(false);
          return waterLevels.length - 1;
        }

        return next;
      });
    }, PLAYBACK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, waterLevels.length]);

  useEffect(() => {
    if (!isTimelineOpen) {
      setIsPlaying(false);
    }
  }, [isTimelineOpen]);

  useEffect(() => {
    setIsRainPanelOpen(isRightControlsPhase);
    setIsSensorSidebarOpen(!isPostGraphGuidePhase);

    if (!isGizmoStep) {
      setGizmoSensorId(null);
      setOrbitControlsEnabled(true);
    }
  }, [isRightControlsPhase, isPostGraphGuidePhase, isGizmoStep]);

  useEffect(() => {
    if (isTwoTilesStep && showTwoTiles) {
      completeObjective("showTwoTiles");
    }
  }, [isTwoTilesStep, showTwoTiles]);

  useEffect(() => {
    if (isTimelineStep && isTimelineOpen) {
      completeObjective("openTimeline");
    }

    if (isTimelineStep && hasChosenTimelineInterval) {
      completeObjective("chooseDateInterval");
    }
  }, [isTimelineStep, isTimelineOpen, hasChosenTimelineInterval]);

  const currentPlaybackRow = waterLevels[playbackIndex] ?? null;

  const playbackProgress =
    waterLevels.length <= 1
      ? 0
      : (playbackIndex / (waterLevels.length - 1)) * 100;

  const dynamicWaterLevelY = useMemo(() => {
    return mapReservoirLevelToSceneY(currentPlaybackRow?.level);
  }, [currentPlaybackRow]);

  function handlePlayPause() {
    if (waterLevels.length === 0 || isWaterLoading) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (playbackIndex >= waterLevels.length - 1) {
      setPlaybackIndex(0);
    }

    if (isTimelineStep && objectives.chooseDateInterval) {
      completeObjective("runAnimation");
    }

    setIsPlaying(true);
  }

  function handleResetPlayback() {
    setIsPlaying(false);
    setPlaybackIndex(0);
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <RainControlPanel
        rainIntensity={rainIntensity}
        isOpen={isRainPanelOpen}
        onRainIntensityChange={handleRainIntensityChange}
        onOpenChange={setIsRainPanelOpen}
        showTwoTiles={showTwoTiles}
        onToggleTwoTiles={handleToggleTwoTiles}
      />

      <DatasetMenu
        activeKey={activeDatasetKey}
        isOpen={isDatasetMenuOpen}
        onOpenChange={setIsDatasetMenuOpen}
        onSelect={(key) => {
          setDataSensor(null);
          setActiveDatasetKey(key);
        }}
      />

      <WaterPlaybackPanel
        isVisible={isTimelineOpen}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        isWaterLoading={isWaterLoading}
        waterLevels={waterLevels}
        currentPlaybackRow={currentPlaybackRow}
        waterError={waterError}
        playbackIndex={playbackIndex}
        playbackProgress={playbackProgress}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onResetPlayback={handleResetPlayback}
      />

      {isGizmoStep ? (
        <GuideSensorGizmoSidebar
          sensors={sensors}
          isOpen={isSensorSidebarOpen}
          isTimelineOpen={isTimelineOpen}
          gizmoSensorId={gizmoSensorId}
          language={guideLanguage}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
          onActivateGizmos={handleActivateSensorGizmos}
        />
      ) : (
        <SensorSidebar
          sensors={sensors}
          isOpen={isSensorSidebarOpen}
          isTimelineOpen={isTimelineOpen}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
          onViewSensorData={openSensorData}
        />
      )}

      <GuideCallouts
        activeStepIndex={activeStepIndex}
        language={guideLanguage}
      />

      <GuidePanel
        activeStepIndex={activeStepIndex}
        completedStepCount={completedStepCount}
        objectiveStatus={objectives}
        selectedSensorTitle={focusedSensor?.title}
        side={isGuidePanelLeft ? "left" : "right"}
        language={guideLanguage}
        canAdvance={activeStepComplete}
        isFinished={isFinished}
        onLanguageChange={setGuideLanguage}
        onAdvance={handleAdvance}
      >
        {isAddSensorStep ? (
          <AddSensorPanel
            createdCount={createdGuideSensorCount}
            language={guideLanguage}
            onCreateSensor={handleCreateGuideSensor}
          />
        ) : null}
        {isGizmoStep ? (
          <GuideGizmoModePanel
            activeSensorTitle={
              sensors.find((sensor) => sensor.id === gizmoSensorId)?.title
            }
            mode={gizmoMode}
            language={guideLanguage}
            onModeChange={setGizmoMode}
          />
        ) : null}
      </GuidePanel>

      <Canvas
        shadows={false}
        dpr={1}
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 80, 140], fov: 55, near: 1, far: 100000 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <Environment background="only" files="/skyy.hdr" />

        <Suspense fallback={null}>
          <GuideMontesinhoScene
            showTwoTiles={showTwoTiles}
            showCountup={showCountup}
            onCubeClick={openSensorData}
            focusedSensor={focusedSensor}
            controlsRef={controlsRef}
            sensors={sensors}
            rainIntensity={rainIntensity}
            waterLevelY={dynamicWaterLevelY}
            gizmoSensorId={gizmoSensorId}
            gizmoMode={gizmoMode}
            onGizmoDragStart={() => setOrbitControlsEnabled(false)}
            onGizmoDragEnd={() => setOrbitControlsEnabled(true)}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={GUIDE_TARGET}
          maxPolarAngle={Math.PI / 2.05}
          enabled={orbitControlsEnabled}
          enableDamping
          dampingFactor={0.08}
          onChange={handleOrbitChange}
        />
      </Canvas>

      <TimelineDock
        isOpen={isTimelineOpen}
        onOpenChange={handleTimelineOpenChange}
        defaultStartDate={RESERVOIR_TIMELINE_START_DATE}
        defaultEndDate={RESERVOIR_TIMELINE_END_DATE}
        onSelectedRangeChange={handleSelectedRangeChange}
      />

      {dataSensor && (
        <OverlayModal
          width="min(1500px, 96vw)"
          height="min(92vh, 940px)"
          zIndex={60}
          onClose={() => setDataSensor(null)}
        >
          <SensorDataWindow
            sensor={dataSensor}
            mapping={dataSensorMapping}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
        </OverlayModal>
      )}

      {activeDataset && (
        <OverlayModal
          width="min(1500px, 96vw)"
          height="min(92vh, 940px)"
          zIndex={55}
          onClose={() => setActiveDatasetKey(null)}
        >
          <DatasetAnalysisWindow
            config={activeDataset}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
        </OverlayModal>
      )}
    </div>
  );
}
