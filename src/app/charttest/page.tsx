import BaellsLevelChart from "@/components/BaellsLevelChart";

export default function BaellsWaterLevelPage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Baells water level over time</h1>
      <div className="rounded-2xl border p-4">
        <BaellsLevelChart />
      </div>
    </main>
  );
}