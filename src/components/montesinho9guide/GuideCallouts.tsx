"use client";

import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import {
  GUIDE_STEPS,
  getGuideStepText,
  type GuideLanguage,
} from "./guideContent";

type GuideCalloutsProps = {
  activeStepIndex: number;
  language: GuideLanguage;
};

export function GuideCallouts({
  activeStepIndex,
  language,
}: GuideCalloutsProps) {
  const activeStep = GUIDE_STEPS[activeStepIndex];
  const activeStepText = getGuideStepText(activeStep, language);
  const pointsToSidebar =
    activeStep.id === "select-sensor" || activeStep.id === "sensor-gizmos";
  const pointsToRightPanel =
    activeStep.id === "change-rain" || activeStep.id === "show-two-tiles";

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className={
          pointsToSidebar
            ? "absolute left-[400px] top-28 w-[min(320px,calc(100vw-430px))]"
            : pointsToRightPanel
            ? "absolute right-[300px] top-28 w-[min(320px,calc(100vw-700px))]"
            : "absolute left-1/2 top-28 w-[min(360px,calc(100vw-420px))] -translate-x-1/2"
        }
      >
        <div className="rounded-lg border border-cyan-200/35 bg-slate-950/76 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
              {pointsToSidebar ? (
                <ArrowLeftIcon className="size-4" />
              ) : pointsToRightPanel ? (
                <ArrowRightIcon className="size-4" />
              ) : (
                <ArrowDownIcon className="size-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{activeStepText.calloutTitle}</p>
              <p className="mt-1 text-xs leading-5 text-slate-200">
                {activeStepText.calloutText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
