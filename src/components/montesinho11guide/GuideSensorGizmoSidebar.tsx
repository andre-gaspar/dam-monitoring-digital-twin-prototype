"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MonitoringSensorItem } from "@/components/montesinho11/types";
import type { GuideLanguage } from "./guideContent";

type GuideSensorGizmoSidebarProps = {
  sensors: MonitoringSensorItem[];
  isOpen: boolean;
  isTimelineOpen: boolean;
  gizmoSensorId: string | null;
  language: GuideLanguage;
  onOpenChange: (isOpen: boolean) => void;
  onSelectSensor: (sensor: MonitoringSensorItem) => void;
  onActivateGizmos: (sensor: MonitoringSensorItem) => void;
};

const SIDEBAR_COPY = {
  en: {
    hide: "Hide sensor gizmo cards",
    show: "Show sensor gizmo cards",
    select: "Select",
    gizmos: "Gizmos",
  },
  pt: {
    hide: "Ocultar cartões de gizmos dos sensores",
    show: "Mostrar cartões de gizmos dos sensores",
    select: "Selecionar",
    gizmos: "Gizmos",
  },
} satisfies Record<GuideLanguage, Record<string, string>>;

export function GuideSensorGizmoSidebar({
  sensors,
  isOpen,
  isTimelineOpen,
  gizmoSensorId,
  language,
  onOpenChange,
  onSelectSensor,
  onActivateGizmos,
}: GuideSensorGizmoSidebarProps) {
  const copy = SIDEBAR_COPY[language];

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        variant={isOpen ? "secondary" : "default"}
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "absolute z-20 rounded-full shadow-2xl backdrop-blur-md transition-colors duration-300",
          isOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        style={{
          top: 20,
          left: isOpen ? 392 : 20,
          transition: "left 280ms ease",
        }}
        aria-label={isOpen ? copy.hide : copy.show}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronLeftIcon className="size-6" />
        ) : (
          <ChevronRightIcon className="size-6" />
        )}
      </Button>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          bottom: isTimelineOpen ? 190 : 20,
          width: 360,
          zIndex: 9,
          pointerEvents: "none",
          background: "transparent",
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? "translateX(0)"
            : "translateX(calc(-100% - 32px))",
          transition:
            "bottom 280ms ease, opacity 220ms ease, transform 280ms ease",
        }}
        aria-hidden={!isOpen}
      >
        <div
          className="h-full w-full overflow-y-auto"
          style={{
            pointerEvents: isOpen ? "auto" : "none",
            background: "transparent",
          }}
        >
          <div className="flex flex-col items-start gap-3 p-2">
            {sensors.map((sensor) => {
              const gizmosActive = gizmoSensorId === sensor.id;

              return (
                <Card
                  key={sensor.id}
                  className={cn(
                    "relative w-full max-w-sm gap-3 overflow-hidden py-4",
                    gizmosActive && "ring-2 ring-cyan-300"
                  )}
                >
                  <CardHeader className="gap-1 px-4">
                    <CardAction>
                      {sensor.badge ? (
                        <Badge variant="secondary">{sensor.badge}</Badge>
                      ) : null}
                    </CardAction>

                    <CardTitle>{sensor.title}</CardTitle>
                    <CardDescription>{sensor.description}</CardDescription>
                  </CardHeader>

                  <CardFooter className="grid grid-cols-2 gap-2 px-4">
                    <Button onClick={() => onSelectSensor(sensor)}>
                      {copy.select}
                    </Button>
                    <Button
                      variant={gizmosActive ? "default" : "secondary"}
                      onClick={() => onActivateGizmos(sensor)}
                    >
                      {copy.gizmos}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
