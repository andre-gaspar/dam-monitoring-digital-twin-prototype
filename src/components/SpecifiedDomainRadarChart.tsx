"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const data = [
  { subject: "Missing Data", A: 120, B: 110, fullMark: 150 },
  { subject: "Sensor Failure", A: 98, B: 130, fullMark: 150 },
  { subject: "Alerts Triggered", A: 86, B: 130, fullMark: 150 },
  { subject: "Sta1", A: 99, B: 100, fullMark: 150 },
  { subject: "Stat2", A: 85, B: 90, fullMark: 150 },
  { subject: "Stat3", A: 65, B: 85, fullMark: 150 },
];

export default function SpecifiedDomainRadarChart() {
  return (
    <div className="h-full w-full min-h-0 p-4">
      <RadarChart
        data={data}
        responsive
        outerRadius="80%"
        style={{ width: "100%", height: "100%" }}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 150]} />
        <Radar
          name="Sensor A"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Radar
          name="SensorB"
          dataKey="B"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </div>
  );
}