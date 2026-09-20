"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CLASSIFICATION_ITEMS = [
  { label: "Ground", color: "#D5CB79" },
  { label: "Vegetation dark", color: "#005B00" },
  { label: "Vegetation medium", color: "#006400" },
  { label: "Vegetation bright", color: "#00E700" },
  { label: "Buildings", color: "#F70000" },
  { label: "Water", color: "#05519A" },
  { label: "Bridge", color: "#F7C000" },
];

type RainControlPanelProps = {
  rainIntensity: number;
  isOpen: boolean;
  showTwoTiles: boolean;
  onRainIntensityChange: (value: number) => void;
  onOpenChange: (isOpen: boolean) => void;
  onToggleTwoTiles: () => void;
};

export function RainControlPanel({
  rainIntensity,
  isOpen,
  showTwoTiles,
  onRainIntensityChange,
  onOpenChange,
  onToggleTwoTiles,
}: RainControlPanelProps) {
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
          right: isOpen ? 282 : 20,
          transition: "right 280ms ease",
        }}
        aria-label={isOpen ? "Hide rain controls" : "Show rain controls"}
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
          top: 20,
          right: 20,
          zIndex: 9,
          width: 250,
          pointerEvents: "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? "translateX(0)"
            : "translateX(calc(100% + 32px))",
          transition: "opacity 220ms ease, transform 280ms ease",
        }}
        aria-hidden={!isOpen}
      >
        <div
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
            <span>Rain test</span>
            <span>{Math.round(rainIntensity * 100)}%</span>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={rainIntensity}
            onChange={(e) => onRainIntensityChange(Number(e.target.value))}
            style={{ width: "100%" }}
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
            {rainIntensity > 0 ? "Stop rain" : "Start rain"}
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
            {showTwoTiles ? "Hide 2 tiles" : "Show 2 tiles"}
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
                Classification
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
                    <span>{item.label}</span>
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
