"use client";

import type { ReactNode } from "react";
import { DatabaseIcon } from "lucide-react";

import type { MonitoringSensorItem } from "@/components/montesinho9/types";
import { Button } from "@/components/ui/button";
import type { SensorDataMapping } from "./sensorDataMapping";

export type SensorDataView = "metadata" | "readings";

type SensorDataPanelProps = {
  sensor: MonitoringSensorItem;
  mapping: SensorDataMapping | null;
  view: SensorDataView;
  onViewChange: (view: SensorDataView) => void;
  children?: ReactNode;
};

export function SensorDataPanel({
  sensor,
  mapping,
  view,
  onViewChange,
  children,
}: SensorDataPanelProps) {
  if (!mapping) {
    return (
      <div className="grid h-full place-items-center bg-slate-50 p-8 text-slate-950">
        <div className="max-w-md text-center">
          <DatabaseIcon className="mx-auto mb-4 size-10 text-slate-400" />
          <h2 className="text-xl font-bold">{sensor.title}</h2>
          <p className="mt-2 text-sm text-slate-600">
            No data exists for this sensor in the current CSV datasets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 pr-20">
        <div>
          <div className="text-sm font-bold text-slate-950">{sensor.title}</div>
          <div className="text-xs text-slate-500">
            CSV instrument {mapping.instrumentId}
          </div>
        </div>
        <div className="flex rounded-md border border-slate-300 bg-slate-100 p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "metadata" ? "default" : "ghost"}
            onClick={() => onViewChange("metadata")}
          >
            Metadata
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "readings" ? "default" : "ghost"}
            onClick={() => onViewChange("readings")}
          >
            Readings
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
