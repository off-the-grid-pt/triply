import { readFileSync } from "node:fs";import { describe,expect,it } from "vitest";
const sql=readFileSync("supabase/migrations/202609010008_create_itinerary.sql","utf8"),actions=readFileSync("features/itinerary/actions.ts","utf8");
describe("itinerary database and authorization contract",()=>{
 it("enables RLS and propagates Trip ownership",()=>{expect(sql).toContain("alter table public.itinerary_items enable row level security");expect(sql).toContain("revoke all on public.itinerary_items from anon,authenticated");expect(sql).toContain("trips.user_id=(select auth.uid())");});
 it("enforces same-Trip Stops and local-time shape",()=>{expect(sql).toContain("foreign key (stop_id, trip_id) references public.stops(id, trip_id) on delete restrict");expect(sql).toContain("end_local_time >= start_local_time");expect(sql).toContain("pg_catalog.pg_timezone_names");});
 it("preserves items across Stop deletion and date contraction",()=>{expect(sql).toContain("set stop_id=null,status='needs_review'");expect(sql).toContain("trips_flag_itinerary");expect(sql).toContain("stops_flag_itinerary");expect(sql).not.toMatch(/delete from public\.itinerary_items/);});
 it("uses owner-scoped atomic create/reorder and server validation",()=>{expect(sql).toContain("create_itinerary_item");expect(sql).toContain("reorder_untimed_itinerary");expect(actions).toContain("getOwnedItineraryItem(tripId,itemId)");expect(actions).toContain("getOwnedTrip(tripId)");});
});
