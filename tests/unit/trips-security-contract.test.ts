import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/202609010003_create_trips.sql"), "utf8");
const queries = readFileSync(join(root, "features/trips/queries.ts"), "utf8");
const actions = readFileSync(join(root, "features/trips/actions.ts"), "utf8");

describe("trips ownership security contract", () => {
  it("enables RLS and scopes all CRUD policies to auth.uid()", () => {
    expect(migration).toContain("alter table public.trips enable row level security");
    expect(migration).toContain('create policy "trips_select_own"');
    expect(migration).toContain('create policy "trips_insert_own"');
    expect(migration).toContain('create policy "trips_update_own"');
    expect(migration).toContain('create policy "trips_delete_own"');
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("does not grant anonymous trip access", () => {
    expect(migration).toContain("revoke all on table public.trips from anon");
    expect(migration).not.toMatch(/to anon/);
  });

  it("adds authenticated owner filters to reads and mutations as defense in depth", () => {
    expect(queries.match(/\.eq\("user_id", user\.id\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(actions.match(/\.eq\("user_id", user\.id\)/g)?.length).toBeGreaterThanOrEqual(5);
    expect(actions).not.toContain("formData.get(\"user_id\")");
  });

  it("prevents duplicate create requests per owner", () => {
    expect(migration).toContain("unique (user_id, create_request_id)");
    expect(actions).toContain('error.code === "23505"');
  });
});
