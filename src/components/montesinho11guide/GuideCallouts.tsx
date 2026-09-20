"use client";

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "lucide-react";

import {
  GUIDE_STEPS,
  getGuideStepText,
  type GuideLanguage,
  type GuideObjective,
} from "./guideContent";

type GuideCalloutsProps = {
  activeStepIndex: number;
  language: GuideLanguage;
  objectiveStatus: Record<GuideObjective["id"], boolean>;
  isReservoirDashboardOpen: boolean;
  isPiezometerDashboardOpen: boolean;
  isInclinometerDashboardOpen: boolean;
};

export function GuideCallouts({
  activeStepIndex,
  language,
  objectiveStatus,
  isReservoirDashboardOpen,
  isPiezometerDashboardOpen,
  isInclinometerDashboardOpen,
}: GuideCalloutsProps) {
  const activeStep = GUIDE_STEPS[activeStepIndex];
  const activeStepText = getGuideStepText(activeStep, language);
  const pointsToSidebar =
    activeStep.id === "select-sensor" ||
    activeStep.id === "open-sensor-graphs" ||
    activeStep.id === "sensor-gizmos";
  const pointsToRightPanel =
    activeStep.id === "change-rain" ||
    activeStep.id === "show-two-tiles" ||
    activeStep.id === "open-drone-captures";
  const pointsToPlayback =
    activeStep.id === "timeline-playback" &&
    objectiveStatus.openTimeline &&
    objectiveStatus.chooseDateInterval;
  const pointsToTimelineDock =
    activeStep.id === "timeline-playback" && !pointsToPlayback;
  const pointsToDatasetMenu =
    (activeStep.id === "open-reservoir-dashboard" &&
      !isReservoirDashboardOpen) ||
    (activeStep.id === "piezometer-pressure-challenge" &&
      !isPiezometerDashboardOpen) ||
    (activeStep.id === "inclinometer-filter-challenge" &&
      !isInclinometerDashboardOpen);
  const pointsToPiezometerMetrics =
    activeStep.id === "piezometer-pressure-challenge" &&
    isPiezometerDashboardOpen;
  const pointsToInclinometerFilters =
    activeStep.id === "inclinometer-filter-challenge" &&
    objectiveStatus.openInclinometerDashboard &&
    isInclinometerDashboardOpen;
  const floatsAboveDashboard =
    pointsToPiezometerMetrics || pointsToInclinometerFilters;
  let calloutPosition =
    "absolute left-1/2 top-28 w-[min(360px,calc(100vw-420px))] -translate-x-1/2";

  if (pointsToSidebar) {
    calloutPosition =
      "absolute left-[400px] top-28 w-[min(320px,calc(100vw-430px))]";
  } else if (pointsToRightPanel) {
    calloutPosition =
      "absolute right-[300px] top-28 w-[min(320px,calc(100vw-700px))]";
  } else if (pointsToPlayback) {
    calloutPosition =
      "absolute right-[340px] top-1/2 w-[min(320px,calc(100vw-720px))] -translate-y-1/2";
  } else if (pointsToTimelineDock) {
    calloutPosition =
      "absolute bottom-[190px] left-1/2 w-[min(360px,calc(100vw-420px))] -translate-x-1/2";
  } else if (pointsToDatasetMenu) {
    calloutPosition =
      "absolute left-1/2 top-[220px] w-[min(360px,calc(100vw-420px))] -translate-x-1/2";
  } else if (pointsToPiezometerMetrics) {
    calloutPosition =
      "absolute right-[400px] top-1/2 w-[min(320px,calc(100vw-800px))] -translate-y-1/2";
  } else if (pointsToInclinometerFilters) {
    calloutPosition =
      "absolute left-[400px] top-28 w-[min(320px,calc(100vw-800px))]";
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${
        floatsAboveDashboard ? "z-[70]" : "z-20"
      }`}
    >
      <div className={calloutPosition}>
        <div className="rounded-lg border border-cyan-200/35 bg-slate-950/76 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
              {pointsToSidebar ? (
                <ArrowLeftIcon className="size-4" />
              ) : pointsToInclinometerFilters ? (
                <ArrowLeftIcon className="size-4" />
              ) : pointsToRightPanel ||
                pointsToPlayback ||
                pointsToPiezometerMetrics ? (
                <ArrowRightIcon className="size-4" />
              ) : pointsToDatasetMenu ? (
                <ArrowUpIcon className="size-4" />
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
