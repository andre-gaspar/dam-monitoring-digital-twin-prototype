import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "piezometer_metadata_latest",
  orderColumn: "latest_timestamp_local",
  secondaryOrderColumns: ["piezometer_id"],
  dateColumn: "latest_timestamp_local",
  filterColumns: ["piezometer_id"],
});
