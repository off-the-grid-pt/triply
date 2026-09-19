import { getOwnedTrip,requireTripUser } from "@/features/trips/queries";
import type { ActualExpense,Adjustment,Category,CostItem,FinanceData,Payment } from "./types";
import type { CurrencyCode } from "@/features/trips/types";

type Row=Record<string,unknown>;
const text=(value:unknown)=>String(value);
const nullable=(value:unknown)=>value===null?null:String(value);
const category=(r:Row):Category=>({id:text(r.id),name:text(r.name),isDefault:Boolean(r.is_default),archivedAt:nullable(r.archived_at)});
const cost=(r:Row):CostItem=>({id:text(r.id),tripId:text(r.trip_id),categoryId:text(r.category_id),title:text(r.title),scopeType:r.scope_type as CostItem["scopeType"],stopId:nullable(r.stop_id),travelLegId:nullable(r.travel_leg_id),estimatedOriginalMinor:nullable(r.estimated_original_minor),estimatedCurrency:r.estimated_currency as CurrencyCode|null,estimatedBaseMinor:nullable(r.estimated_base_minor),estimatedConversionRate:nullable(r.estimated_conversion_rate),committedOriginalMinor:nullable(r.committed_original_minor),committedCurrency:r.committed_currency as CurrencyCode|null,committedBaseMinor:nullable(r.committed_base_minor),committedConversionRate:nullable(r.committed_conversion_rate),notes:nullable(r.notes),archivedAt:nullable(r.archived_at)});
const payment=(r:Row):Payment=>({id:text(r.id),tripId:text(r.trip_id),costItemId:nullable(r.cost_item_id),amountOriginalMinor:text(r.amount_original_minor),currency:r.currency as CurrencyCode,baseAmountMinor:text(r.base_amount_minor),conversionRate:text(r.conversion_rate),paidOn:text(r.paid_on),notes:nullable(r.notes),createdAt:text(r.created_at)});
const actual=(r:Row):ActualExpense=>({id:text(r.id),tripId:text(r.trip_id),costItemId:nullable(r.cost_item_id),categoryId:text(r.category_id),title:nullable(r.title),scopeType:r.scope_type as ActualExpense["scopeType"],stopId:nullable(r.stop_id),travelLegId:nullable(r.travel_leg_id),amountOriginalMinor:text(r.amount_original_minor),currency:r.currency as CurrencyCode,baseAmountMinor:text(r.base_amount_minor),conversionRate:text(r.conversion_rate),spentOn:text(r.spent_on),notes:nullable(r.notes),createdAt:text(r.created_at)});
const adjustment=(r:Row):Adjustment=>({id:text(r.id),tripId:text(r.trip_id),paymentId:nullable(r.payment_id),actualExpenseId:nullable(r.actual_expense_id),amountOriginalMinor:text(r.amount_original_minor),currency:r.currency as CurrencyCode,baseAmountMinor:text(r.base_amount_minor),conversionRate:text(r.conversion_rate),adjustedOn:text(r.adjusted_on),notes:nullable(r.notes),createdAt:text(r.created_at)});

export async function getOwnedFinance(tripId:string):Promise<FinanceData|null>{
  if(!await getOwnedTrip(tripId))return null;
  const{supabase}=await requireTripUser();
  const [categories,costs,payments,actuals,adjustments]=await Promise.all([
    supabase.from("expense_categories").select("id,name,is_default,archived_at").order("is_default",{ascending:false}).order("name"),
    supabase.from("cost_items").select("*").eq("trip_id",tripId).order("created_at"),
    supabase.from("payments").select("*").eq("trip_id",tripId).order("paid_on").order("created_at"),
    supabase.from("actual_expenses").select("*").eq("trip_id",tripId).order("spent_on").order("created_at"),
    supabase.from("financial_adjustments").select("*").eq("trip_id",tripId).order("adjusted_on").order("created_at"),
  ]);
  if(categories.error||costs.error||payments.error||actuals.error||adjustments.error)throw new Error("Não foi possível carregar os dados financeiros.");
  return{categories:((categories.data??[]) as Row[]).map(category),costs:((costs.data??[]) as Row[]).map(cost),payments:((payments.data??[]) as Row[]).map(payment),actuals:((actuals.data??[]) as Row[]).map(actual),adjustments:((adjustments.data??[]) as Row[]).map(adjustment)};
}

export async function getOwnedCost(tripId:string,costId:string):Promise<CostItem|null>{const data=await getOwnedFinance(tripId);return data?.costs.find(item=>item.id===costId)??null;}
