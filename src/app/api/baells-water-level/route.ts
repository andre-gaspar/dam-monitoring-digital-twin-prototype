// app/api/baells-water-level/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number(searchParams.get("limit") ?? "1000"), 5000);
  const start = searchParams.get("start");
  const stop = searchParams.get("stop");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  let q = supabase
    .from("baells_water_level_series")
    .select("timestamp, level")
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (start) q = q.gte("timestamp", start);
  if (stop) q = q.lt("timestamp", stop);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}