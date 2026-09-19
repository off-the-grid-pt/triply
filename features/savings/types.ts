export type SavingsTargetBasis="target_budget"|"current_forecast";
export type SavingsState="no_target"|"not_funded"|"partially_funded"|"fully_funded"|"overfunded"|"departure_today"|"trip_started_or_past";
export type SavingsPlanInput={targetBudgetMinor:string|null;forecastMinor:string;hasForecast:boolean;netPaidMinor:string;currentAvailableMinor:string;startDate:string;today:string};
export type SavingsCalculation={state:SavingsState;targetBasis:SavingsTargetBasis|null;targetMinor:bigint|null;currentAvailableMinor:bigint;eligiblePaidMinor:bigint;totalFundedMinor:bigint;remainingMinor:bigint|null;surplusMinor:bigint|null;progressBasisPoints:bigint|null;daysUntilDeparture:number;dailyPaceMinor:bigint|null;weeklyPaceMinor:bigint|null;monthlyPaceMinor:bigint|null};
export type SavingsRecord={tripId:string;currentAvailableMinor:string;currency:string;updatedAt:string};
export type SavingsActionState={status:"idle"|"error";message?:string;fieldError?:string};
export const initialSavingsActionState:SavingsActionState={status:"idle"};
