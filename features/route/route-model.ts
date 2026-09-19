import type { Trip } from "@/features/trips/types";
import type { RouteAdjacency, RouteData, RoutePoint, Stop, TravelLeg } from "./types";

export function routePointToken(kind: RoutePoint["kind"], stopId: string | null): string {
  return kind === "stop" ? `stop:${stopId}` : kind === "origin_boundary" ? "origin" : "return";
}

export function parseRoutePointToken(token: string): Pick<RoutePoint, "kind" | "stopId"> | null {
  if (token === "origin") return { kind: "origin_boundary", stopId: null };
  if (token === "return") return { kind: "return_boundary", stopId: null };
  const match = /^stop:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(token);
  return match ? { kind: "stop", stopId: match[1] } : null;
}

export function buildRoutePoints(trip: Pick<Trip, "originLabel" | "returnLabel">, stops: Stop[]): RoutePoint[] {
  const points: RoutePoint[] = [];
  if (trip.originLabel) points.push({ token: "origin", kind: "origin_boundary", stopId: null, label: trip.originLabel });
  points.push(...[...stops].sort((a, b) => a.position - b.position).map((stop) => ({ token: `stop:${stop.id}`, kind: "stop" as const, stopId: stop.id, label: stop.placeName })));
  if (trip.returnLabel) points.push({ token: "return", kind: "return_boundary", stopId: null, label: trip.returnLabel });
  return points;
}

export function isLegForPoints(leg: TravelLeg, from: RoutePoint, to: RoutePoint): boolean {
  return leg.fromKind === from.kind && leg.fromStopId === from.stopId && leg.toKind === to.kind && leg.toStopId === to.stopId;
}

export function buildAdjacencies(points: RoutePoint[], legs: TravelLeg[]): RouteAdjacency[] {
  return points.slice(0, -1).map((from, index) => {
    const to = points[index + 1];
    const activeLeg = legs.find((leg) => !leg.reviewRequired && leg.status !== "cancelled" && isLegForPoints(leg, from, to)) ?? null;
    return { from, to, activeLeg };
  });
}

export function validateStopSequence(stops: Stop[]): string | null {
  const ordered = [...stops].sort((a, b) => a.position - b.position);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index - 1].departureDate > ordered[index].arrivalDate) return `As datas de ${ordered[index - 1].placeName} e ${ordered[index].placeName} sobrepõem-se.`;
  }
  return null;
}

export function affectedLegsForOrder(stops: Stop[], legs: TravelLeg[]): TravelLeg[] {
  const position = new Map(stops.map((stop, index) => [stop.id, index]));
  return legs.filter((leg) => {
    if (leg.reviewRequired) return false;
    if (leg.fromKind === "stop" && leg.toKind === "stop") return position.get(leg.toStopId ?? "") !== (position.get(leg.fromStopId ?? "") ?? -2) + 1;
    if (leg.fromKind === "origin_boundary") return position.get(leg.toStopId ?? "") !== 0;
    if (leg.toKind === "return_boundary") return position.get(leg.fromStopId ?? "") !== stops.length - 1;
    return true;
  });
}

export function routeData(stops: Stop[], legs: TravelLeg[]): RouteData { return { stops, legs }; }

export function stayDurationLabel(arrivalDate: string, departureDate: string): string {
  const parts = (value: string) => value.split("-").map(Number) as [number, number, number];
  const [startYear, startMonth, startDay] = parts(arrivalDate);
  const [endYear, endMonth, endDay] = parts(departureDate);
  const nights = Math.round((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000);
  return nights === 0 ? "1 dia" : `${nights} ${nights === 1 ? "noite" : "noites"}`;
}
