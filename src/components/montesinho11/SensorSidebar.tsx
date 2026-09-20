"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { ScrollableCardSidebar } from "@/components/ScrollableCardList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonitoringSensorItem } from "./types";
import {
  montesinhoCopy,
  type MontesinhoLanguage,
} from "./i18n";

type SensorSidebarProps = {
  sensors: MonitoringSensorItem[];
  isOpen: boolean;
  isTimelineOpen: boolean;
  mobileMode?: boolean;
  language: MontesinhoLanguage;
  onOpenChange: (isOpen: boolean) => void;
  onSelectSensor: (sensor: MonitoringSensorItem) => void;
  onViewSensorData?: (sensor: MonitoringSensorItem) => void;
};

export function SensorSidebar({
  sensors,
  isOpen,
  isTimelineOpen,
  mobileMode = false,
  language,
  onOpenChange,
  onSelectSensor,
  onViewSensorData,
}: SensorSidebarProps) {
  const copy = montesinhoCopy[language];

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        variant={isOpen ? "secondary" : "default"}
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "absolute z-20 rounded-full shadow-2xl backdrop-blur-md transition-colors duration-300",
          mobileMode && "h-11 w-11",
          isOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        style={{
          top: mobileMode
            ? "calc(env(safe-area-inset-top, 0px) + 12px)"
            : 20,
          left: mobileMode
            ? "calc(env(safe-area-inset-left, 0px) + 12px)"
            : isOpen
              ? 392
              : 20,
          transition: mobileMode ? undefined : "left 280ms ease",
        }}
        aria-label={
          isOpen ? copy.sidebar.hideCards : copy.sidebar.showCards
        }
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
          top: mobileMode
            ? "calc(env(safe-area-inset-top, 0px) + 64px)"
            : 20,
          left: mobileMode
            ? "calc(env(safe-area-inset-left, 0px) + 12px)"
            : 20,
          bottom: mobileMode
            ? "calc(env(safe-area-inset-bottom, 0px) + 12px)"
            : isTimelineOpen
              ? 190
              : 20,
          width: mobileMode
            ? "min(360px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px))"
            : 360,
          maxHeight: mobileMode
            ? "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 88px)"
            : undefined,
          zIndex: 9,
          pointerEvents: "none",
          background: "transparent",
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? mobileMode
              ? "translateY(0)"
              : "translateX(0)"
            : mobileMode
              ? "translateY(-12px)"
              : "translateX(calc(-100% - 32px))",
          transition:
            "bottom 280ms ease, opacity 220ms ease, transform 280ms ease",
        }}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div
          data-mobile-sensor-list={mobileMode ? "" : undefined}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: mobileMode
              ? "min(620px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 88px))"
              : undefined,
            pointerEvents: isOpen ? "auto" : "none",
            background: "transparent",
            overflowY: mobileMode ? "auto" : undefined,
            borderRadius: mobileMode ? 12 : undefined,
          }}
        >
          <ScrollableCardSidebar
            items={sensors}
            showImages={false}
            selectLabel={copy.select}
            dataLabel={copy.data}
            onCardClick={(sensor) =>
              onSelectSensor(sensor as MonitoringSensorItem)
            }
            onDataClick={
              onViewSensorData
                ? (sensor) =>
                    onViewSensorData(sensor as MonitoringSensorItem)
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
