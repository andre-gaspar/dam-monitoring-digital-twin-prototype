"use client";

import type { ReactNode } from "react";
import { DatabaseIcon } from "lucide-react";

import type { MonitoringSensorItem } from "@/components/montesinho11/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SensorDataMapping } from "./sensorDataMapping";
import {
  montesinhoCopy,
  type MontesinhoLanguage,
} from "./i18n";

export type SensorDataView = "metadata" | "readings";

type SensorDataPanelProps = {
  sensor: MonitoringSensorItem;
  mapping: SensorDataMapping | null;
  view: SensorDataView;
  language: MontesinhoLanguage;
  mobileMode?: boolean;
  onViewChange: (view: SensorDataView) => void;
  children?: ReactNode;
};

export function SensorDataPanel({
  sensor,
  mapping,
  view,
  language,
  mobileMode = false,
  onViewChange,
  children,
}: SensorDataPanelProps) {
  const copy = montesinhoCopy[language];

  if (!mapping) {
    return (
      <div className="grid h-full place-items-center bg-slate-50 p-8 text-slate-950">
        <div className="max-w-md text-center">
          <DatabaseIcon className="mx-auto mb-4 size-10 text-slate-400" />
          <h2 className="text-xl font-bold">{sensor.title}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {copy.noDataForSensor}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white",
          mobileMode
            ? "px-3 pb-3 pt-[calc(env(safe-area-inset-top,0px)+56px)]"
            : "px-5 py-3 pr-20"
        )}
        style={
          mobileMode
            ? {
                paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
                paddingRight: "calc(env(safe-area-inset-right, 0px) + 12px)",
              }
            : undefined
        }
      >
        <div>
          <div className="text-sm font-bold text-slate-950">{sensor.title}</div>
          <div className="text-xs text-slate-500">
            {copy.csvInstrument} {mapping.instrumentId}
          </div>
        </div>
        <div
          className={cn(
            "flex rounded-md border border-slate-300 bg-slate-100 p-1",
            mobileMode && "w-full"
          )}
        >
          <Button
            type="button"
            size="sm"
            variant={view === "metadata" ? "default" : "ghost"}
            onClick={() => onViewChange("metadata")}
            className={cn(mobileMode && "h-11 flex-1")}
          >
            {copy.metadata}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "readings" ? "default" : "ghost"}
            onClick={() => onViewChange("readings")}
            className={cn(mobileMode && "h-11 flex-1")}
          >
            {copy.readings}
          </Button>
        </div>
      </div>
      <div className={cn("min-h-0 flex-1", mobileMode && "overflow-y-auto")}>
        {children}
      </div>
    </div>
  );
}
