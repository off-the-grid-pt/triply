import type { CurrencyCode } from "@/features/trips/types";

export type FinancialScope = "trip" | "stop" | "travel_leg";
export type Category = { id:string; name:string; isDefault:boolean; archivedAt:string|null };
export type CostItem = {
  id:string; tripId:string; categoryId:string; title:string; scopeType:FinancialScope; stopId:string|null; travelLegId:string|null;
  estimatedOriginalMinor:string|null; estimatedCurrency:CurrencyCode|null; estimatedBaseMinor:string|null; estimatedConversionRate:string|null;
  committedOriginalMinor:string|null; committedCurrency:CurrencyCode|null; committedBaseMinor:string|null; committedConversionRate:string|null;
  notes:string|null; archivedAt:string|null;
};
export type Payment = { id:string; tripId:string; costItemId:string|null; amountOriginalMinor:string; currency:CurrencyCode; baseAmountMinor:string; conversionRate:string; paidOn:string; notes:string|null; createdAt:string };
export type ActualExpense = { id:string; tripId:string; costItemId:string|null; categoryId:string; title:string|null; scopeType:FinancialScope; stopId:string|null; travelLegId:string|null; amountOriginalMinor:string; currency:CurrencyCode; baseAmountMinor:string; conversionRate:string; spentOn:string; notes:string|null; createdAt:string };
export type Adjustment = { id:string; tripId:string; paymentId:string|null; actualExpenseId:string|null; amountOriginalMinor:string; currency:CurrencyCode; baseAmountMinor:string; conversionRate:string; adjustedOn:string; notes:string|null; createdAt:string };
export type FinanceData = { categories:Category[]; costs:CostItem[]; payments:Payment[]; actuals:ActualExpense[]; adjustments:Adjustment[] };
export type FinanceTotals = { estimated:bigint; committed:bigint; forecast:bigint; paid:bigint; actual:bigint; unplannedActual:bigint };
export type FinanceActionState = { status:"idle"|"error"; message?:string; fieldErrors?:Record<string,string> };
export const initialFinanceActionState:FinanceActionState={status:"idle"};
