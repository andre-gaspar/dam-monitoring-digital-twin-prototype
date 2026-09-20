import { createSupabaseTableRoute } from "@/lib/montesinhoSupabaseRoute";

export const dynamic = "force-dynamic";

export const GET = createSupabaseTableRoute({
  table: "timeline_events",
  orderColumn: "timestamp_local",
  secondaryOrderColumns: ["timeline_id"],
  dateColumn: "timestamp_local",
  filterColumns: ["source_dataset", "event_type", "entity_type", "entity_id"],
});
