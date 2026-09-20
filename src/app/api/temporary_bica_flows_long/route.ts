import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "temporary_bica_flows_long",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["component_id", "bica_flow_id"],
  dateColumn: "timestamp_local",
  filterColumns: ["component_id", "status"],
});
