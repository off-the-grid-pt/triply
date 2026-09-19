"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Reservation } from "@/features/planning/types";
import type { Stop, TravelLeg } from "@/features/route/types";
import { deleteDocumentAction, removeAttachmentAction, saveDocumentAction, uploadAttachmentAction } from "../actions";
import type { TravelDocument } from "../types";
import { documentTypeLabels } from "../labels";
import { initialDocumentState } from "../types";

const input = "mt-2 h-11 w-full rounded-control border border-input bg-card px-3";
export function DocumentForm({ tripId, document, stops, legs, reservations }: { tripId:string; document?:TravelDocument; stops:Stop[]; legs:TravelLeg[]; reservations:Reservation[] }) {
  const [state, action, pending] = useActionState(saveDocumentAction.bind(null, tripId, document?.id), initialDocumentState);
  const requestId = useRef<HTMLInputElement>(null); useEffect(() => { if (requestId.current) requestId.current.value = crypto.randomUUID(); }, []);
  const error = (name: string) => state.fieldErrors?.[name] ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors[name]}</p> : null;
  return <form action={action} className="space-y-5"><input ref={requestId} type="hidden" name="requestId" defaultValue=""/>
    <label className="block text-sm font-medium">Tipo *<select name="type" defaultValue={document?.type ?? "passport"} className={input}>{Object.entries(documentTypeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label className="block text-sm font-medium">Título *<input name="title" defaultValue={document?.title} maxLength={160} required className={input}/>{error("title")}</label>
    <label className="block text-sm font-medium">Titular / viajante (opcional)<input name="holderLabel" defaultValue={document?.holderLabel ?? ""} maxLength={120} className={input}/></label>
    <div className="grid gap-4 sm:grid-cols-2"><Association name="stopId" label="Destino" value={document?.stopId} items={stops.map((x)=>[x.id,x.placeName])}/><Association name="travelLegId" label="Transporte" value={document?.travelLegId} items={legs.map((x)=>[x.id,x.operator || x.reference || x.mode])}/><Association name="reservationId" label="Reserva" value={document?.reservationId} items={reservations.map((x)=>[x.id,x.title])}/></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Data de emissão<input name="issueDate" type="date" defaultValue={document?.issueDate ?? ""} className={input}/>{error("issueDate")}</label><label className="block text-sm font-medium">Data de validade<input name="expiryDate" type="date" defaultValue={document?.expiryDate ?? ""} className={input}/>{error("expiryDate")}</label></div>
    <label className="block text-sm font-medium">Notas<textarea name="notes" defaultValue={document?.notes ?? ""} maxLength={4000} className="mt-2 min-h-28 w-full rounded-control border border-input p-3"/></label>
    <p className="text-xs text-muted-foreground">Evite inserir números completos de passaporte ou identificação, cartões, PINs, palavras-passe ou outros segredos nas notas.</p>
    {state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending?"A guardar…":"Guardar documento"}</button>
  </form>;
}

function Association({ name, label, value, items }: { name:string; label:string; value?:string|null; items:[string,string][] }) { return <label className="block text-sm font-medium">{label} (opcional)<select name={name} defaultValue={value ?? ""} className={input}><option value="">Sem associação</option>{items.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label>; }

export function AttachmentForm({ tripId, document }: { tripId:string; document:TravelDocument }) { const [state, action, pending] = useActionState(uploadAttachmentAction.bind(null,tripId,document.id),initialDocumentState); return <form action={action} className="space-y-3"><label className="block text-sm font-medium">{document.attachmentPath?"Substituir ficheiro":"Adicionar ficheiro"}<input name="attachment" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm"/></label><p className="text-xs text-muted-foreground">PDF, JPEG, PNG ou WEBP, até 10 MB. O ficheiro fica privado.</p>{state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold">{pending?"A enviar…":"Enviar ficheiro"}</button></form>; }

export function RemoveAttachmentForm({ tripId, documentId }: { tripId:string; documentId:string }) { const [state, action, pending] = useActionState(removeAttachmentAction.bind(null,tripId,documentId),initialDocumentState); return <form action={action} className="space-y-3"><label className="flex items-start gap-2 text-sm"><input required type="checkbox" name="confirm" value="remove" className="mt-1"/>Confirmo que quero remover permanentemente o ficheiro, mantendo os metadados.</label>{state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full border border-destructive px-5 py-2.5 text-sm font-semibold text-destructive">Remover ficheiro</button></form>; }

export function DeleteDocumentForm({ tripId, document }: { tripId:string; document:TravelDocument }) { const [state, action, pending] = useActionState(deleteDocumentAction.bind(null,tripId,document.id),initialDocumentState); return <form action={action} className="space-y-3"><label className="block text-sm font-medium">Para eliminar o registo e o ficheiro, escreva <strong>{document.title}</strong><input name="confirmation" required autoComplete="off" className={input}/></label>{state.message?<p role="alert" className="text-sm text-destructive">{state.message}</p>:null}<button disabled={pending} className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-primary-foreground">Eliminar documento</button></form>; }
