import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "weather_hourly",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["weather_id"],
  dateColumn: "timestamp_local",
});
