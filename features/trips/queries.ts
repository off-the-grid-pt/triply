import { redirect } from "next/navigation";
import { SUPPORTED_CURRENCIES } from "@/features/auth/options";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode, Trip } from "./types";

type TripRow = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  origin_label: string | null;
  return_label: string | null;
  travelers_count: number;
  base_currency: CurrencyCode;
  target_budget_minor: number | string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const tripColumns = "id,user_id,name,start_date,end_date,origin_label,return_label,travelers_count,base_currency,target_budget_minor,archived_at,created_at,updated_at";

function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    originLabel: row.origin_label,
    returnLabel: row.return_label,
    travelersCount: row.travelers_count,
    baseCurrency: row.base_currency,
    targetBudgetMinor: row.target_budget_minor === null ? null : String(row.target_budget_minor),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function requireTripUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/sign-in");
  return { supabase, user: data.user };
}

export async function getDefaultTripCurrency(): Promise<CurrencyCode> {
  const { supabase, user } = await requireTripUser();
  const { data } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("user_id", user.id)
    .maybeSingle();
  const currency = data?.default_currency;
  return SUPPORTED_CURRENCIES.some((supported) => supported === currency)
    ? currency as CurrencyCode
    : "EUR";
}

export async function getTripPageIdentity(): Promise<string> {
  const { supabase, user } = await requireTripUser();
  const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  return data?.display_name ?? user.email ?? "Conta Triply";
}

export async function listOwnedTrips(): Promise<Trip[]> {
  const { supabase, user } = await requireTripUser();
  const { data, error } = await supabase
    .from("trips")
    .select(tripColumns)
    .eq("user_id", user.id);

  if (error) throw new Error("Não foi possível carregar as viagens.");
  return ((data ?? []) as TripRow[]).map(mapTrip);
}

export async function getOwnedTrip(tripId: string): Promise<Trip | null> {
  const { supabase, user } = await requireTripUser();
  const { data, error } = await supabase
    .from("trips")
    .select(tripColumns)
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar a viagem.");
  return data ? mapTrip(data as TripRow) : null;
}
