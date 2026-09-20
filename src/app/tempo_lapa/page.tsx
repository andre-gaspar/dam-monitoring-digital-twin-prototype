import MeteorologiaLapaChart from "@/components/MeteorologiaLapaChart";

export default function MeteorologiaLapaPage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Meteorologia Lapa</h1>
      <div className="rounded-2xl border p-4">
        <MeteorologiaLapaChart />
      </div>
    </main>
  );
}