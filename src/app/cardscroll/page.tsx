import { SimulationRunsManager } from "@/components/SimulationRunsManager";

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-background p-6">
      <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col gap-4 rounded-3xl border bg-background p-4 shadow-sm lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dam Simulation Runs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Early UI for organizing Code_Aster runs, required files, outputs,
            and future execution controls.
          </p>
        </div>

        <SimulationRunsManager />
      </div>
    </main>
  );
}