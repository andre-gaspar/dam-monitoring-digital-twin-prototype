import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const inclinometer = searchParams.get("inclinometer") ?? "I1";
  const node = Number(searchParams.get("node") ?? "4");
  const limit = Math.min(Number(searchParams.get("limit") ?? "200"), 1000);

  // Expect ISO strings like: 2025-04-01T09:00:00Z
  const start = searchParams.get("start"); // inclusive
  const stop = searchParams.get("stop");   // exclusive

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  let q = supabase
    .from("ipi_samples")
    .select("time,inclinometer,node,ax,ay,az")
    .eq("inclinometer", inclinometer)
    .eq("node", node)
    .order("time", { ascending: true })
    .limit(limit);

  if (start) q = q.gte("time", start);
  if (stop) q = q.lt("time", stop);

  const { data, error } = await q;

  if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
