"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          "absolute z-20 h-11 w-11 rounded-full shadow-2xl backdrop-blur-md transition-colors duration-300",
          isOpen
            ? "border border-white/50 bg-white/90 text-black hover:bg-white"
            : "bg-black/90 text-white hover:bg-black"
        )}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          right: 12,
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
          top: "calc(env(safe-area-inset-top, 0px) + 64px)",
          right: 12,
          zIndex: 9,
          width: "min(250px, calc(100vw - 24px))",
          pointerEvents: "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(-12px)",
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
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
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
              padding: "9px 10px",
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
              padding: "9px 10px",
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
        </div>
      </div>
    </>
  );
}
