"use client";

import {
  CheckIcon,
  LockIcon,
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GUIDE_STEPS,
  GUIDE_UI_COPY,
  getGuideObjectiveText,
  getGuideStepText,
  type GuideLanguage,
  type GuideObjective,
} from "./guideContent";

type ObjectiveStatus = Record<GuideObjective["id"], boolean>;

type GuidePanelProps = {
  activeStepIndex: number;
  completedStepCount: number;
  objectiveStatus: ObjectiveStatus;
  selectedSensorTitle?: string | null;
  side: "left" | "right";
  children?: ReactNode;
  language: GuideLanguage;
  canAdvance: boolean;
  isFinished: boolean;
  isMinimized: boolean;
  onLanguageChange: (language: GuideLanguage) => void;
  onMinimizedChange: (isMinimized: boolean) => void;
  onAdvance: () => void;
  onSkip: () => void;
};

export function GuidePanel({
  activeStepIndex,
  completedStepCount,
  objectiveStatus,
  selectedSensorTitle,
  side,
  children,
  language,
  canAdvance,
  isFinished,
  isMinimized,
  onLanguageChange,
  onMinimizedChange,
  onAdvance,
  onSkip,
}: GuidePanelProps) {
  const activeStep = GUIDE_STEPS[activeStepIndex];
  const activeStepText = getGuideStepText(activeStep, language);
  const ui = GUIDE_UI_COPY[language];
  const StepIcon = activeStep.icon;
  const canSkip = activeStepIndex < GUIDE_STEPS.length - 1;

  return (
    <>
      {isMinimized ? (
        <Button
          type="button"
          onClick={() => onMinimizedChange(false)}
          className={cn(
            "absolute top-5 z-[80] h-auto max-w-[calc(100vw-40px)] gap-3 rounded-lg border border-white/25 bg-slate-950/82 px-3 py-2.5 text-white shadow-2xl backdrop-blur-xl hover:bg-slate-900/90",
            side === "left" ? "left-5" : "right-5"
          )}
          aria-label={ui.restoreGuide}
          title={ui.restoreGuide}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
            <StepIcon className="size-4" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              {ui.guideName}
            </span>
            <span className="block truncate text-xs font-semibold text-white">
              {activeStepText.eyebrow}
            </span>
          </span>
          <Maximize2Icon className="size-4 shrink-0 text-cyan-100" />
        </Button>
      ) : null}

      <section
        className={cn(
          "absolute top-5 z-[80] max-h-[calc(100vh-40px)] w-[min(380px,calc(100vw-40px))] overflow-y-auto rounded-lg border border-white/25 bg-slate-950/82 text-white shadow-2xl backdrop-blur-xl transition-[left,right,opacity] duration-300",
          side === "left" ? "left-5" : "right-5",
          isMinimized && "pointer-events-none invisible opacity-0"
        )}
        aria-hidden={isMinimized}
      >
      <div className="border-b border-white/10 px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {ui.guideName}
            </p>
            <h1 className="mt-1 text-xl font-semibold leading-tight">
              {ui.heading}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex overflow-hidden rounded-md border border-cyan-200/35 bg-white/8"
              aria-label={ui.languageLabel}
            >
              {(["en", "pt"] as GuideLanguage[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onLanguageChange(option)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs font-bold transition-colors",
                    language === option
                      ? "bg-cyan-300 text-slate-950"
                      : "text-cyan-100 hover:bg-white/10"
                  )}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex size-11 items-center justify-center rounded-md border border-cyan-200/40 bg-cyan-400/15">
              <StepIcon className="size-5 text-cyan-100" />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onMinimizedChange(true)}
              className="border border-cyan-200/35 bg-white/8 text-cyan-100 hover:bg-white/15 hover:text-white"
              aria-label={ui.minimizeGuide}
              title={ui.minimizeGuide}
            >
              <Minimize2Icon className="size-4" />
            </Button>
          </div>
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${GUIDE_STEPS.length}, minmax(0, 1fr))`,
          }}
        >
          {GUIDE_STEPS.map((step, index) => {
            const isCompleted = index < completedStepCount;
            const isActive = index === activeStepIndex;
            const isLocked = index > completedStepCount;

            return (
              <div
                key={step.id}
                className={cn(
                  "h-2 rounded-full transition-colors",
                  isCompleted && "bg-emerald-300",
                  isActive && "bg-cyan-300",
                  isLocked && "bg-white/18"
                )}
                aria-label={`${getGuideStepText(step, language).eyebrow} ${
                  isCompleted ? ui.completed : isActive ? ui.active : ui.locked
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
          {activeStepText.eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">
          {activeStepText.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          {activeStepText.description}
        </p>

        {selectedSensorTitle ? (
          <div className="mt-4 rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-100">
            {ui.selectedSensor}:{" "}
            <span className="font-semibold text-white">
              {selectedSensorTitle}
            </span>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {activeStep.objectives.map((objective) => {
            const isDone = objectiveStatus[objective.id];
            const objectiveText = getGuideObjectiveText(
              activeStep,
              objective,
              language
            );

            return (
              <div
                key={objective.id}
                className={cn(
                  "rounded-md border px-3 py-3 transition-colors",
                  isDone
                    ? "border-emerald-300/45 bg-emerald-400/14"
                    : "border-white/12 bg-white/7"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border",
                      isDone
                        ? "border-emerald-200 bg-emerald-300 text-emerald-950"
                        : "border-white/20 bg-slate-900/70 text-slate-300"
                    )}
                  >
                    {isDone ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <LockIcon className="size-3.5" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{objectiveText.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {objectiveText.helper}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {children}

        <div className="mt-5 flex gap-2">
          {canSkip ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white"
              onClick={onSkip}
            >
              {ui.skip}
            </Button>
          ) : null}
          <Button
            type="button"
            className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            disabled={!canAdvance}
            onClick={onAdvance}
          >
            {isFinished ? ui.complete : ui.continue}
          </Button>
        </div>
      </div>
      </section>
    </>
  );
}
