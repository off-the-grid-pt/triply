import type { SUPPORTED_CURRENCIES } from "@/features/auth/options";

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export type TripLifecycle = "upcoming" | "ongoing" | "past" | "archived";

export type Trip = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  originLabel: string | null;
  returnLabel: string | null;
  travelersCount: number;
  baseCurrency: CurrencyCode;
  targetBudgetMinor: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TripFormValues = {
  name: string;
  startDate: string;
  endDate: string;
  originLabel: string;
  returnLabel: string;
  travelersCount: string;
  baseCurrency: string;
  targetBudget: string;
  createRequestId: string;
};

export type TripField = Exclude<keyof TripFormValues, "createRequestId">;

export type TripActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<TripField, string>>;
  values?: TripFormValues;
  requiresItineraryConfirmation?: boolean;
};

export const initialTripActionState: TripActionState = { status: "idle" };

export type MutationActionState = {
  status: "idle" | "error";
  message?: string;
};

export const initialMutationActionState: MutationActionState = { status: "idle" };
