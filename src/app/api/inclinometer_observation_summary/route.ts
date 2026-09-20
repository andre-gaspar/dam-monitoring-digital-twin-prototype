import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "inclinometer_observation_summary",
  orderColumn: "observation_date",
  secondaryOrderColumns: [
    "inclinometer_id",
    "observation_number",
    "inclinometer_observation_id",
  ],
  dateColumn: "observation_date",
  filterColumns: ["inclinometer_id", "observation_role"],
});
