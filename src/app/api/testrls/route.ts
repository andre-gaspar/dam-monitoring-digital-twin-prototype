// app/api/reservoir-level-hourly/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limitParam = Number(searchParams.get("limit") ?? "1000");
  const limit = Math.min(Number.isFinite(limitParam) ? limitParam : 1000, 5000);

  const start = searchParams.get("start");
  const stop = searchParams.get("stop");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      },
      { status: 500 }
    );
  }

  // Uses anon key, so this tests your RLS SELECT policy.
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let q = supabase
    .from("reservoir_level_hourly")
    .select(
      "reservoir_level_id,timestamp_local,date_local,cota_m,cota_raw,quality_flags,source_sheet,source_row",
      { count: "exact" }
    )
    .order("timestamp_local", { ascending: true })
    .limit(limit);

  if (start) q = q.gte("timestamp_local", start);
  if (stop) q = q.lt("timestamp_local", stop);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        details: error,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    count,
    returned: data?.length ?? 0,
    data,
  });
}