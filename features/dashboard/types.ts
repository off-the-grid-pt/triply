import type { TravelDocument } from "@/features/documents/types";
import type { FinanceData, FinanceTotals } from "@/features/finance/types";
import type { ItineraryItem } from "@/features/itinerary/types";
import type { PlanningData } from "@/features/planning/types";
import type { RouteData, Stop, TravelLeg } from "@/features/route/types";
import type { SavingsCalculation, SavingsRecord } from "@/features/savings/types";
import type { Trip } from "@/features/trips/types";

export type SectionResult<T>={status:"ready";data:T}|{status:"error"};
export type FinancialHealth="no_budget"|"within_budget"|"near_budget"|"over_budget";
export type AttentionTier="critical"|"high"|"medium"|"low";
export type AttentionItem={key:string;tier:AttentionTier;title:string;detail:string;date:string|null;href:string};
export type DashboardData={trip:Trip;route:SectionResult<RouteData>;finance:SectionResult<{data:FinanceData;totals:FinanceTotals}>;savings:SectionResult<{calculation:SavingsCalculation;record:SavingsRecord|null}|null>;itinerary:SectionResult<ItineraryItem[]>;planning:SectionResult<PlanningData>;documents:SectionResult<TravelDocument[]>};
export type RouteContext={orderedStops:Stop[];stopCount:number;countryCount:number;currentStop:Stop|null;nextStop:Stop|null;nextLeg:TravelLeg|null};
