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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type WaterLevelRow = {
  timestamp: string;
  level: number | null;
};

type WaterLevelDashboardProps = {
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
};

const columns: ColumnDef<WaterLevelRow>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button
        className="select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        timestamp
      </button>
    ),
    cell: ({ getValue }) => {
      const value = getValue<string>();

      try {
        return new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(new Date(value));
      } catch {
        return value;
      }
    },
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <button
        className="select-none"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        water level
      </button>
    ),
    cell: ({ getValue }) => {
      const value = getValue<number | null>();
      return typeof value === "number" ? value.toFixed(3) : "";
    },
  },
];

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function formatRangeDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function WaterLevelDashboard({
  selectedStartDate = null,
  selectedEndDate = null,
}: WaterLevelDashboardProps) {
  const [rows, setRows] = React.useState<WaterLevelRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  React.useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) {
      setRows([]);
      return;
    }

    const controller = new AbortController();

    async function loadWaterLevels() {
      setLoading(true);
      setErr(null);

      try {
        const params = new URLSearchParams({
          start: selectedStartDate!.toISOString(),
          stop: addOneDay(selectedEndDate!).toISOString(),
          limit: "5000",
        });

        const res = await fetch(`/api/baells-water-level?${params.toString()}`, {
          signal: controller.signal,
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        }

        const json = JSON.parse(text);

        if (!json.ok) {
          throw new Error(json.error ?? "Query failed");
        }

        setRows(json.data ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErr(error instanceof Error ? error.message : "Unknown error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadWaterLevels();

    return () => controller.abort();
  }, [selectedStartDate, selectedEndDate]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rangeLabel =
    selectedStartDate && selectedEndDate
      ? `${formatRangeDate(selectedStartDate)} → ${formatRangeDate(
          selectedEndDate
        )}`
      : "Select a timeline range";

  return (
    <Card className="flex h-full min-h-0 w-full flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Water level</CardTitle>
          <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
            {rangeLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
        <div className="flex shrink-0 items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{loading ? "Loading water levels..." : "Timeline range"}</span>
          <span>Returned: {rows.length} rows</span>
        </div>

        {err && (
          <div className="shrink-0 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
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
                    {selectedStartDate && selectedEndDate
                      ? "No results."
                      : "Select a timeline range."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
