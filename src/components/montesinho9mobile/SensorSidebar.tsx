"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
          "absolute z-20 h-11 w-11 rounded-full shadow-2xl backdrop-blur-md transition-colors duration-300",
          isOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          left: 12,
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
          top: "calc(env(safe-area-inset-top, 0px) + 64px)",
          left: 12,
          bottom: isTimelineOpen ? 112 : 12,
          width: "min(330px, calc(100vw - 24px))",
          zIndex: 9,
          pointerEvents: "none",
          background: "transparent",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(-12px)",
          transition:
            "bottom 280ms ease, opacity 220ms ease, transform 280ms ease",
        }}
        aria-hidden={!isOpen}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "min(430px, calc(100dvh - 150px))",
            pointerEvents: isOpen ? "auto" : "none",
            overflowY: "auto",
            borderRadius: 12,
            background: "rgba(255,255,255,0.94)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            backdropFilter: "blur(12px)",
            padding: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "black",
                padding: "2px 2px 4px",
              }}
            >
              Sensors
            </div>

            {sensors.map((sensor) => (
              <button
                key={sensor.id}
                type="button"
                onClick={() => onSelectSensor(sensor)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  background: "white",
                  color: "black",
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "48px 1fr",
                  gap: 10,
                  textAlign: "left",
                  alignItems: "center",
                }}
              >
                <img
                  src={sensor.image}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    objectFit: "cover",
                    background: "rgba(0,0,0,0.08)",
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sensor.title}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11,
                      opacity: 0.68,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sensor.badge ?? sensor.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
