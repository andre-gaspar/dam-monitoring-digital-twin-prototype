import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "inclinometer_metadata",
  orderColumn: "latest_observation_date",
  secondaryOrderColumns: ["inclinometer_id"],
  dateColumn: "latest_observation_date",
  filterColumns: ["inclinometer_id"],
});
