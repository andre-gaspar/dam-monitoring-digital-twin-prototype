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

import { initialSensors } from "@/components/montesinho11/initialSensors";
import { OverlayModal } from "@/components/montesinho11/OverlayModal";
import { RainControlPanel } from "@/components/montesinho11/RainControlPanel";
import { SensorSidebar } from "@/components/montesinho11/SensorSidebar";
import { TimelineDock } from "@/components/montesinho11/TimelineDock";
import { WaterPlaybackPanel } from "@/components/montesinho11/WaterPlaybackPanel";
import {
  WATER_LEVEL_Y,
  WATER_VISUAL_MIN_Y,
} from "@/components/montesinho11/constants";
import type {
  MonitoringSensorItem,
  WaterLevelRow,
} from "@/components/montesinho11/types";
import {
  getSensorDataMapping,
  type SensorDataMapping,
} from "@/components/montesinho11/sensorDataMapping";
import {
  SensorDataPanel,
  type SensorDataView,
} from "@/components/montesinho11/SensorDataPanel";
import {
  localizeDataset,
  localizeSensors,
  montesinhoCopy,
  type MontesinhoLanguage,
} from "@/components/montesinho11/i18n";
import { AddSensorPanel } from "@/components/montesinho11guide/AddSensorPanel";
import { GuideCallouts } from "@/components/montesinho11guide/GuideCallouts";
import { GuideDataChallengePanel } from "@/components/montesinho11guide/GuideDataChallengePanel";
import {
  GuideGizmoModePanel,
  type SensorGizmoMode,
} from "@/components/montesinho11guide/GuideGizmoModePanel";
import { GuideMontesinhoScene } from "@/components/montesinho11guide/GuideMontesinhoScene";
import { GuidePanel } from "@/components/montesinho11guide/GuidePanel";
import { GuideSensorGizmoSidebar } from "@/components/montesinho11guide/GuideSensorGizmoSidebar";
import {
  GUIDE_STEPS,
  type GuideObjective,
} from "@/components/montesinho11guide/guideContent";
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
  dateKey: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

type InstrumentFilter = {
  key: "piezometer_id" | "inclinometer_id";
  value: string;
};

type DatasetApiResponse = {
  ok: boolean;
  count?: number | null;
  offset?: number;
  limit?: number;
  returned?: number;
  nextOffset?: number | null;
  truncated?: boolean;
  data?: CsvRow[];
  error?: string;
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

type OpenTimelineHandler = () => void;

type InclinometerProfileView =
  | "current"
  | "allMj"
  | "allMeMd"
  | "geometryMj"
  | "geometryMeMd";

type OrbitSnapshot = {
  radius: number;
  theta: number;
  phi: number;
};

type ObjectiveStatus = Record<GuideObjective["id"], boolean>;

const MONTESINHO_API_BASE = "/api";
const RESERVOIR_LEVEL_API = `${MONTESINHO_API_BASE}/reservoir_level_hourly`;
const API_PAGE_SIZE = 1000;
const DASHBOARD_PROGRESS_FLUSH_PAGE_COUNT = 5;
const MAX_API_ROWS_PER_DATASET = 250000;
const RESERVOIR_TIMELINE_START_DATE = new Date(2014, 9, 7, 0, 0, 0, 0);
const RESERVOIR_TIMELINE_END_DATE = new Date(2026, 4, 25, 0, 0, 0, 0);
const RESERVOIR_COTA_MIN_M = 1192.5;
const RESERVOIR_COTA_MAX_M = 1218.63;
const GUIDE_PLAYBACK_INTERVAL_MS = 12;
const MAX_WATER_PLAYBACK_ROWS = 1000;
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
  openDatasetMenu: false,
  openReservoirDashboard: false,
  openPiezometerMenu: false,
  openPiezometerDashboard: false,
  answerPiezometerPressure: false,
  openInclinometerMenu: false,
  openInclinometerDashboard: false,
  changeInclinometerProfile: false,
  openDroneCaptures: false,
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
    dateKey: "observation_date",
    description: "Depth-by-depth historical displacement profiles for each inclinometer.",
    icon: GaugeIcon,
    color: "#0284c7",
  },
];

function getDatasetApiPath(config: DatasetConfig) {
  const routeName = config.fileName
    .replace(/^\d+_/, "")
    .replace(/\.csv$/, "");

  return `${MONTESINHO_API_BASE}/${routeName}`;
}

function formatApiDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildRowsApiUrl(
  apiPath: string,
  options: {
    selectedStartDate?: Date | null;
    selectedEndDate?: Date | null;
    instrumentFilter?: InstrumentFilter;
    limit?: number;
    offset?: number;
  } = {}
) {
  const params = new URLSearchParams();

  if (options.selectedStartDate) {
    params.set("start", formatApiDateParam(options.selectedStartDate));
  }

  if (options.selectedEndDate) {
    params.set(
      "stop",
      formatApiDateParam(endOfSelectedLocalDay(options.selectedEndDate))
    );
  }

  if (options.instrumentFilter) {
    params.set(options.instrumentFilter.key, options.instrumentFilter.value);
  }

  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }

  if (typeof options.offset === "number") {
    params.set("offset", String(options.offset));
  }

  const queryString = params.toString();
  return queryString ? `${apiPath}?${queryString}` : apiPath;
}

async function readRowsPageFromApi(
  response: Response
): Promise<DatasetApiResponse> {
  let payload: DatasetApiResponse | null = null;

  try {
    payload = (await response.json()) as DatasetApiResponse;
  } catch {
    // Fall through to the HTTP error below.
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  return {
    ...payload,
    data: payload.data ?? [],
  };
}

async function readAllRowsFromApi(
  apiPath: string,
  options: {
    selectedStartDate?: Date | null;
    selectedEndDate?: Date | null;
    instrumentFilter?: InstrumentFilter;
    signal?: AbortSignal;
    onProgressRows?: (rows: CsvRow[]) => void;
    progressFlushPageCount?: number;
  } = {}
): Promise<CsvRow[]> {
  const rows: CsvRow[] = [];
  let offset = 0;
  let expectedCount: number | null = null;
  let pageCount = 0;
  let lastPublishedRowCount = 0;
  const progressFlushPageCount = Math.max(
    1,
    options.progressFlushPageCount ?? Number.POSITIVE_INFINITY
  );
  const publishProgressRows = () => {
    if (!options.onProgressRows || rows.length === lastPublishedRowCount) return;
    lastPublishedRowCount = rows.length;
    options.onProgressRows([...rows]);
  };

  while (rows.length < MAX_API_ROWS_PER_DATASET) {
    const response = await fetch(
      buildRowsApiUrl(apiPath, {
        selectedStartDate: options.selectedStartDate,
        selectedEndDate: options.selectedEndDate,
        instrumentFilter: options.instrumentFilter,
        limit: API_PAGE_SIZE,
        offset,
      }),
      {
        signal: options.signal,
      }
    );
    const page = await readRowsPageFromApi(response);
    const pageRows = page.data ?? [];
    pageCount += 1;

    if (typeof page.count === "number") {
      expectedCount = page.count;
    }

    rows.push(...pageRows);

    if (
      rows.length > 0 &&
      (pageCount === 1 || pageCount % progressFlushPageCount === 0)
    ) {
      publishProgressRows();
    }

    if (pageRows.length < API_PAGE_SIZE) break;
    if (typeof expectedCount === "number" && rows.length >= expectedCount) break;
    if (typeof page.nextOffset === "number") {
      offset = page.nextOffset;
    } else {
      offset += pageRows.length;
    }

    if (pageRows.length === 0) break;
  }

  publishProgressRows();

  return rows;
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

function formatCategoryName(value: string, language: MontesinhoLanguage) {
  return value.trim() === "" || value === "blank"
    ? montesinhoCopy[language].noFlags
    : value;
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

function countQualityFlags(
  rows: CsvRow[],
  key: string,
  language: MontesinhoLanguage
) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const rawValue = row[key];
    if (isUnflaggedQualityValue(rawValue)) return;

    rawValue
      .split(";")
      .map((value) => formatCategoryName(value, language))
      .filter((value) => !isUnflaggedQualityValue(value))
      .forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
  });

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );
}

