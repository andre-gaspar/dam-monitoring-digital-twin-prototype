"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { ScrollableCardSidebar } from "@/components/ScrollableCardList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonitoringSensorItem } from "./types";

type SensorSidebarProps = {
  sensors: MonitoringSensorItem[];
  isOpen: boolean;
  isTimelineOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectSensor: (sensor: MonitoringSensorItem) => void;
};

export function SensorSidebar({
  sensors,
  isOpen,
  isTimelineOpen,
  onOpenChange,
  onSelectSensor,
}: SensorSidebarProps) {
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
        aria-label={isOpen ? "Hide sensor cards" : "Show sensor cards"}
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
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: isOpen ? "auto" : "none",
            background: "transparent",
          }}
        >
          <ScrollableCardSidebar
            items={sensors}
            onCardClick={(sensor) =>
              onSelectSensor(sensor as MonitoringSensorItem)
            }
          />
        </div>
      </div>
    </>
  );
}
