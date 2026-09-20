"use client";

import { useState } from "react";
import ReservoirSensorChart from "@/components/ReservoirSensorChart";

export default function ReservoirChartPage() {
  const [chartCount, setChartCount] = useState(1);

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reservoir sensor chart</h1>
        <button
          onClick={() => setChartCount((count) => count + 1)}
          className="rounded border px-4 py-2"
        >
          Add chart
        </button>
      </div>

      <div className="space-y-4">
        {Array.from({ length: chartCount }).map((_, index) => (
          <div key={index} className="rounded-2xl border p-4">
            <ReservoirSensorChart />
          </div>
        ))}
      </div>
    </main>
  );
}