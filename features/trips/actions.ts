"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireTripUser } from "./queries";
import {
  deleteTripConfirmationSchema,
  targetBudgetMinor,
  tripFormSchema,
  tripIdSchema,
  tripValuesFromFormData,
} from "./schemas";
import type { MutationActionState, TripActionState, TripField } from "./types";

function tripFieldErrors(error: z.ZodError): Partial<Record<TripField, string>> {
  const result: Partial<Record<TripField, string>> = {};
  const fields: TripField[] = ["name", "startDate", "endDate", "originLabel", "returnLabel", "travelersCount", "baseCurrency", "targetBudget"];
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && fields.includes(field as TripField) && !result[field as TripField]) {
      result[field as TripField] = issue.message;
    }
  }
  return result;
}

function databasePayload(parsed: z.infer<typeof tripFormSchema>, userId: string) {
  return {
    user_id: userId,
    name: parsed.name,
    start_date: parsed.startDate,
    end_date: parsed.endDate,
    origin_label: parsed.originLabel,
    return_label: parsed.returnLabel,
    travelers_count: parsed.travelersCount,
    base_currency: parsed.baseCurrency,
    target_budget_minor: targetBudgetMinor(parsed.targetBudget, parsed.baseCurrency),
  };
}

export async function createTripAction(
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const values = tripValuesFromFormData(formData);
  const parsed = tripFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: tripFieldErrors(parsed.error), values };
  }

  const { supabase, user } = await requireTripUser();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      ...databasePayload(parsed.data, user.id),
      create_request_id: parsed.data.createRequestId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("trips")
        .select("id")
        .eq("user_id", user.id)
        .eq("create_request_id", parsed.data.createRequestId)
        .maybeSingle();
      if (existing?.id) redirect(`/trips/${existing.id}?created=1`);
    }
    return { status: "error", message: "Não foi possível criar a viagem. Tente novamente.", values };
  }

  revalidatePath("/trips");
  redirect(`/trips/${data.id}?created=1`);
}

export async function updateTripAction(
  tripId: string,
  _previous: TripActionState,
  formData: FormData,
): Promise<TripActionState> {
  const id = tripIdSchema.safeParse(tripId);
  const values = tripValuesFromFormData(formData);
  const parsed = tripFormSchema.safeParse(values);
  if (!id.success) return { status: "error", message: "Viagem não encontrada.", values };
  if (!parsed.success) return { status: "error", fieldErrors: tripFieldErrors(parsed.error), values };

  const { supabase, user } = await requireTripUser();
  const { count: affectedItinerary } = await supabase
    .from("itinerary_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", id.data)
    .or(`trip_date.lt.${parsed.data.startDate},trip_date.gt.${parsed.data.endDate}`);
  if ((affectedItinerary ?? 0) > 0 && String(formData.get("confirmItineraryImpact") ?? "") !== "1") {
    return { status: "error", message: `Esta alteração deixa ${affectedItinerary} atividade(s) fora das novas datas. Serão preservadas e marcadas para revisão. Confirme para continuar.`, values, requiresItineraryConfirmation: true };
  }
  const { data, error } = await supabase
    .from("trips")
    .update(databasePayload(parsed.data, user.id))
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error?.message.includes("base_currency_locked_by_financial_data")) {
      return { status: "error", message: "A moeda base não pode ser alterada depois de existirem registos financeiros.", values };
    }
    return { status: "error", message: "Não foi possível guardar as alterações. Confirme que a viagem ainda existe.", values };
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${id.data}`);
  redirect(`/trips/${id.data}?updated=1`);
}

async function setArchivedState(
  tripId: string,
  archived: boolean,
): Promise<MutationActionState> {
  const id = tripIdSchema.safeParse(tripId);
  if (!id.success) return { status: "error", message: "Viagem não encontrada." };
  const { supabase, user } = await requireTripUser();
  let query = supabase
    .from("trips")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id.data)
    .eq("user_id", user.id);
  query = archived ? query.is("archived_at", null) : query.not("archived_at", "is", null);
  const { data, error } = await query.select("id").maybeSingle();

  if (error || !data) {
    return { status: "error", message: archived ? "Não foi possível arquivar a viagem." : "Não foi possível restaurar a viagem." };
  }
  revalidatePath("/trips");
  revalidatePath(`/trips/${id.data}`);
  redirect(archived ? "/trips?archived=1" : `/trips/${id.data}?restored=1`);
}

export async function archiveTripAction(
  tripId: string,
  _previous: MutationActionState,
  _formData: FormData,
) {
  return setArchivedState(tripId, true);
}

export async function restoreTripAction(
  tripId: string,
  _previous: MutationActionState,
  _formData: FormData,
) {
  return setArchivedState(tripId, false);
}

export async function deleteTripAction(
  tripId: string,
  _previous: MutationActionState,
  formData: FormData,
): Promise<MutationActionState> {
  const id = tripIdSchema.safeParse(tripId);
  if (!id.success) return { status: "error", message: "Viagem não encontrada." };
  const { supabase, user } = await requireTripUser();
  const { data: trip, error: readError } = await supabase
    .from("trips")
    .select("name")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !trip) return { status: "error", message: "Viagem não encontrada." };
  const confirmation = String(formData.get("confirmation") ?? "");
  const confirmed = deleteTripConfirmationSchema.safeParse({ confirmation, expectedName: trip.name });
  if (!confirmed.success) return { status: "error", message: "Escreva o nome exato da viagem para confirmar." };

  const { data: documentRows, error: documentReadError } = await supabase
    .from("travel_documents")
    .select("attachment_path")
    .eq("trip_id", id.data)
    .not("attachment_path", "is", null);
  if (documentReadError) return { status: "error", message: "Não foi possível preparar a eliminação segura dos documentos da viagem." };

  const { data, error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { status: "error", message: "Não foi possível eliminar a viagem. Tente novamente." };

  const attachmentPaths = (documentRows ?? []).map((row) => row.attachment_path).filter((path): path is string => typeof path === "string");
  if (attachmentPaths.length) await supabase.storage.from("trip-documents").remove(attachmentPaths);

  revalidatePath("/trips");
  redirect("/trips?deleted=1");
}