function countBy(
  rows: CsvRow[],
  key: string,
  language: MontesinhoLanguage,
  fallback = montesinhoCopy[language].noFlags
) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = formatCategoryName(row[key] || fallback, language);
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

function getRange(rows: CsvRow[], key: string, language: MontesinhoLanguage) {
  const values = rows.map((row) => row[key]).filter(Boolean);
  if (!values.length) return "-";
  return `${compactDate(values[0])} ${
    language === "pt" ? "a" : "to"
  } ${compactDate(values[values.length - 1])}`;
}

function bottomAxisLabel(value: string) {
  return {
    value,
    position: "insideBottom" as const,
  };
}

function leftAxisLabel(value: string) {
  return {
    value,
    angle: -90,
    position: "insideLeft" as const,
    style: { textAnchor: "middle" as const },
  };
}

function rightAxisLabel(value: string) {
  return {
    value,
    angle: 90,
    position: "insideRight" as const,
    style: { textAnchor: "middle" as const },
  };
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

function TimelineTriggerPanel({
  rows,
  rangeKey,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  rangeKey: string;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];

  return (
    <div className="flex h-full min-h-[180px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarClockIcon className="size-4 text-slate-500" />
          {copy.timelineRange}
        </div>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-950">
            {getRange(rows, rangeKey, language)}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">
            {rows.length.toLocaleString()} {copy.rowsInCurrentDashboardRange}
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={onOpenTimeline}
        className="mt-4 w-full justify-center"
      >
        <CalendarClockIcon className="size-4" />
        {copy.openBottomTimeline}
      </Button>
    </div>
  );
}

function MetricTable({
  metrics,
  language,
}: {
  metrics: NumericSummary[];
  language: MontesinhoLanguage;
}) {
  const copy = montesinhoCopy[language];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-3 py-2">{copy.metric}</th>
            <th className="px-3 py-2">{copy.min}</th>
            <th className="px-3 py-2">{copy.avg}</th>
            <th className="px-3 py-2">{copy.max}</th>
            <th className="px-3 py-2">{copy.latest}</th>
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
                <span data-guide-target={`metric-${metric.key}-latest`}>
                  {formatNumber(metric.latest)}
                  {metric.unit ? ` ${metric.unit}` : ""}
                </span>
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
  isSensorSidebarOpen,
  datasets,
  language,
  onOpenChange,
  onSelect,
}: {
  activeKey: DatasetKey | null;
  isOpen: boolean;
  isSensorSidebarOpen: boolean;
  datasets: DatasetConfig[];
  language: MontesinhoLanguage;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (key: DatasetKey) => void;
}) {
  const copy = montesinhoCopy[language];
  const shouldAvoidSensorSidebar = isOpen && isSensorSidebarOpen;

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-5 z-20 flex flex-col items-center",
        !shouldAvoidSensorSidebar &&
          "left-1/2 w-[min(760px,calc(100vw-440px))] -translate-x-1/2"
      )}
      style={
        shouldAvoidSensorSidebar
          ? {
              left: "max(452px, calc(50% - 380px))",
              right: "max(220px, calc(50% - 380px))",
              minWidth: 0,
            }
          : { minWidth: 360 }
      }
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
          {datasets.map((dataset) => {
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
                data-guide-target={`dataset-${dataset.key}`}
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
        aria-label={
          isOpen ? copy.hideCsvVisualizations : copy.showCsvVisualizations
        }
        aria-expanded={isOpen}
        data-guide-target="dataset-menu-toggle"
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

function ReservoirAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const nmeReference = 1197;
  const npaReference = 1217.5;
  const metrics = useMemo(
    () => [summarizeMetric(rows, "cota_m", copy.metrics.cota, "m")],
    [rows, copy.metrics.cota]
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
      metrics={metrics}
      rangeKey="timestamp_local"
      language={language}
      onOpenTimeline={onOpenTimeline}
      mainTitle={copy.charts.hourlyReservoirCota}
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            minTickGap={32}
            label={bottomAxisLabel(copy.labels.measurementDateAxis)}
          />
          <YAxis
            domain={["auto", "auto"]}
            label={leftAxisLabel(copy.labels.reservoirElevationAxis)}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine y={nmeReference} stroke="#0f766e" strokeDasharray="4 4" label="NME 1197 m" />
          <ReferenceLine y={npaReference} stroke="#dc2626" strokeDasharray="4 4" label="NPA 1217.5 m" />
          <Line type="monotone" dataKey="cota" stroke={config.color} dot={false} strokeWidth={2} />
        </LineChart>
      }
      sideTitle={copy.charts.nonOkQualityFlags}
      sideChart={
        <QualityBar
          rows={rows}
          color={config.color}
          language={language}
          nonOkOnly
        />
      }
    />
  );
}

function ManualCotaAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const metrics = useMemo(
    () => [
      summarizeMetric(rows, "cota_m", copy.metrics.manualCota, "m"),
      summarizeMetric(rows, "nme_m", copy.metrics.nme, "m"),
      summarizeMetric(rows, "npa_m", copy.metrics.npa, "m"),
    ],
    [rows, copy.metrics.manualCota, copy.metrics.nme, copy.metrics.npa]
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
      metrics={metrics}
      rangeKey="timestamp_local"
      language={language}
      onOpenTimeline={onOpenTimeline}
      mainTitle={copy.charts.manualCotaReferences}
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            minTickGap={28}
            label={bottomAxisLabel(copy.labels.observationDateAxis)}
          />
          <YAxis
            domain={["auto", "auto"]}
            label={leftAxisLabel(copy.labels.elevationAxis)}
          />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cota" stroke={config.color} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="nme" stroke="#0f766e" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="npa" stroke="#dc2626" dot={false} strokeWidth={1.5} />
        </LineChart>
      }
      sideTitle={copy.charts.weatherNotes}
      sideChart={
        <CategoryBar
          rows={rows}
          field="weather_normalized"
          color={config.color}
          language={language}
          xAxisLabel={copy.labels.weatherConditionAxis}
          yAxisLabel={copy.labels.observationsAxis}
        />
      }
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

function PiezometerPressureCotasChart({
  rows,
  language,
}: {
  rows: CsvRow[];
  language: MontesinhoLanguage;
}) {
  const copy = montesinhoCopy[language];
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
        {copy.charts.noPiezometerRows}
      </div>
    );
  }

  return (
    <LineChart data={data} margin={{ left: 12, right: 16, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        minTickGap={30}
        label={bottomAxisLabel(copy.labels.measurementDateAxis)}
      />
      <YAxis
        yAxisId="pressure"
        domain={[-20, 200]}
        label={{
          value: copy.labels.pressureAxis,
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
          value: copy.labels.cotaAxis,
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
        name={copy.labels.aterro}
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
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const [historyRows, setHistoryRows] = useState<CsvRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
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

    async function loadHistoryRows() {
      setHistoryLoading(true);
      setHistoryError(null);
      setHistoryRows([]);

      try {
        const nextRows = await readAllRowsFromApi(
          `${MONTESINHO_API_BASE}/piezometer_history_long`,
          {
            selectedStartDate,
            selectedEndDate,
            signal: controller.signal,
            onProgressRows: (progressRows) => {
              if (!controller.signal.aborted) setHistoryRows(progressRows);
            },
            progressFlushPageCount: DASHBOARD_PROGRESS_FLUSH_PAGE_COUNT,
          }
        );
        if (!controller.signal.aborted && nextRows.length === 0) {
          setHistoryRows([]);
        }
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setHistoryError(
          err instanceof Error ? err.message : copy.charts.failedPiezometerHistory
        );
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }

    loadHistoryRows();

    return () => controller.abort();
  }, [selectedStartDate, selectedEndDate]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={68}>
          <ChartCard title={copy.charts.porePressureNaaEmbankment}>
            {historyLoading && filteredHistoryRows.length === 0 ? (
              <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
                {copy.charts.loadingPiezometerHistory}
              </div>
            ) : historyError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {historyError}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PiezometerPressureCotasChart
                  rows={filteredHistoryRows}
                  language={language}
                />
              </ResponsiveContainer>
            )}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={32}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={38}>
              <ChartCard title={copy.charts.latestTemperatures}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="id"
                      label={bottomAxisLabel(copy.labels.piezometerAxis)}
                    />
                    <YAxis
                      label={leftAxisLabel(copy.labels.temperatureCelsiusAxis)}
                    />
                    <Tooltip />
                    <Bar dataKey="temperature" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30}>
              <ChartCard title={copy.charts.latestPorePressureByInstrument}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="id"
                      label={bottomAxisLabel(copy.labels.piezometerAxis)}
                    />
                    <YAxis label={leftAxisLabel(copy.labels.pressureAxis)} />
                    <Tooltip />
                    <Bar dataKey="pressure" fill={config.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={32}>
              <TimelineTriggerPanel
                rows={rows}
                rangeKey="latest_timestamp_local"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function PiezometerHistoryAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
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
      <div className="flex shrink-0 flex-wrap items-center justify-start gap-3">
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
          <ChartCard title={`${copy.charts.pressureAndCota} - ${selected || instruments[0] || ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  minTickGap={28}
                  label={bottomAxisLabel(copy.labels.measurementDateAxis)}
                />
                <YAxis
                  yAxisId="left"
                  domain={["auto", "auto"]}
                  label={leftAxisLabel(copy.labels.pressureAxis)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={["auto", "auto"]}
                  label={rightAxisLabel(copy.labels.piezometricElevationAxis)}
                />
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
              <ChartCard title={copy.charts.temperatureHistory}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      minTickGap={28}
                      label={bottomAxisLabel(copy.labels.measurementDateAxis)}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      label={leftAxisLabel(copy.labels.temperatureCelsiusAxis)}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <TimelineTriggerPanel
                rows={filteredRows}
                rangeKey="timestamp_local"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const SEEPAGE_OVERVIEW = "__overview__";
const SEEPAGE_SERIES = [
  {
    id: "right_cell_percolated",
    label: { pt: "Caudal percolado (MD)", en: "Percolated flow (RD)" },
    color: "#c94c4c",
  },
  {
    id: "bmd_percolated",
    label: { pt: "Caudal percolado (ME)", en: "Percolated flow (LE)" },
    color: "#3b82f6",
  },
  {
    id: "left_cell_resurgence",
    label: { pt: "Ressurgência (ME)", en: "Resurgence (LE)" },
    color: "#84cc16",
  },
  {
    id: "bmd_resurgence",
    label: { pt: "Ressurgência (MD)", en: "Resurgence (RD)" },
    color: "#7c3aed",
  },
  {
    id: "total_percolated_and_resurgence_flow",
    label: { pt: "Caudal total", en: "Total flow" },
    color: "#16a34a",
  },
];

function SeepageAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
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
    SEEPAGE_SERIES.find((item) => item.id === selected)?.label[language] ??
    selected;
  const mainChart = isOverview ? (
    overviewData.length > 0 ? (
      <LineChart data={overviewData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          minTickGap={28}
          label={bottomAxisLabel(copy.labels.dateAxis)}
        />
        <YAxis
          yAxisId="flow"
          domain={[0, "auto"]}
          label={leftAxisLabel(copy.labels.flowLitresPerSecondAxis)}
        />
        <YAxis
          yAxisId="cota"
          orientation="right"
          domain={["auto", "auto"]}
          label={rightAxisLabel(copy.labels.reservoirElevationAxis)}
        />
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
            name={series.label[language]}
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
        {copy.charts.seepageNoRows}
      </div>
    )
  ) : (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        minTickGap={28}
        label={bottomAxisLabel(copy.labels.dateAxis)}
      />
      <YAxis
        yAxisId="left"
        domain={["auto", "auto"]}
        label={leftAxisLabel(copy.labels.flowLitresPerSecondAxis)}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        domain={["auto", "auto"]}
        label={rightAxisLabel(copy.labels.reservoirElevationAxis)}
      />
      <Tooltip />
      <Legend />
      <Line yAxisId="left" type="monotone" dataKey="flow" stroke={config.color} dot={false} strokeWidth={2} />
      <Line yAxisId="right" type="monotone" dataKey="cota" stroke="#2563eb" dot={false} strokeWidth={2} />
    </LineChart>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-start gap-3">
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value={SEEPAGE_OVERVIEW}>{copy.labels.overview}</option>
          {components.map((id) => (
            <option key={id} value={id}>
              {SEEPAGE_SERIES.find((item) => item.id === id)?.label[language] ?? id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard
            title={
              isOverview
                ? copy.charts.caudaisPercolados
                : `${copy.charts.componentFlowReservoirCota} - ${selectedLabel}`
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard
                title={
                  isOverview
                    ? copy.charts.componentStatusOverview
                    : copy.charts.selectedComponentStatus
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countBy(displayRows, "status", language).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={70}
                      label={bottomAxisLabel(copy.labels.statusAxis)}
                    />
                    <YAxis
                      label={leftAxisLabel(copy.labels.recordCountAxis)}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill={config.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25}>
              <ChartCard title={copy.charts.totalSeepageOverTime}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      minTickGap={28}
                      label={bottomAxisLabel(copy.labels.dateAxis)}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      label={leftAxisLabel(copy.labels.flowLitresPerSecondAxis)}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke={config.color} dot={false} strokeWidth={2} name={copy.labels.totalFlow} />
                    <Line type="monotone" dataKey="computedTotal" stroke="#64748b" dot={false} strokeWidth={1.5} name={copy.labels.computedTotalFlow} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30}>
              <TimelineTriggerPanel
                rows={displayRows}
                rangeKey="timestamp_local"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const TEMPORARY_BICA_OVERVIEW = "__overview__";
const TEMPORARY_BICA_SERIES = [
  { id: "bica_1", label: { pt: "Bica 1", en: "Bica 1" }, color: "#22c55e" },
  {
    id: "bica_2_totalizadora",
    label: { pt: "Bica 2 (Totalizadora)", en: "Bica 2 (Totalizer)" },
    color: "#c94c4c",
  },
  { id: "bica_3", label: { pt: "Bica 3", en: "Bica 3" }, color: "#111827" },
];

function TemporaryBicaAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
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
    TEMPORARY_BICA_SERIES.find((item) => item.id === selected)?.label[language] ??
    selected;
  const overviewHasData = overviewData.length > 0;

  const mainChart = isOverview ? (
    overviewHasData ? (
      <LineChart data={overviewData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          minTickGap={30}
          label={bottomAxisLabel(copy.labels.dateAxis)}
        />
        <YAxis
          yAxisId="flow"
          domain={[0, "auto"]}
          label={leftAxisLabel(copy.labels.flowLitresPerSecondAxis)}
        />
        <YAxis
          yAxisId="cota"
          orientation="right"
          domain={["auto", "auto"]}
          label={rightAxisLabel(copy.labels.reservoirElevationAxis)}
        />
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
            name={series.label[language]}
          />
        ))}
      </LineChart>
    ) : (
      <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
        {copy.charts.temporaryBicaNoRows}
      </div>
    )
  ) : (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        minTickGap={30}
        label={bottomAxisLabel(copy.labels.dateAxis)}
      />
      <YAxis
        domain={["auto", "auto"]}
        label={leftAxisLabel(copy.labels.flowLitresPerSecondAxis)}
      />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="clean" stroke={config.color} dot={false} strokeWidth={2} name={copy.labels.cleanFlowLs} />
      <Line type="monotone" dataKey="source" stroke="#64748b" dot={false} strokeWidth={1.5} name={copy.labels.sourceFlowLs} />
    </LineChart>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-start gap-3">
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value={TEMPORARY_BICA_OVERVIEW}>{copy.labels.overview}</option>
          {components.map((id) => (
            <option key={id} value={id}>
              {TEMPORARY_BICA_SERIES.find((item) => item.id === id)?.label[language] ?? id}
            </option>
          ))}
        </select>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={62}>
          <ChartCard
            title={
              isOverview
                ? copy.charts.temporaryBicaOverview
                : `${copy.charts.cleanAndSourceFlow} - ${selectedLabel}`
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              {mainChart}
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard
                title={
                  isOverview
                    ? copy.charts.componentStatusOverview
                    : copy.charts.selectedComponentStatus
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <CategoryBar
                    rows={displayRows}
                    field="status"
                    color={config.color}
                    language={language}
                    xAxisLabel={copy.labels.statusAxis}
                    yAxisLabel={copy.labels.recordCountAxis}
                  />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <TimelineTriggerPanel
                rows={displayRows}
                rangeKey="timestamp_local"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function WeatherAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const metrics = useMemo(
    () => [
      summarizeMetric(rows, "temperature_c", copy.metrics.temperature, "C"),
      summarizeMetric(rows, "relative_humidity_pct", copy.metrics.humidity, "%"),
      summarizeMetric(rows, "precipitation", copy.metrics.precipitation, "mm"),
    ],
    [
      rows,
      copy.metrics.temperature,
      copy.metrics.humidity,
      copy.metrics.precipitation,
    ]
  );
  const data = useMemo(
    () => sampleRows(groupWeatherByDay(rows), 520),
    [rows]
  );

  return (
    <AnalysisLayout
      rows={rows}
      metrics={metrics}
      rangeKey="timestamp_local"
      language={language}
      onOpenTimeline={onOpenTimeline}
      mainTitle={copy.charts.dailyTemperatureHumidity}
      mainChart={
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            minTickGap={34}
            label={bottomAxisLabel(copy.labels.dateAxis)}
          />
          <YAxis
            yAxisId="left"
            domain={["auto", "auto"]}
            label={leftAxisLabel(copy.labels.meanDailyTemperatureAxis)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={["auto", "auto"]}
            label={rightAxisLabel(copy.labels.meanDailyHumidityAxis)}
          />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" stroke={config.color} dot={false} strokeWidth={2} />
        </LineChart>
      }
      sideTitle={copy.charts.dailyPrecipitation}
      sideChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            minTickGap={34}
            label={bottomAxisLabel(copy.labels.dateAxis)}
          />
          <YAxis
            domain={["auto", "auto"]}
            label={leftAxisLabel(copy.labels.dailyPrecipitationAxis)}
          />
          <Tooltip />
          <Bar dataKey="precipitation" fill="#0ea5e9" />
        </BarChart>
      }
    />
  );
}

function TimelineAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const datasetCounts = useMemo(
    () => countBy(rows, "source_dataset", language).slice(0, 12),
    [rows, language]
  );
  const metricCounts = useMemo(
    () => countBy(rows, "metric", language).slice(0, 12),
    [rows, language]
  );
  const eventCounts = useMemo(
    () => countBy(rows, "event_type", language).slice(0, 8),
    [rows, language]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={58}>
          <ChartCard title={copy.charts.eventsBySourceDataset}>
            <ResponsiveContainer width="100%" height="100%">
              <HorizontalCategoryBar
                data={datasetCounts}
                color={config.color}
                categoryAxisLabel={copy.labels.sourceDatasetAxis}
                countAxisLabel={copy.labels.eventCountAxis}
              />
            </ResponsiveContainer>
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={42}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title={copy.charts.metricCoverage}>
                <ResponsiveContainer width="100%" height="100%">
                  <HorizontalCategoryBar
                    data={metricCounts}
                    color="#334155"
                    categoryAxisLabel={copy.labels.metricCategoryAxis}
                    countAxisLabel={copy.labels.eventCountAxis}
                  />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={22}>
              <ChartCard title={copy.charts.eventTypes}>
                <ResponsiveContainer width="100%" height="100%">
                  <HorizontalCategoryBar
                    data={eventCounts}
                    color="#64748b"
                    categoryAxisLabel={copy.labels.eventTypeAxis}
                    countAxisLabel={copy.labels.eventCountAxis}
                  />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={33}>
              <TimelineTriggerPanel
                rows={rows}
                rangeKey="timestamp_local"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
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
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
  const metrics = useMemo(
    () => [
      summarizeMetric(
        rows,
        "latest_max_abs_mj_displacement_mm",
        copy.metrics.maxLatestMj,
        "mm"
      ),
      summarizeMetric(
        rows,
        "latest_max_abs_me_md_displacement_mm",
        copy.metrics.maxLatestMeMd,
        "mm"
      ),
      summarizeMetric(rows, "depth_max_m", copy.metrics.maxDepth, "m"),
      summarizeMetric(rows, "observation_count", copy.metrics.observations),
    ],
    [
      rows,
      copy.metrics.maxLatestMj,
      copy.metrics.maxLatestMeMd,
      copy.metrics.maxDepth,
      copy.metrics.observations,
    ]
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
      metrics={metrics}
      rangeKey="latest_observation_date"
      language={language}
      onOpenTimeline={onOpenTimeline}
      mainTitle={copy.charts.latestMaxDisplacementByInclinometer}
      mainChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="id"
            label={bottomAxisLabel(copy.labels.inclinometerAxis)}
          />
          <YAxis
            label={leftAxisLabel(
              copy.labels.latestMaxAbsDisplacementAxis
            )}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="mj" fill={config.color} name={copy.labels.mjMaxAbsMm} />
          <Bar dataKey="meMd" fill="#0f766e" name={copy.labels.meMdMaxAbsMm} />
        </BarChart>
      }
      sideTitle={copy.charts.depthCoverage}
      sideChart={
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="id"
            label={bottomAxisLabel(copy.labels.inclinometerAxis)}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="depth" fill="#2563eb" name={copy.labels.depthMaxM} />
          <Bar dataKey="observations" fill="#64748b" name={copy.metrics.observations} />
        </BarChart>
      }
    />
  );
}

function InclinometerSummaryAnalysis({
  rows,
  config,
  language,
  onOpenTimeline,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
}) {
  const copy = montesinhoCopy[language];
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
      summarizeMetric(filteredRows, "max_abs_mj_displacement_mm", copy.metrics.maxAbsMj, "mm"),
      summarizeMetric(filteredRows, "depth_at_max_abs_mj_m", copy.metrics.depthAtMaxMj, "m"),
      summarizeMetric(filteredRows, "depth_count_including_bottom_zero", copy.metrics.depthRows),
      ];

      if (hasMeMd) {
        nextMetrics.splice(
          1,
          0,
          summarizeMetric(
            filteredRows,
            "max_abs_me_md_displacement_mm",
            copy.metrics.maxAbsMeMd,
            "mm"
          )
        );
      }

      return nextMetrics;
    },
    [
      filteredRows,
      hasMeMd,
      copy.metrics.maxAbsMj,
      copy.metrics.depthAtMaxMj,
      copy.metrics.depthRows,
      copy.metrics.maxAbsMeMd,
    ]
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
      <div className="flex shrink-0 flex-wrap items-center justify-start gap-3">
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
          <ChartCard title={`${copy.charts.observationEnvelope} - ${selected || instruments[0] || ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  minTickGap={26}
                  label={bottomAxisLabel(copy.labels.observationDateAxis)}
                />
                <YAxis
                  yAxisId="left"
                  domain={["auto", "auto"]}
                  label={leftAxisLabel(copy.labels.maxAbsDisplacementAxis)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={["auto", "auto"]}
                  label={rightAxisLabel(copy.labels.depthAtMaxAbsMjAxis)}
                />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="mj" stroke={config.color} dot={false} strokeWidth={2} name={copy.labels.maxMjMm} />
                {hasMeMd ? (
                  <Line yAxisId="left" type="monotone" dataKey="meMd" stroke="#0f766e" dot={false} strokeWidth={2} name={copy.labels.maxMeMdMm} />
                ) : null}
                <Line yAxisId="right" type="monotone" dataKey="depthMj" stroke="#2563eb" dot={false} strokeWidth={1.5} name={copy.metrics.depthAtMaxMj} />
              </LineChart>
            </ResponsiveContainer>
            {!hasMeMd ? (
              <div className="mt-2 text-xs font-medium text-slate-500">
                {copy.charts.meMdUnavailable}
              </div>
            ) : null}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={42}>
              <ChartCard title={copy.charts.observationRoleCoverage}>
                <ResponsiveContainer width="100%" height="100%">
                  <CategoryBar
                    rows={filteredRows}
                    field="observation_role"
                    color={config.color}
                    language={language}
                    xAxisLabel={copy.labels.observationRoleAxis}
                    yAxisLabel={copy.labels.observationCountAxis}
                  />
                </ResponsiveContainer>
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={22}>
              <MetricTable metrics={metrics} language={language} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={36}>
              <TimelineTriggerPanel
                rows={filteredRows}
                rangeKey="observation_date"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
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
  language,
  onOpenTimeline,
  onProfileViewChange,
}: {
  rows: CsvRow[];
  config: DatasetConfig;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
  onProfileViewChange?: (
    previousView: InclinometerProfileView,
    nextView: InclinometerProfileView
  ) => void;
}) {
  const copy = montesinhoCopy[language];
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
  const [profileView, setProfileView] =
    useState<InclinometerProfileView>("current");

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
  const userSelectedObservationRef = useRef(false);
  const activeInstrumentId = selectedInstrument || instruments[0] || "";
  const previousActiveInstrumentIdRef = useRef(activeInstrumentId);

  useEffect(() => {
    if (previousActiveInstrumentIdRef.current === activeInstrumentId) return;

    previousActiveInstrumentIdRef.current = activeInstrumentId;
    userSelectedObservationRef.current = false;
    setSelectedObservation("");
  }, [activeInstrumentId]);

  useEffect(() => {
    if (!observations.length) {
      userSelectedObservationRef.current = false;
      if (selectedObservation) setSelectedObservation("");
      return;
    }

    const selectionExists = observations.some(
      (item) => item.number === selectedObservation
    );
    const shouldFollowLatest =
      !userSelectedObservationRef.current || !selectionExists;
    const latestObservation = observations[observations.length - 1].number;

    if (!selectionExists) userSelectedObservationRef.current = false;
    if (shouldFollowLatest && selectedObservation !== latestObservation) {
      setSelectedObservation(latestObservation);
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
      ? copy.charts.mjProfilesByObservation
      : profileView === "allMeMd"
        ? copy.charts.meMdProfilesByObservation
        : profileView === "geometryMj"
          ? `${copy.charts.geometryMjProfile} - ${selectedObservationDate}`
          : profileView === "geometryMeMd"
            ? `${copy.charts.geometryMeMdProfile} - ${selectedObservationDate}`
            : copy.charts.depthProfileDisplacement;
  const mainChart =
    profileView === "allMj" || profileView === "allMeMd" ? (
      <LineChart data={multiProfileData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={["auto", "auto"]}
          label={bottomAxisLabel(copy.labels.displacementMillimetresAxis)}
        />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          reversed
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
          label={{
            value: copy.labels.inclinometerHeightAxis,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
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
        <XAxis
          type="number"
          domain={["auto", "auto"]}
          label={bottomAxisLabel(
            profileView === "geometryMeMd"
              ? copy.labels.rawEdStatisticAxis
              : copy.labels.rawMjStatisticAxis
          )}
        />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          reversed
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
          label={{
            value: copy.labels.inclinometerHeightAxis,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
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
        <XAxis
          type="number"
          domain={["auto", "auto"]}
          label={bottomAxisLabel(copy.labels.displacementMillimetresAxis)}
        />
        <YAxis
          dataKey="depth"
          type="number"
          domain={[0, "dataMax"]}
          reversed
          ticks={depthTicks}
          tickFormatter={(value) => `${value} m`}
          label={{
            value: copy.labels.inclinometerHeightAxis,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="mj" stroke={config.color} dot={false} strokeWidth={2} name={copy.labels.mjDisplacementMm} />
        {hasMeMd ? (
          <Line type="monotone" dataKey="meMd" stroke="#0f766e" dot={false} strokeWidth={2} name={copy.labels.meMdDisplacementMm} />
        ) : null}
      </LineChart>
    );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-start gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium"
            value={selectedInstrument}
            onChange={(event) => {
              userSelectedObservationRef.current = false;
              setSelectedObservation("");
              setSelectedInstrument(event.target.value);
            }}
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
            onChange={(event) => {
              userSelectedObservationRef.current = true;
              setSelectedObservation(event.target.value);
            }}
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
            aria-label={copy.labels.selectedProfile}
            data-guide-target="inclinometer-profile-view"
            onChange={(event) => {
              const nextView = event.target.value as InclinometerProfileView;

              if (nextView !== profileView) {
                onProfileViewChange?.(profileView, nextView);
              }

              setProfileView(nextView);
            }}
          >
            <option value="current">{copy.labels.selectedProfile}</option>
            <option value="allMj">{copy.labels.allMjProfiles}</option>
            <option value="allMeMd" disabled={!hasMultiMeMd}>
              {copy.labels.allMeMdProfiles}
            </option>
            <option value="geometryMj">{copy.labels.geometryMj}</option>
            <option value="geometryMeMd" disabled={!hasMeMd}>
              {copy.labels.geometryMeMd}
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
                {copy.charts.meMdUnavailable}
              </div>
            ) : null}
          </ChartCard>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={45}>
              <ChartCard title={copy.charts.maxDisplacementPerObservation}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={observationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      minTickGap={26}
                      label={bottomAxisLabel(copy.labels.observationDateAxis)}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      label={leftAxisLabel(copy.labels.maxAbsDisplacementAxis)}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="maxMj" stroke={config.color} dot={false} strokeWidth={2} name={copy.labels.maxMjMm} />
                    {hasMeMd ? (
                      <Line type="monotone" dataKey="maxMeMd" stroke="#0f766e" dot={false} strokeWidth={2} name={copy.labels.maxMeMdMm} />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
                {!hasMeMd ? (
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    {copy.charts.meMdUnavailable}
                  </div>
                ) : null}
              </ChartCard>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55}>
              <TimelineTriggerPanel
                rows={profileRows}
                rangeKey="observation_date"
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
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
  language,
  field = "quality_flags",
  nonOkOnly = false,
}: {
  rows: CsvRow[];
  color: string;
  language: MontesinhoLanguage;
  field?: string;
  nonOkOnly?: boolean;
}) {
  const copy = montesinhoCopy[language];
  const data = useMemo(() => {
    const counts = nonOkOnly
      ? countQualityFlags(rows, field, language)
      : countBy(rows, field, language);
    return counts.length > 0
      ? counts.slice(0, 8)
      : [{ name: copy.noFlaggedRows, count: 0 }];
  }, [rows, field, language, nonOkOnly]);

  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        interval={0}
        angle={-18}
        textAnchor="end"
        height={72}
        label={bottomAxisLabel(copy.labels.qualityFlagAxis)}
      />
      <YAxis label={leftAxisLabel(copy.labels.occurrencesAxis)} />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function CategoryBar({
  rows,
  field,
  color,
  language,
  xAxisLabel,
  yAxisLabel,
}: {
  rows: CsvRow[];
  field: string;
  color: string;
  language: MontesinhoLanguage;
  xAxisLabel: string;
  yAxisLabel: string;
}) {
  return (
    <BarChart data={countBy(rows, field, language).slice(0, 8)}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        interval={0}
        angle={-18}
        textAnchor="end"
        height={72}
        label={bottomAxisLabel(xAxisLabel)}
      />
      <YAxis label={leftAxisLabel(yAxisLabel)} />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function HorizontalCategoryBar({
  data,
  color,
  categoryAxisLabel,
  countAxisLabel,
}: {
  data: { name: string; count: number }[];
  color: string;
  categoryAxisLabel: string;
  countAxisLabel: string;
}) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" label={bottomAxisLabel(countAxisLabel)} />
      <YAxis
        dataKey="name"
        type="category"
        width={150}
        tick={{ fontSize: 11 }}
        label={leftAxisLabel(categoryAxisLabel)}
      />
      <Tooltip />
      <Bar dataKey="count" fill={color} />
    </BarChart>
  );
}

function AnalysisLayout({
  rows,
  metrics,
  rangeKey,
  language,
  onOpenTimeline,
  mainTitle,
  mainChart,
  sideTitle,
  sideChart,
}: {
  rows: CsvRow[];
  metrics: NumericSummary[];
  rangeKey: string;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
  mainTitle: string;
  mainChart: React.ReactElement;
  sideTitle: string;
  sideChart: React.ReactElement;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
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
              <MetricTable metrics={metrics} language={language} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={33}>
              <TimelineTriggerPanel
                rows={rows}
                rangeKey={rangeKey}
                language={language}
                onOpenTimeline={onOpenTimeline}
              />
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
  language,
  onOpenTimeline,
  onInclinometerProfileViewChange,
}: {
  config: DatasetConfig;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  instrumentFilter?: InstrumentFilter;
  language: MontesinhoLanguage;
  onOpenTimeline: OpenTimelineHandler;
  onInclinometerProfileViewChange?: (
    previousView: InclinometerProfileView,
    nextView: InclinometerProfileView
  ) => void;
}) {
  const copy = montesinhoCopy[language];
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterKey = instrumentFilter?.key;
  const filterValue = instrumentFilter?.value;

  useEffect(() => {
    const controller = new AbortController();

    async function loadRows() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        const nextRows = await readAllRowsFromApi(getDatasetApiPath(config), {
          selectedStartDate,
          selectedEndDate,
          instrumentFilter:
            filterKey && filterValue
              ? { key: filterKey, value: filterValue }
              : undefined,
          signal: controller.signal,
          onProgressRows: (progressRows) => {
            if (!controller.signal.aborted) setRows(progressRows);
          },
          progressFlushPageCount: DASHBOARD_PROGRESS_FLUSH_PAGE_COUNT,
        });
        if (!controller.signal.aborted && nextRows.length === 0) setRows([]);
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : copy.failedToLoadDataset);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRows();

    return () => controller.abort();
  }, [
    config,
    selectedStartDate,
    selectedEndDate,
    filterKey,
    filterValue,
  ]);

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
      </div>

      {loading && filteredRows.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600">
          {copy.loadingDataset} {getDatasetApiPath(config)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {copy.noRowsSelectedRange}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          {config.key === "reservoir" && (
            <ReservoirAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "manualCota" && (
            <ManualCotaAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "piezometerMetadata" && (
            <PiezometerMetadataAnalysis
              rows={filteredRows}
              config={config}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "piezometerHistory" && (
            <PiezometerHistoryAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "seepage" && (
            <SeepageAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "temporaryBica" && (
            <TemporaryBicaAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "weather" && (
            <WeatherAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "timeline" && (
            <TimelineAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "inclinometerMetadata" && (
            <InclinometerMetadataAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "inclinometerSummary" && (
            <InclinometerSummaryAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
            />
          )}
          {config.key === "inclinometerHistory" && (
            <InclinometerHistoryAnalysis
              rows={filteredRows}
              config={config}
              language={language}
              onOpenTimeline={onOpenTimeline}
              onProfileViewChange={onInclinometerProfileViewChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SensorDataWindow({
  sensor,
  mapping,
  datasets,
  language,
  selectedStartDate,
  selectedEndDate,
  onOpenTimeline,
}: {
  sensor: MonitoringSensorItem;
  mapping: SensorDataMapping | null;
  datasets: DatasetConfig[];
  language: MontesinhoLanguage;
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  onOpenTimeline: OpenTimelineHandler;
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
        language={language}
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
  const config = datasets.find((dataset) => dataset.key === configKey);
  const instrumentKey =
    mapping.kind === "piezometer" ? "piezometer_id" : "inclinometer_id";

  if (!config) return null;

  return (
    <SensorDataPanel
      sensor={sensor}
      mapping={mapping}
      view={view}
      language={language}
      onViewChange={setView}
    >
      <DatasetAnalysisWindow
        config={config}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        instrumentFilter={{ key: instrumentKey, value: mapping.instrumentId }}
        language={language}
        onOpenTimeline={onOpenTimeline}
      />
    </SensorDataPanel>
  );
}

export default function Page() {
  const controlsRef = useRef<any>(null);
  const initialOrbitRef = useRef<OrbitSnapshot | null>(null);
  const initialRainIntensityRef = useRef(0);

  const [language, setLanguage] = useState<MontesinhoLanguage>("pt");
  const [showCountup] = useState(false);
  const [createdGuideSensors, setCreatedGuideSensors] = useState<
    MonitoringSensorItem[]
  >([]);
  const [showTwoTiles, setShowTwoTiles] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(0);
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
  const [gizmoMode, setGizmoMode] =
    useState<SensorGizmoMode>("translate");

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [isGuideMinimized, setIsGuideMinimized] = useState(false);
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
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);

  const activeStep = GUIDE_STEPS[activeStepIndex];
  const isRainStep = activeStep.id === "change-rain";
  const isTwoTilesStep = activeStep.id === "show-two-tiles";
  const isTimelineStep = activeStep.id === "timeline-playback";
  const isOpenReservoirDashboardStep =
    activeStep.id === "open-reservoir-dashboard";
  const isPiezometerPressureChallengeStep =
    activeStep.id === "piezometer-pressure-challenge";
  const isInclinometerFilterChallengeStep =
    activeStep.id === "inclinometer-filter-challenge";
  const isDroneCapturesStep = activeStep.id === "open-drone-captures";
  const isDashboardGuidePhase =
    isOpenReservoirDashboardStep ||
    isPiezometerPressureChallengeStep ||
    isInclinometerFilterChallengeStep;
  const isRightControlsPhase =
    isRainStep || isTwoTilesStep || isDroneCapturesStep;
  const shouldMoveGuideForDatasetClose =
    (isOpenReservoirDashboardStep && activeDatasetKey !== null) ||
    (isInclinometerFilterChallengeStep &&
      activeDatasetKey !== null &&
      activeDatasetKey !== "inclinometerHistory");
  const isGuidePanelLeft =
    isRightControlsPhase ||
    isTimelineStep ||
    isPiezometerPressureChallengeStep ||
    shouldMoveGuideForDatasetClose;
  const isPostGraphGuidePhase =
    isRightControlsPhase ||
    activeStep.id === "add-sensor" ||
    isTimelineStep ||
    isDashboardGuidePhase;
  const isAddSensorStep = activeStep.id === "add-sensor";
  const isGizmoStep = activeStep.id === "sensor-gizmos";
  const hasChosenTimelineInterval =
    timelineValues[0] > 0.01 || timelineValues[1] < 99.99;
  const activeStepComplete = activeStep.objectives.every(
    (objective) => objectives[objective.id]
  );
  const isFinished =
    activeStepIndex === GUIDE_STEPS.length - 1 && activeStepComplete;

  const copy = montesinhoCopy[language];
  const datasets = useMemo(
    () => DATASETS.map((dataset) => localizeDataset(dataset, language)),
    [language]
  );
  const sensors = useMemo(
    () =>
      localizeSensors(
        [...initialSensors, ...createdGuideSensors],
        language
      ),
    [createdGuideSensors, language]
  );

  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.key === activeDatasetKey) ?? null,
    [activeDatasetKey, datasets]
  );
  const dataSensorMapping = useMemo(
    () => (dataSensor ? getSensorDataMapping(dataSensor) : null),
    [dataSensor]
  );

  const completeObjective = React.useCallback(
    (objectiveId: GuideObjective["id"]) => {
      setObjectives((current) => {
        if (current[objectiveId]) return current;

        return {
          ...current,
          [objectiveId]: true,
        };
      });
    },
    []
  );

  const openSensorData = React.useCallback(
    (sensor: MonitoringSensorItem) => {
      setFocusedSensor(sensor);
      setActiveDatasetKey(null);
      setDataSensor(sensor);

      if (activeStep.id === "open-sensor-graphs") {
        completeObjective("openGraph");
      }
    },
    [activeStep.id, completeObjective]
  );

  const handleSelectedRangeChange = React.useCallback(
    (
      fromDate: Date,
      toDate: Date,
      nextTimelineValues: [number, number]
    ) => {
      setIsPlaying(false);
      setPlaybackIndex(0);
      setHasPlaybackStarted(false);
      setSelectedStartDate(fromDate);
      setSelectedEndDate(toDate);
      setTimelineValues(nextTimelineValues);
    },
    []
  );

  const handleTimelineOpenChange = React.useCallback(
    (nextIsOpen: boolean) => {
      setIsTimelineOpen(nextIsOpen);

      if (activeStep.id === "timeline-playback" && nextIsOpen) {
        completeObjective("openTimeline");
      }
    },
    [activeStep.id, completeObjective]
  );

  const handleOpenTimeline = React.useCallback(() => {
    handleTimelineOpenChange(true);
  }, [handleTimelineOpenChange]);

  const handleInclinometerProfileViewChange = React.useCallback(
    (
      previousView: InclinometerProfileView,
      nextView: InclinometerProfileView
    ) => {
      if (
        activeStep.id === "inclinometer-filter-challenge" &&
        activeDatasetKey === "inclinometerHistory" &&
        previousView !== nextView &&
        nextView === "allMj"
      ) {
        completeObjective("changeInclinometerProfile");
      }
    },
    [activeDatasetKey, activeStep.id, completeObjective]
  );

  function handleDatasetMenuOpenChange(nextIsOpen: boolean) {
    setIsDatasetMenuOpen(nextIsOpen);

    if (!nextIsOpen) return;

    if (activeStep.id === "open-reservoir-dashboard") {
      completeObjective("openDatasetMenu");
    }

    if (activeStep.id === "piezometer-pressure-challenge") {
      completeObjective("openPiezometerMenu");
    }

    if (activeStep.id === "inclinometer-filter-challenge") {
      completeObjective("openInclinometerMenu");
    }
  }

  function handleDatasetSelect(key: DatasetKey) {
    setDataSensor(null);
    setActiveDatasetKey(key);
    setIsDatasetMenuOpen(false);

    if (
      activeStep.id === "open-reservoir-dashboard" &&
      key === "reservoir"
    ) {
      completeObjective("openReservoirDashboard");
    }

    if (
      activeStep.id === "piezometer-pressure-challenge" &&
      key === "piezometerMetadata"
    ) {
      completeObjective("openPiezometerDashboard");
    }

    if (
      activeStep.id === "inclinometer-filter-challenge" &&
      key === "inclinometerHistory"
    ) {
      completeObjective("openInclinometerDashboard");
    }
  }

  function handleSensorSelect(sensor: MonitoringSensorItem) {
    setFocusedSensor(sensor);

    if (activeStep.id === "select-sensor") {
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

  function handleDroneCapturesNavigate() {
    if (isDroneCapturesStep) {
      completeObjective("openDroneCaptures");
    }
  }

  function handleCreateGuideSensor(sensor: MonitoringSensorItem) {
    setCreatedGuideSensors((currentSensors) => [...currentSensors, sensor]);
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

    if (activeStep.id === "explore-scene" && hasRotated) {
      completeObjective("rotate");
    }

    if (activeStep.id === "explore-scene" && hasZoomed) {
      completeObjective("zoom");
    }
  }

  function advanceToNextGuideStep() {
    if (activeStep.id === "open-sensor-graphs") {
      setDataSensor(null);
    }

    if (activeStep.id === "timeline-playback") {
      setIsTimelineOpen(false);
      setIsPlaying(false);
      setDataSensor(null);
      setActiveDatasetKey(null);
      setIsDatasetMenuOpen(false);
    }

    if (activeStep.id === "open-reservoir-dashboard") {
      setActiveDatasetKey(null);
      setIsDatasetMenuOpen(false);
    }

    if (activeStep.id === "piezometer-pressure-challenge") {
      setActiveDatasetKey(null);
      setIsDatasetMenuOpen(false);
    }

    if (activeStep.id === "inclinometer-filter-challenge") {
      setDataSensor(null);
      setActiveDatasetKey(null);
      setIsDatasetMenuOpen(false);
    }

    setCompletedStepCount((current) =>
      Math.max(current, activeStepIndex + 1)
    );

    if (activeStepIndex < GUIDE_STEPS.length - 1) {
      setActiveStepIndex((current) => current + 1);
    }
  }

  function handleAdvance() {
    if (!activeStepComplete) return;

    advanceToNextGuideStep();
  }

  function handleSkip() {
    if (activeStepIndex >= GUIDE_STEPS.length - 1) return;

    if (
      activeStep.id === "open-reservoir-dashboard" &&
      activeDatasetKey !== "reservoir"
    ) {
      setActiveDatasetKey(null);
      setIsDatasetMenuOpen(false);
    }

    advanceToNextGuideStep();
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      initialOrbitRef.current = getOrbitSnapshot(controlsRef.current);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsWaterLoading(true);
        setWaterError(null);
        setIsPlaying(false);
        setPlaybackIndex(0);
        setHasPlaybackStarted(false);

        const reservoirRows = await readAllRowsFromApi(
          RESERVOIR_LEVEL_API,
          {
            selectedStartDate,
            selectedEndDate,
            signal: controller.signal,
          }
        );
        const nextWaterLevels = reservoirRowsToWaterLevels(
          reservoirRows,
          selectedStartDate,
          selectedEndDate
        );

        setWaterLevels(nextWaterLevels);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setWaterError(err instanceof Error ? err.message : copy.unknownError);
        setWaterLevels([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
        setHasPlaybackStarted(false);
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
    }, GUIDE_PLAYBACK_INTERVAL_MS);

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
  }, [activeStep.id, isRightControlsPhase, isPostGraphGuidePhase, isGizmoStep]);

  useEffect(() => {
    if (isTwoTilesStep && showTwoTiles) {
      completeObjective("showTwoTiles");
    }
  }, [completeObjective, isTwoTilesStep, showTwoTiles]);

  useEffect(() => {
    if (isTimelineStep && isTimelineOpen) {
      completeObjective("openTimeline");
    }

    if (isTimelineStep && hasChosenTimelineInterval) {
      completeObjective("chooseDateInterval");
    }
  }, [
    completeObjective,
    hasChosenTimelineInterval,
    isTimelineOpen,
    isTimelineStep,
  ]);

  const currentPlaybackRow = waterLevels[playbackIndex] ?? null;

  const playbackProgress =
    waterLevels.length <= 1
      ? 0
      : (playbackIndex / (waterLevels.length - 1)) * 100;

  const dynamicWaterLevelY = useMemo(() => {
    if (!hasPlaybackStarted) return WATER_LEVEL_Y;

    return mapReservoirLevelToSceneY(currentPlaybackRow?.level);
  }, [currentPlaybackRow, hasPlaybackStarted]);

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

    setHasPlaybackStarted(true);
    setIsPlaying(true);
  }

  function handleResetPlayback() {
    setIsPlaying(false);
    setPlaybackIndex(0);
    setHasPlaybackStarted(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <RainControlPanel
        rainIntensity={rainIntensity}
        isOpen={isRainPanelOpen}
        language={language}
        onRainIntensityChange={handleRainIntensityChange}
        onOpenChange={setIsRainPanelOpen}
        showTwoTiles={showTwoTiles}
        onToggleTwoTiles={handleToggleTwoTiles}
        onDroneCapturesNavigate={handleDroneCapturesNavigate}
      />

      <DatasetMenu
        activeKey={activeDatasetKey}
        isOpen={isDatasetMenuOpen}
        isSensorSidebarOpen={isSensorSidebarOpen}
        datasets={datasets}
        language={language}
        onOpenChange={handleDatasetMenuOpenChange}
        onSelect={handleDatasetSelect}
      />

      <WaterPlaybackPanel
        isVisible={isTimelineOpen}
        language={language}
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
          language={language}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
          onActivateGizmos={handleActivateSensorGizmos}
        />
      ) : (
        <SensorSidebar
          sensors={sensors}
          isOpen={isSensorSidebarOpen}
          isTimelineOpen={isTimelineOpen}
          language={language}
          onOpenChange={setIsSensorSidebarOpen}
          onSelectSensor={handleSensorSelect}
          onViewSensorData={openSensorData}
        />
      )}

      {!isGuideMinimized ? (
        <GuideCallouts
          activeStepIndex={activeStepIndex}
          language={language}
          objectiveStatus={objectives}
          isReservoirDashboardOpen={activeDatasetKey === "reservoir"}
          isPiezometerDashboardOpen={
            activeDatasetKey === "piezometerMetadata"
          }
          isInclinometerDashboardOpen={
            activeDatasetKey === "inclinometerHistory"
          }
        />
      ) : null}

      <GuidePanel
        activeStepIndex={activeStepIndex}
        completedStepCount={completedStepCount}
        objectiveStatus={objectives}
        selectedSensorTitle={focusedSensor?.title}
        side={isGuidePanelLeft ? "left" : "right"}
        language={language}
        canAdvance={activeStepComplete}
        isFinished={isFinished}
        isMinimized={isGuideMinimized}
        onLanguageChange={setLanguage}
        onMinimizedChange={setIsGuideMinimized}
        onAdvance={handleAdvance}
        onSkip={handleSkip}
      >
        {isAddSensorStep ? (
          <AddSensorPanel
            createdCount={createdGuideSensors.length}
            language={language}
            onCreateSensor={handleCreateGuideSensor}
          />
        ) : null}
        {isGizmoStep ? (
          <GuideGizmoModePanel
            activeSensorTitle={
              sensors.find((sensor) => sensor.id === gizmoSensorId)?.title
            }
            mode={gizmoMode}
            language={language}
            onModeChange={setGizmoMode}
          />
        ) : null}
        {isPiezometerPressureChallengeStep ? (
          <GuideDataChallengePanel
            language={language}
            onSolved={() => completeObjective("answerPiezometerPressure")}
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
        raiseAboveOverlays={isTimelineOpen && Boolean(activeDataset || dataSensor)}
        language={language}
        defaultStartDate={RESERVOIR_TIMELINE_START_DATE}
        defaultEndDate={RESERVOIR_TIMELINE_END_DATE}
        onSelectedRangeChange={handleSelectedRangeChange}
      />

      {dataSensor && (
        <OverlayModal
          width="min(1500px, 96vw)"
          height="min(92vh, 940px)"
          zIndex={60}
          closeLabel={copy.close}
          onClose={() => setDataSensor(null)}
        >
          <SensorDataWindow
            sensor={dataSensor}
            mapping={dataSensorMapping}
            datasets={datasets}
            language={language}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onOpenTimeline={handleOpenTimeline}
          />
        </OverlayModal>
      )}

      {activeDataset && (
        <OverlayModal
          width="min(1500px, 96vw)"
          height="min(92vh, 940px)"
          zIndex={55}
          closeLabel={copy.close}
          onClose={() => setActiveDatasetKey(null)}
        >
          <DatasetAnalysisWindow
            config={activeDataset}
            selectedStartDate={
              (isPiezometerPressureChallengeStep &&
                activeDataset.key === "piezometerMetadata") ||
              (isInclinometerFilterChallengeStep &&
                activeDataset.key === "inclinometerHistory")
                ? null
                : selectedStartDate
            }
            selectedEndDate={
              (isPiezometerPressureChallengeStep &&
                activeDataset.key === "piezometerMetadata") ||
              (isInclinometerFilterChallengeStep &&
                activeDataset.key === "inclinometerHistory")
                ? null
                : selectedEndDate
            }
            language={language}
            onOpenTimeline={handleOpenTimeline}
            onInclinometerProfileViewChange={
              handleInclinometerProfileViewChange
            }
          />
        </OverlayModal>
      )}
    </div>
  );
}
