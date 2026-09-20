"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  montesinhoCopy,
  type MontesinhoLanguage,
} from "./i18n";

const CLASSIFICATION_ITEMS = [
  { labelKey: "ground", color: "#D5CB79" },
  { labelKey: "vegetationDark", color: "#005B00" },
  { labelKey: "vegetationMedium", color: "#006400" },
  { labelKey: "vegetationBright", color: "#00E700" },
  { labelKey: "buildings", color: "#F70000" },
  { labelKey: "water", color: "#05519A" },
  { labelKey: "bridge", color: "#F7C000" },
] as const;

type RainControlPanelProps = {
  rainIntensity: number;
  isOpen: boolean;
  mobileMode?: boolean;
  language: MontesinhoLanguage;
  showTwoTiles: boolean;
  onRainIntensityChange: (value: number) => void;
  onOpenChange: (isOpen: boolean) => void;
  onToggleTwoTiles: () => void;
  onDroneCapturesNavigate?: () => void;
};

export function RainControlPanel({
  rainIntensity,
  isOpen,
  mobileMode = false,
  language,
  showTwoTiles,
  onRainIntensityChange,
  onOpenChange,
  onToggleTwoTiles,
  onDroneCapturesNavigate,
}: RainControlPanelProps) {
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
          right: mobileMode
            ? "calc(env(safe-area-inset-right, 0px) + 12px)"
            : isOpen
              ? 282
              : 20,
          transition: mobileMode ? undefined : "right 280ms ease",
        }}
        aria-label={isOpen ? copy.rain.hideControls : copy.rain.showControls}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronRightIcon className="size-6" />
        ) : (
          <ChevronLeftIcon className="size-6" />
        )}
      </Button>

      <div
        style={{
          position: "absolute",
          top: mobileMode
            ? "calc(env(safe-area-inset-top, 0px) + 64px)"
            : 20,
          right: mobileMode
            ? "calc(env(safe-area-inset-right, 0px) + 12px)"
            : 20,
          zIndex: 9,
          width: mobileMode
            ? "min(300px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px))"
            : 250,
          maxHeight: mobileMode
            ? "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 88px)"
            : undefined,
          overflowY: mobileMode ? "auto" : undefined,
          borderRadius: mobileMode ? 12 : undefined,
          pointerEvents: "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? mobileMode
              ? "translateY(0)"
              : "translateX(0)"
            : mobileMode
              ? "translateY(-12px)"
              : "translateX(calc(100% + 32px))",
          transition: "opacity 220ms ease, transform 280ms ease",
        }}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div
          className={mobileMode ? "[&_button]:min-h-11" : undefined}
          style={{
            width: "100%",
            padding: "14px",
            pointerEvents: isOpen ? "auto" : "none",
            background: "rgba(255, 255, 255, 0.92)",
            color: "black",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <Button asChild className="mb-3 w-full">
            <Link
              href="/droneui"
              onNavigate={() => onDroneCapturesNavigate?.()}
              data-guide-target="drone-captures"
            >
              {copy.rain.droneCaptures}
            </Link>
          </Button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>{copy.rain.title}</span>
            <span>{Math.round(rainIntensity * 100)}%</span>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={rainIntensity}
            onChange={(e) => onRainIntensityChange(Number(e.target.value))}
            className={mobileMode ? "h-11" : undefined}
            style={{ width: "100%", accentColor: "#111" }}
          />

          <button
            onClick={() => onRainIntensityChange(rainIntensity > 0 ? 0 : 0.65)}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "8px 10px",
              border: "none",
              borderRadius: "8px",
              background: "#111",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {rainIntensity > 0 ? copy.rain.stop : copy.rain.start}
          </button>

          <button
            onClick={onToggleTwoTiles}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #111",
              borderRadius: "8px",
              background: showTwoTiles ? "#111" : "white",
              color: showTwoTiles ? "white" : "#111",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {showTwoTiles ? copy.rain.hideTiles : copy.rain.showTiles}
          </button>

          {showTwoTiles ? (
            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid rgba(0,0,0,0.12)",
                paddingTop: 10,
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#111",
                }}
              >
                {copy.rain.classification}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 265,
                  overflowY: "auto",
                  paddingRight: 2,
                }}
              >
                {CLASSIFICATION_ITEMS.map((item) => (
                  <div
                    key={item.color}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11,
                      lineHeight: 1.25,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: item.color,
                        border: "1px solid rgba(0,0,0,0.18)",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                      }}
                    />
                    <span>{copy.rain.classes[item.labelKey]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
