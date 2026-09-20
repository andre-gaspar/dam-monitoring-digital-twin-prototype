"use client";

import { Move3DIcon, Rotate3DIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuideLanguage } from "./guideContent";

export type SensorGizmoMode = "translate" | "rotate";

type GuideGizmoModePanelProps = {
  activeSensorTitle?: string | null;
  language: GuideLanguage;
  mode: SensorGizmoMode;
  onModeChange: (mode: SensorGizmoMode) => void;
};

const GIZMO_COPY = {
  en: {
    target: "Gizmo target",
    chooseSensor: "choose a sensor",
    move: "Move",
    rotate: "Rotate",
  },
  pt: {
    target: "Alvo do gizmo",
    chooseSensor: "escolha um sensor",
    move: "Mover",
    rotate: "Rodar",
  },
} satisfies Record<GuideLanguage, Record<string, string>>;

export function GuideGizmoModePanel({
  activeSensorTitle,
  language,
  mode,
  onModeChange,
}: GuideGizmoModePanelProps) {
  const copy = GIZMO_COPY[language];

  return (
    <div className="mt-5 rounded-md border border-cyan-200/25 bg-cyan-300/10 p-3">
      <div className="mb-3 rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-100">
        {copy.target}:{" "}
        <span className="font-semibold text-white">
          {activeSensorTitle ?? copy.chooseSensor}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "translate" ? "default" : "secondary"}
          className={cn(
            mode === "translate" && "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          )}
          onClick={() => onModeChange("translate")}
        >
          <Move3DIcon className="size-4" />
          {copy.move}
        </Button>
        <Button
          type="button"
          variant={mode === "rotate" ? "default" : "secondary"}
          className={cn(
            mode === "rotate" && "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          )}
          onClick={() => onModeChange("rotate")}
        >
          <Rotate3DIcon className="size-4" />
          {copy.rotate}
        </Button>
      </div>
    </div>
  );
}
