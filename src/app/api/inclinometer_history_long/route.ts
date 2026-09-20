import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "inclinometer_history_long",
  orderColumn: "observation_date",
  secondaryOrderColumns: [
    "inclinometer_id",
    "observation_number",
    "depth_h_m",
    "inclinometer_history_id",
  ],
  dateColumn: "observation_date",
  filterColumns: ["inclinometer_id", "observation_role"],
});
