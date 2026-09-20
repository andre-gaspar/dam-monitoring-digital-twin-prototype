import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "reservoir_level_hourly",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["reservoir_level_id"],
  dateColumn: "timestamp_local",
});
