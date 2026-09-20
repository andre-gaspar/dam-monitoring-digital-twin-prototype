"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCode2,
  FileText,
  FolderOpen,
  Play,
  Search,
  ServerCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RunStatus = "ready" | "incomplete" | "running" | "finished" | "failed";

type RunFile = {
  label: string;
  filename?: string;
  required: boolean;
  present: boolean;
  note?: string;
};

export type SimulationRun = {
  id: string;
  name: string;
  dam: string;
  status: RunStatus;
  description: string;
  updatedAt: string;
  commandFile: string;
  meshFile: string;
  meshLinkMode: string;
  files: {
    required: RunFile[];
    optional: RunFile[];
    outputs: RunFile[];
  };
  notes?: string;
};

const demoRuns: SimulationRun[] = [
  {
    id: "run-001",
    name: "Dam Case A - Static Baseline",
    dam: "North Dam",
    status: "ready",
    description:
      "Baseline structural run using the current reference mesh and standard material properties.",
    updatedAt: "2026-04-10 18:20",
    commandFile: "case_static_A.comm",
    meshFile: "mesh_baseline.med",
    meshLinkMode: "DEFI_FICHIER UNITE=20",
    files: {
      required: [
        {
          label: "Command file",
          filename: "case_static_A.comm",
          required: true,
          present: true,
        },
        {
          label: "Mesh file",
          filename: "mesh_baseline.med",
          required: true,
          present: true,
        },
      ],
      optional: [
        {
          label: "Material curve table",
          filename: "material_curves.csv",
          required: false,
          present: true,
        },
        {
          label: "Python macro",
          filename: "postprocess_static.py",
          required: false,
          present: true,
        },
      ],
      outputs: [
        {
          label: "Run log",
          filename: "case_static_A.mess",
          required: false,
          present: true,
        },
        {
          label: "Results MED",
          filename: "case_static_A.rmed",
          required: false,
          present: true,
        },
      ],
    },
    notes:
      "Good candidate to duplicate for future what-if scenarios. Mesh binding already configured in the command file.",
  },
  {
    id: "run-002",
    name: "Dam Case B - Sensor-Driven Load",
    dam: "North Dam",
    status: "incomplete",
    description:
      "Run prepared for external sensor values, but one referenced table is still missing.",
    updatedAt: "2026-04-10 16:05",
    commandFile: "case_sensor_load.comm",
    meshFile: "mesh_sensor.med",
    meshLinkMode: "fort.20 in run directory",
    files: {
      required: [
        {
          label: "Command file",
          filename: "case_sensor_load.comm",
          required: true,
          present: true,
        },
        {
          label: "Mesh file",
          filename: "mesh_sensor.med",
          required: true,
          present: true,
        },
      ],
      optional: [
        {
          label: "Sensor values table",
          filename: "sensor_input_2026_04_10.csv",
          required: false,
          present: false,
          note: "Referenced by the .comm and must be uploaded before launch.",
        },
        {
          label: "Include command",
          filename: "boundary_conditions.comm",
          required: false,
          present: true,
        },
      ],
      outputs: [
        {
          label: "Run log",
          filename: "case_sensor_load.mess",
          required: false,
          present: false,
        },
        {
          label: "Results MED",
          filename: "case_sensor_load.rmed",
          required: false,
          present: false,
        },
      ],
    },
    notes:
      "Prepared for future automation where live sensor values rewrite or feed the command pipeline.",
  },
  {
    id: "run-003",
    name: "Dam Case C - Dynamic Check",
    dam: "South Dam",
    status: "running",
    description:
      "Dynamic simulation currently executing on the solver node with a larger mesh and extra includes.",
    updatedAt: "2026-04-10 17:42",
    commandFile: "case_dynamic.comm",
    meshFile: "mesh_dynamic.med",
    meshLinkMode: "DEFI_FICHIER UNITE=20",
    files: {
      required: [
        {
          label: "Command file",
          filename: "case_dynamic.comm",
          required: true,
          present: true,
        },
        {
          label: "Mesh file",
          filename: "mesh_dynamic.med",
          required: true,
          present: true,
        },
      ],
      optional: [
        {
          label: "Include command",
          filename: "material_sets.comm",
          required: false,
          present: true,
        },
        {
          label: "Time history table",
          filename: "dynamic_input.txt",
          required: false,
          present: true,
        },
      ],
      outputs: [
        {
          label: "Run log",
          filename: "case_dynamic.mess",
          required: false,
          present: true,
        },
        {
          label: "Results MED",
          filename: "case_dynamic.rmed",
          required: false,
          present: false,
        },
      ],
    },
    notes:
      "Later this section can expose progress, queue position, execution host, and estimated finish time.",
  },
  {
    id: "run-004",
    name: "Dam Case D - Previous Failure Review",
    dam: "South Dam",
    status: "failed",
    description:
      "Stored failed run for debugging missing references and checking the solver log.",
    updatedAt: "2026-04-09 21:10",
    commandFile: "case_failure_test.comm",
    meshFile: "mesh_failure.med",
    meshLinkMode: "fort.20 in run directory",
    files: {
      required: [
        {
          label: "Command file",
          filename: "case_failure_test.comm",
          required: true,
          present: true,
        },
        {
          label: "Mesh file",
          filename: "mesh_failure.med",
          required: true,
          present: true,
        },
      ],
      optional: [
        {
          label: "Reference table",
          filename: "damage_curve.csv",
          required: false,
          present: false,
          note: "Log indicates file was not found.",
        },
      ],
      outputs: [
        {
          label: "Run log",
          filename: "case_failure_test.mess",
          required: false,
          present: true,
        },
        {
          label: "Results MED",
          filename: "case_failure_test.rmed",
          required: false,
          present: false,
        },
      ],
    },
    notes:
      "Keep failed runs visible so they can be cloned, fixed, and relaunched without rebuilding everything.",
  },
];

