"use client";

import { useActionState, useState } from "react";
import { archiveTripAction, deleteTripAction, restoreTripAction } from "../actions";
import { initialMutationActionState } from "../types";

export function TripLifecycleAction({ tripId, archived }: { tripId: string; archived: boolean }) {
  const action = (archived ? restoreTripAction : archiveTripAction).bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, initialMutationActionState);
  return (
    <form action={formAction}>
      <button disabled={pending} className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold hover:bg-background disabled:opacity-60">
        {pending ? "A processar…" : archived ? "Restaurar viagem" : "Arquivar viagem"}
      </button>
      {state.message ? <p role="alert" className="mt-2 text-sm text-destructive">{state.message}</p> : null}
    </form>
  );
}

export function DeleteTripForm({ tripId, tripName }: { tripId: string; tripName: string }) {
  const [confirmation, setConfirmation] = useState("");
  const action = deleteTripAction.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, initialMutationActionState);
  const confirmed = confirmation === tripName;

  return (
    <details className="rounded-card border border-destructive bg-destructive-muted p-5">
      <summary className="cursor-pointer font-semibold text-destructive">Eliminar permanentemente</summary>
      <div className="mt-4 text-sm leading-6 text-destructive">
        <p>Esta ação elimina permanentemente <strong>{tripName}</strong> e, no futuro, todos os destinos, despesas, itinerário, reservas, listas e documentos associados. Não pode ser anulada.</p>
        <form action={formAction} className="mt-4">
          <label htmlFor="confirmation" className="block font-medium">Escreva <strong>{tripName}</strong> para confirmar</label>
          <input id="confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 h-12 w-full rounded-control border border-destructive bg-card px-4 outline-none focus:ring-2 focus:ring-destructive/20" />
          {state.message ? <p role="alert" className="mt-2 font-medium text-destructive">{state.message}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={!confirmed || pending} className="rounded-full bg-danger-hover px-5 py-2.5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{pending ? "A eliminar…" : "Eliminar definitivamente"}</button>
            <button type="button" onClick={() => setConfirmation("")} className="rounded-full border border-destructive px-5 py-2.5 font-semibold">Cancelar</button>
          </div>
        </form>
      </div>
    </details>
  );
}
