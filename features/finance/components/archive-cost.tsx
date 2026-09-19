"use client";
import { useActionState } from "react";
import { archiveCostAction } from "../actions";
import type { FinanceActionState } from "../types";
const initial:FinanceActionState={status:"idle"};
export function ArchiveCost({tripId,costId,archived}:{tripId:string;costId:string;archived:boolean}){const[state,action,pending]=useActionState(archiveCostAction.bind(null,tripId,costId),initial);return <form action={action} className="mt-8 border-t border-border pt-6"><button disabled={pending} className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold">{archived?"Restaurar custo":"Arquivar custo"}</button>{state.message?<p className="mt-2 text-sm text-destructive">{state.message}</p>:null}</form>}
