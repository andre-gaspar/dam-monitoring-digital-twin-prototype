import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "seepage_flows_long",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["component_id", "seepage_flow_id"],
  dateColumn: "timestamp_local",
  filterColumns: ["component_id", "status"],
});
