import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "piezometer_history_long",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["piezometer_id", "piezometer_history_id"],
  dateColumn: "timestamp_local",
  filterColumns: ["piezometer_id"],
});
