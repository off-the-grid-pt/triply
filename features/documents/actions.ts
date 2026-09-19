"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getOwnedPlanning } from "@/features/planning/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { getOwnedTrip, requireTripUser } from "@/features/trips/queries";
import { extensionFor, inspectUpload, safeOriginalName } from "./helpers";
import { getOwnedDocument } from "./queries";
import { documentFormValues, documentSchema } from "./schemas";
import type { DocumentActionState } from "./types";

const documentsPath = (tripId: string) => `/trips/${tripId}/documents`;
const nullable = (value: string | null) => value || null;
const fieldErrors = (error: z.ZodError) => Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));

export async function saveDocumentAction(tripId: string, documentId: string | undefined, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const parsed = documentSchema.safeParse(documentFormValues(data));
  if (!parsed.success) return { status:"error", fieldErrors:fieldErrors(parsed.error) };
  const [trip, route, planning, existing] = await Promise.all([getOwnedTrip(tripId), getOwnedRoute(tripId), getOwnedPlanning(tripId), documentId ? getOwnedDocument(tripId, documentId) : Promise.resolve(null)]);
  if (!trip || !route || !planning || documentId && !existing || parsed.data.stopId && !route.stops.some((item) => item.id === parsed.data.stopId) || parsed.data.travelLegId && !route.legs.some((item) => item.id === parsed.data.travelLegId) || parsed.data.reservationId && !planning.reservations.some((item) => item.id === parsed.data.reservationId)) return { status:"error", message:"Documento ou associação não disponível." };
  const payload = { trip_id:tripId, type:parsed.data.type, title:parsed.data.title, holder_label:parsed.data.holderLabel, stop_id:nullable(parsed.data.stopId), reservation_id:nullable(parsed.data.reservationId), travel_leg_id:nullable(parsed.data.travelLegId), issue_date:nullable(parsed.data.issueDate), expiry_date:nullable(parsed.data.expiryDate), notes:parsed.data.notes, needs_review:false };
  const { supabase } = await requireTripUser();
  if (documentId) {
    const { error } = await supabase.from("travel_documents").update(payload).eq("trip_id", tripId).eq("id", documentId);
    if (error) return { status:"error", message:"Não foi possível guardar o documento." };
  } else {
    const { data: created, error } = await supabase.from("travel_documents").insert({ ...payload, create_request_id:parsed.data.requestId }).select("id").single();
    if (error?.code === "23505") redirect(documentsPath(tripId));
    if (error || !created) return { status:"error", message:"Não foi possível criar o documento." };
    redirect(`${documentsPath(tripId)}/${created.id}/edit?created=1`);
  }
  revalidatePath(documentsPath(tripId)); redirect(`${documentsPath(tripId)}?saved=1`);
}

export async function uploadAttachmentAction(tripId: string, documentId: string, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId); const file = data.get("attachment");
  if (!document || !(file instanceof File)) return { status:"error", message:"Documento ou ficheiro inválido." };
  const mime = await inspectUpload(file);
  if (!mime) return { status:"error", message:file.size > 10 * 1024 * 1024 ? "O ficheiro excede o limite de 10 MB." : "Use PDF, JPEG, PNG ou WEBP válido." };
  const { supabase, user } = await requireTripUser();
  const newPath = `${user.id}/${tripId}/${documentId}/${crypto.randomUUID()}.${extensionFor(mime)}`;
  const { error: uploadError } = await supabase.storage.from("trip-documents").upload(newPath, await file.arrayBuffer(), { contentType:mime, upsert:false });
  if (uploadError) return { status:"error", message:"O upload falhou. O ficheiro anterior, se existir, foi preservado." };
  const { error: updateError } = await supabase.from("travel_documents").update({ attachment_path:newPath, attachment_name:safeOriginalName(file.name), attachment_mime:mime, attachment_size:file.size }).eq("trip_id", tripId).eq("id", documentId);
  if (updateError) { await supabase.storage.from("trip-documents").remove([newPath]); return { status:"error", message:"Não foi possível associar o ficheiro." }; }
  if (document.attachmentPath) await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId)); redirect(`${documentsPath(tripId)}?uploaded=1`);
}

export async function removeAttachmentAction(tripId: string, documentId: string, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId);
  if (!document?.attachmentPath || data.get("confirm") !== "remove") return { status:"error", message:"Confirme a remoção do ficheiro." };
  const { supabase } = await requireTripUser();
  const { error } = await supabase.from("travel_documents").update({ attachment_path:null, attachment_name:null, attachment_mime:null, attachment_size:null }).eq("trip_id", tripId).eq("id", documentId);
  if (error) return { status:"error", message:"Não foi possível remover o ficheiro." };
  await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId)); redirect(documentsPath(tripId));
}

export async function deleteDocumentAction(tripId: string, documentId: string, _state: DocumentActionState, data: FormData): Promise<DocumentActionState> {
  const document = await getOwnedDocument(tripId, documentId);
  if (!document || String(data.get("confirmation") ?? "") !== document.title) return { status:"error", message:"Escreva o título exato para confirmar." };
  const { supabase } = await requireTripUser(); const { error } = await supabase.from("travel_documents").delete().eq("trip_id", tripId).eq("id", documentId);
  if (error) return { status:"error", message:"Não foi possível eliminar o documento." };
  if (document.attachmentPath) await supabase.storage.from("trip-documents").remove([document.attachmentPath]);
  revalidatePath(documentsPath(tripId)); redirect(documentsPath(tripId));
}
