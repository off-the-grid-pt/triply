import { readFileSync } from "node:fs";import { describe,expect,it } from "vitest";
const sql=readFileSync("supabase/migrations/202609010006_create_finance.sql","utf8");
describe("finance database security contract",()=>{
 it("enables RLS and propagates authenticated Trip ownership",()=>{for(const table of ["expense_categories","cost_items","payments","actual_expenses","financial_adjustments"])expect(sql).toContain(`alter table public.${table} enable row level security`);expect(sql.match(/trips\.user_id = \(select auth\.uid\(\)\)/g)?.length).toBeGreaterThanOrEqual(4);expect(sql).toContain("revoke all on public.expense_categories");});
 it("blocks cross-trip scopes and silent route cascades",()=>{expect(sql).toContain("foreign key (stop_id, trip_id) references public.stops(id, trip_id) on delete restrict");expect(sql).toContain("foreign key (travel_leg_id, trip_id) references public.travel_legs(id, trip_id) on delete restrict");});
 it("uses exact money, conversion snapshots and retry keys",()=>{expect(sql).toContain("amount_original_minor bigint");expect(sql).toContain("conversion_rate numeric(30,12)");expect(sql).toContain("payments_request_unique unique (trip_id, request_id)");expect(sql).toContain("actual_expenses_request_unique unique (trip_id, request_id)");});
 it("locks base currency, rejects future payments and preserves refunds",()=>{expect(sql).toContain("base_currency_locked_by_financial_data");expect(sql).toContain("future_payment_not_allowed");expect(sql).toContain("amount_original_minor < 0");});
});
