"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import MeteorologiaLapaChart from "@/components/MeteorologiaLapaChart";
import SpecifiedDomainRadarChart from "@/components/SpecifiedDomainRadarChart";
import { WaterLevelDashboard } from "@/components/WaterLevelDashboard";

type ResizableDemoProps = {
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  timelineValues?: [number, number] | null;
};

export function ResizableDemo({
  selectedStartDate = null,
  selectedEndDate = null,
  timelineValues = null,
}: ResizableDemoProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel defaultSize="35%">
        <div className="h-full min-h-0">
          <WaterLevelDashboard
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="65%">
        <ResizablePanelGroup orientation="vertical" className="h-full">
          <ResizablePanel defaultSize="50%">
            <div className="h-full min-h-0">
              <MeteorologiaLapaChart
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                timelineValues={timelineValues}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="50%">
            <div className="h-full min-h-0">
              <SpecifiedDomainRadarChart />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
