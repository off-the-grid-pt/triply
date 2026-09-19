import { readFileSync } from "node:fs";import { describe,expect,it } from "vitest";
const sql=readFileSync("supabase/migrations/202609010007_create_savings_plan.sql","utf8"),action=readFileSync("features/savings/actions.ts","utf8"),query=readFileSync("features/savings/queries.ts","utf8");
describe("savings security contract",()=>{
 it("stores one non-negative base-currency balance per Trip",()=>{expect(sql).toContain("trip_id uuid primary key");expect(sql).toContain("current_available_minor >= 0");expect(sql).toContain("savings_currency_mismatch");expect(sql).not.toMatch(/remaining_minor|daily_pace|weekly_pace|monthly_pace/);});
 it("enables RLS and scopes every policy through Trip ownership",()=>{expect(sql).toContain("alter table public.savings_plans enable row level security");expect(sql).toContain("revoke all on public.savings_plans from anon, authenticated");expect(sql.match(/trips\.user_id = \(select auth\.uid\(\)\)/g)?.length).toBe(4);});
 it("derives server data and ignores forged totals",()=>{expect(action).toContain("getOwnedTrip(tripId)");expect(action).not.toMatch(/totalFunded|remaining|dailyPace/);expect(query).toContain("calculateFinanceTotals");expect(query).toContain("calculateSavingsPlan");});
 it("does not mutate the savings balance from Module 04 payments",()=>{const financeActions=readFileSync("features/finance/actions.ts","utf8");expect(financeActions).not.toContain("savings_plans");});
});
