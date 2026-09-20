import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TableRouteConfig = {
  table: string;
  orderColumn: string;
  secondaryOrderColumns?: string[];
  dateColumn?: string;
  filterColumns?: string[];
  defaultLimit?: number;
  maxLimit?: number;
};

type SupabaseRow = Record<string, unknown>;

const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_MAX_PAGE_SIZE = 1000;

function parseLimit(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function parseOffset(value: string | null) {
  const parsed = Number(value ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function serializeValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function serializeRows(rows: SupabaseRow[]) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, serializeValue(value)])
    )
  );
}

export function createSupabaseTableRoute(config: TableRouteConfig) {
  return async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

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

    const maxPageSize = config.maxLimit ?? DEFAULT_MAX_PAGE_SIZE;
    const limit = parseLimit(
      searchParams.get("limit"),
      config.defaultLimit ?? DEFAULT_BATCH_SIZE,
      maxPageSize
    );
    const offset = parseOffset(searchParams.get("offset"));
    const start = searchParams.get("start");
    const stop = searchParams.get("stop");
    const dateColumn = config.dateColumn ?? config.orderColumn;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const countOption = offset === 0 ? "exact" : undefined;

    let query = supabase
      .from(config.table)
      .select("*", { count: countOption })
      .order(config.orderColumn, { ascending: true });

    for (const column of config.secondaryOrderColumns ?? []) {
      query = query.order(column, { ascending: true });
    }

    if (start) query = query.gte(dateColumn, start);
    if (stop) query = query.lt(dateColumn, stop);

    for (const column of config.filterColumns ?? []) {
      const value = searchParams.get(column);
      if (value) query = query.eq(column, value);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          table: config.table,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as SupabaseRow[];
    const nextOffset = rows.length === limit ? offset + rows.length : null;

    return NextResponse.json({
      ok: true,
      table: config.table,
      offset,
      limit,
      count,
      returned: rows.length,
      truncated: typeof count === "number" ? rows.length < count : false,
      nextOffset,
      data: serializeRows(rows),
    });
  };
}
