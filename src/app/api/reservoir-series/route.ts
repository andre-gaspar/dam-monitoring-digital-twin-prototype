import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_SENSORS = [
  "080581-002-ANA006",
  "081419-003-ANA005",
  "082687-001-ANA015",
  "083036-001-ANA023",
  "170600-001-ANA021",
  "171899-003-ANA007",
  "250753-004-ANA010",
  "430430-001-ANA002",
  "430496-001-ANA001",
  "430537-001-ANA006",
  "CALC000004",
  "CALC000005",
  "CALC000041",
  "CALC000046",
  "CALC000092",
  "CALC000103",
  "CALC000108",
  "CALC000120",
  "CALC000123",
  "CALC000125",
  "CALC000126",
  "CALC000143",
  "CALC000145",
  "CALC000152",
  "CALC000713",
  "CALC000722",
  "CALC000735",
  "CALC000698",
  "CALC000697",
  "CALC000699",
  "171169-001-ANA009",
  "CALC000168",
  "CALC000158",
];

type RawRow = {
  timestamp: string;
  [key: string]: string | number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const sensor = searchParams.get("sensor") ?? "082687-001-ANA015";
  const limit = Math.min(Number(searchParams.get("limit") ?? "1000"), 5000);
  const start = searchParams.get("start");
  const stop = searchParams.get("stop");

  if (!ALLOWED_SENSORS.includes(sensor)) {
    return NextResponse.json(
      { ok: false, error: "Invalid sensor" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const selectClause = `timestamp,"${sensor}"`;

  let q = supabase
    .from("reservoir_sensors_reads_upload")
    .select(selectClause)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (start) q = q.gte("timestamp", start);
  if (stop) q = q.lt("timestamp", stop);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as unknown as RawRow[];

  const series = rows.map((row) => ({
    timestamp: row.timestamp,
    value: typeof row[sensor] === "number" ? row[sensor] : null,
  }));

  return NextResponse.json({
    ok: true,
    sensor,
    data: series,
  });
}