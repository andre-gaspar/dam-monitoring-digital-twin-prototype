import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "manual_cota_events",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["manual_observation_id"],
  dateColumn: "timestamp_local",
});
