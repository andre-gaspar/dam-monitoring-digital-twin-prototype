"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DateTimePicker } from "@/components/DateTimePicker";

type Row = {
  time: string;
  inclinometer: string;
  node: number;
  ax: number | null;
  ay: number | null;
  az: number | null;
};

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "time",
    header: "time",
    cell: ({ getValue }) => {
      const v = getValue<string>();
      try {
        return new Date(v).toLocaleString();
      } catch {
        return v;
      }
    },
  },
  {
    accessorKey: "ax",
    header: ({ column }) => (
      <button
        className="select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ax
      </button>
    ),
    cell: ({ getValue }) => getValue<number | null>() ?? "",
  },
  {
    accessorKey: "ay",
    header: ({ column }) => (
      <button
        className="select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ay
      </button>
    ),
    cell: ({ getValue }) => getValue<number | null>() ?? "",
  },
  {
    accessorKey: "az",
    header: ({ column }) => (
      <button
        className="select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        az
      </button>
    ),
    cell: ({ getValue }) => getValue<number | null>() ?? "",
  },
];

export default function Page() {
  const [inclinometer, setInclinometer] = React.useState("I1");
  const [node, setNode] = React.useState<number>(0);
  const [start, setStart] = React.useState("2025-04-01T09:00:00Z");
  const [stop, setStop] = React.useState("2025-04-01T09:10:00Z");
  const [limit, setLimit] = React.useState<number>(200);

  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  async function runQuery() {
    setLoading(true);
    setErr(null);

    try {
      const url =
        `/api/ipi?inclinometer=${encodeURIComponent(inclinometer)}` +
        `&node=${encodeURIComponent(String(node))}` +
        `&start=${encodeURIComponent(start)}` +
        `&stop=${encodeURIComponent(stop)}` +
        `&limit=${encodeURIComponent(String(limit))}`;

      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);

      const json = JSON.parse(text);
      if (!json.ok) throw new Error(json.error?.message ?? "Query failed");

      setRows(json.data ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <main className="p-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>IPI Time Range Query</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="w-fit">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {/* small */}
            <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="inclinometer">Inclinometer</Label>
                <Input
                id="inclinometer"
                value={inclinometer}
                onChange={(e) => setInclinometer(e.target.value)}
                />
            </div>

            {/* very small */}
            <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="node">Node</Label>
                <Input
                id="node"
                type="number"
                value={node}
                onChange={(e) => setNode(Number(e.target.value))}
                />
            </div>

            {/* big (span full row on sm so it doesn’t get cramped) */}
            <div className="space-y-2 lg:col-span-3">
                <DateTimePicker label="Start" value={start} onChange={setStart} />
                <div className="text-xs text-muted-foreground">ISO: {start}</div>
            </div>

            {/* big */}
            <div className="space-y-2 lg:col-span-3">
                <DateTimePicker label="Stop" value={stop} onChange={setStop} />
                <div className="text-xs text-muted-foreground">ISO: {stop}</div>
            </div>

            {/* very small */}
            <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="limit">Limit</Label>
                <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                />
            </div>
            </div>
            </div>

          <div className="flex items-center gap-3">
            <Button onClick={runQuery} disabled={loading}>
              {loading ? "Querying..." : "Run time-range query"}
            </Button>

            <div className="text-sm text-muted-foreground">
              Returned: {rows.length} rows
            </div>
          </div>

          {err && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {err}
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Raw JSON */}
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm">Raw JSON</summary>
            <pre className="mt-3 max-h-96 overflow-auto text-xs">
              {JSON.stringify(rows, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </main>
  );
}