function statusBadge(status: RunStatus) {
  switch (status) {
    case "ready":
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
          Ready
        </Badge>
      );
    case "incomplete":
      return <Badge variant="secondary">Incomplete</Badge>;
    case "running":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
          Running
        </Badge>
      );
    case "finished":
      return (
        <Badge className="bg-zinc-800 text-white hover:bg-zinc-800">
          Finished
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
  }
}

function statusIcon(status: RunStatus) {
  switch (status) {
    case "ready":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "incomplete":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "running":
      return <Clock3 className="h-4 w-4 text-blue-600" />;
    case "finished":
      return <CheckCircle2 className="h-4 w-4 text-zinc-700" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

function fileRow(file: RunFile) {
  return (
    <div
      key={`${file.label}-${file.filename ?? "none"}`}
      className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{file.label}</div>
        <div className="truncate text-xs text-muted-foreground">
          {file.filename ?? "Not assigned"}
        </div>
        {file.note ? (
          <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {file.note}
          </div>
        ) : null}
      </div>
      <Badge variant={file.present ? "default" : "secondary"}>
        {file.present ? "Present" : "Missing"}
      </Badge>
    </div>
  );
}

export function SimulationRunsManager({
  runs = demoRuns,
}: {
  runs?: SimulationRun[];
}) {
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(runs[0]?.id ?? "");

  const filteredRuns = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return runs;

    return runs.filter((run) => {
      return (
        run.name.toLowerCase().includes(q) ||
        run.dam.toLowerCase().includes(q) ||
        run.commandFile.toLowerCase().includes(q) ||
        run.meshFile.toLowerCase().includes(q)
      );
    });
  }, [runs, query]);

  const selectedRun =
    filteredRuns.find((run) => run.id === selectedId) ??
    filteredRuns[0] ??
    runs[0];

  React.useEffect(() => {
    if (!selectedRun) return;
    setSelectedId(selectedRun.id);
  }, [selectedRun?.id]);

  const stats = React.useMemo(() => {
    return {
      total: runs.length,
      ready: runs.filter((r) => r.status === "ready").length,
      running: runs.filter((r) => r.status === "running").length,
      incomplete: runs.filter((r) => r.status === "incomplete").length,
    };
  }, [runs]);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total runs</div>
            <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ready</div>
            <div className="mt-1 text-2xl font-semibold">{stats.ready}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Running</div>
            <div className="mt-1 text-2xl font-semibold">{stats.running}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Need attention</div>
            <div className="mt-1 text-2xl font-semibold">{stats.incomplete}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 items-stretch grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="flex min-h-0 h-full flex-col overflow-hidden rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Simulation Runs</CardTitle>
            <CardDescription>
              Organize command files, mesh dependencies, and outputs for each run.
            </CardDescription>

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search runs..."
                className="w-full rounded-xl border bg-background pl-9 pr-3 py-2 text-sm outline-none"
              />
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto pr-2">
              <div className="space-y-3">
                {filteredRuns.map((run) => {
                  const selected = run.id === selectedRun?.id;

                  return (
                    <button
                      key={run.id}
                      onClick={() => setSelectedId(run.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{run.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {run.dam}
                          </div>
                        </div>
                        {statusBadge(run.status)}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        {statusIcon(run.status)}
                        <span>Updated {run.updatedAt}</span>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">COMM:</span>{" "}
                        {run.commandFile}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">MESH:</span>{" "}
                        {run.meshFile}
                      </div>
                    </button>
                  );
                })}

                {filteredRuns.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                    No runs match your search.
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 h-full flex-col overflow-hidden rounded-2xl">
          {selectedRun ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{selectedRun.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedRun.description}
                    </CardDescription>
                  </div>
                  {statusBadge(selectedRun.status)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedRun.dam}</Badge>
                  <Badge variant="outline">{selectedRun.meshLinkMode}</Badge>
                  <Badge variant="outline">Updated {selectedRun.updatedAt}</Badge>
                </div>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileCode2 className="h-4 w-4" />
                        Core Run Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-sm font-medium">Command file</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedRun.commandFile}
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-sm font-medium">Mesh file</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedRun.meshFile}
                        </div>
                      </div>
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-sm font-medium">Mesh binding</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedRun.meshLinkMode}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ServerCog className="h-4 w-4" />
                        Future Actions
                      </CardTitle>
                      <CardDescription>
                        Placeholder actions for the next stage of the platform.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <Button className="justify-start gap-2 rounded-xl">
                        <Play className="h-4 w-4" />
                        Launch Run
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start gap-2 rounded-xl"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Open Files
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start gap-2 rounded-xl"
                      >
                        <FileText className="h-4 w-4" />
                        View Log
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start gap-2 rounded-xl"
                      >
                        Clone Run
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Required</CardTitle>
                      <CardDescription>
                        Minimum files needed to start the run.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedRun.files.required.map(fileRow)}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Often Required</CardTitle>
                      <CardDescription>
                        Included commands, tables, macros, and support files.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedRun.files.optional.length ? (
                        selectedRun.files.optional.map(fileRow)
                      ) : (
                        <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                          No additional dependencies listed.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Outputs</CardTitle>
                      <CardDescription>
                        Logs and result files generated after execution.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedRun.files.outputs.map(fileRow)}
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4 rounded-2xl border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Run Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                      {selectedRun.notes ?? "No notes yet."}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-full items-center justify-center text-muted-foreground">
              No run selected.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}