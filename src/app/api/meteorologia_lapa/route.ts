import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_SERIES = [
  "Direcao_do_vento_horaria",
  "Precipitacao_anual_mm",
  "Precipitacao_diaria_mm",
  "Precipitacao_diaria_maxima_anual_mm",
  "Precipitacao_horaria_mm",
  "Precipitacao_mensal_mm",
  "Velocidade_do_vento_horaria_m_s",
  "Velocidade_do_vento_maxima_horaria_m_s",
  "Velocidade_do_vento_media_diaria_m_s",
];

type RawRow = {
  timestamp: string;
  [key: string]: string | number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const series =
    searchParams.get("series") ?? "Precipitacao_horaria_mm";
  const limit = Math.min(Number(searchParams.get("limit") ?? "500"), 50000);
  const start = searchParams.get("start");
  const stop = searchParams.get("stop");

  if (!ALLOWED_SERIES.includes(series)) {
    return NextResponse.json(
      { ok: false, error: "Invalid series" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const selectClause = `timestamp,"${series}"`;

  let q = supabase
    .from("meteorologia_lapa1")
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

  const cleaned = rows
    .map((row) => ({
      timestamp: row.timestamp,
      value: typeof row[series] === "number" ? row[series] : null,
    }))
    .filter((row) => row.value !== null);

  return NextResponse.json({
    ok: true,
    series,
    data: cleaned,
  });
}
