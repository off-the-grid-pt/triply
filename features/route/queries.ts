import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";
import type { CurrencyCode } from "@/features/trips/types";
import type { RouteData, Stop, TravelLeg } from "./types";

type StopRow = { id:string; trip_id:string; position:number; place_name:string; country_code:string; country_name:string; arrival_date:string; departure_date:string; timezone:string|null; notes:string|null; created_at:string; updated_at:string };
type LegRow = { id:string; trip_id:string; from_kind:TravelLeg["fromKind"]; from_stop_id:string|null; to_kind:TravelLeg["toKind"]; to_stop_id:string|null; mode:TravelLeg["mode"]; status:TravelLeg["status"]; departure_date:string|null; departure_time:string|null; departure_timezone:string|null; arrival_date:string|null; arrival_time:string|null; arrival_timezone:string|null; operator:string|null; reference:string|null; price_minor:string|number|null; price_currency:CurrencyCode|null; notes:string|null; review_required:boolean };
const stopColumns = "id,trip_id,position,place_name,country_code,country_name,arrival_date,departure_date,timezone,notes,created_at,updated_at";
const legColumns = "id,trip_id,from_kind,from_stop_id,to_kind,to_stop_id,mode,status,departure_date,departure_time,departure_timezone,arrival_date,arrival_time,arrival_timezone,operator,reference,price_minor,price_currency,notes,review_required";
const mapStop = (row:StopRow):Stop => ({ id:row.id, tripId:row.trip_id, position:row.position, placeName:row.place_name, countryCode:row.country_code, countryName:row.country_name, arrivalDate:row.arrival_date, departureDate:row.departure_date, timezone:row.timezone, notes:row.notes, createdAt:row.created_at, updatedAt:row.updated_at });
const mapLeg = (row:LegRow):TravelLeg => ({ id:row.id, tripId:row.trip_id, fromKind:row.from_kind, fromStopId:row.from_stop_id, toKind:row.to_kind, toStopId:row.to_stop_id, mode:row.mode, status:row.status, departureDate:row.departure_date, departureTime:row.departure_time?.slice(0,5) ?? null, departureTimezone:row.departure_timezone, arrivalDate:row.arrival_date, arrivalTime:row.arrival_time?.slice(0,5) ?? null, arrivalTimezone:row.arrival_timezone, operator:row.operator, reference:row.reference, priceMinor:row.price_minor === null ? null : String(row.price_minor), priceCurrency:row.price_currency, notes:row.notes, reviewRequired:row.review_required });

export async function getOwnedRoute(tripId:string):Promise<RouteData|null> {
  const trip = await getOwnedTrip(tripId); if (!trip) return null;
  const { supabase, user } = await requireTripUser();
  const [{data:stops,error:stopError},{data:legs,error:legError}] = await Promise.all([
    supabase.from("stops").select(stopColumns).eq("trip_id",tripId).order("position"),
    supabase.from("travel_legs").select(legColumns).eq("trip_id",tripId).order("created_at"),
  ]);
  if (stopError || legError) throw new Error("Não foi possível carregar a rota.");
  void user;
  return { stops:((stops ?? []) as StopRow[]).map(mapStop), legs:((legs ?? []) as LegRow[]).map(mapLeg) };
}

export async function getOwnedStop(tripId:string, stopId:string):Promise<Stop|null> {
  if (!await getOwnedTrip(tripId)) return null;
  const {supabase,user}=await requireTripUser();
  const {data,error}=await supabase.from("stops").select(stopColumns).eq("trip_id",tripId).eq("id",stopId).maybeSingle();
  if(error) throw new Error("Não foi possível carregar o destino."); void user; return data ? mapStop(data as StopRow) : null;
}

export async function getOwnedLeg(tripId:string, legId:string):Promise<TravelLeg|null> {
  if (!await getOwnedTrip(tripId)) return null;
  const {supabase,user}=await requireTripUser();
  const {data,error}=await supabase.from("travel_legs").select(legColumns).eq("trip_id",tripId).eq("id",legId).maybeSingle();
  if(error) throw new Error("Não foi possível carregar o transporte."); void user; return data ? mapLeg(data as LegRow) : null;
}
