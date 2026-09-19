"use client";

import { useActionState, useEffect, useState } from "react";
import { SUPPORTED_CURRENCIES } from "@/features/auth/options";
import { createTripAction, updateTripAction } from "../actions";
import type { TripActionState, TripFormValues } from "../types";

type TripFormProps = {
  mode: "create" | "edit";
  initialValues: TripFormValues;
  tripId?: string;
};

const inputClass = "h-12 w-full rounded-control border border-input bg-card px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/10";

export function TripForm({ mode, initialValues, tripId }: TripFormProps) {
  const action = mode === "create"
    ? createTripAction
    : updateTripAction.bind(null, tripId ?? "");
  const initialState: TripActionState = { status: "idle", values: initialValues };
  const [state, formAction, pending] = useActionState(action, initialState);
  const [dirty, setDirty] = useState(false);
  const values = state.values ?? initialValues;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty || pending) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  return (
    <form
      key={JSON.stringify(values)}
      action={formAction}
      className="space-y-6"
      noValidate
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      <input type="hidden" name="createRequestId" value={values.createRequestId} />
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">Nome da viagem <span aria-hidden="true">*</span></label>
        <input id="name" name="name" defaultValue={values.name} maxLength={100} required autoFocus={mode === "create"} aria-invalid={Boolean(state.fieldErrors?.name)} aria-describedby={state.fieldErrors?.name ? "name-error" : undefined} className={inputClass} />
        {state.fieldErrors?.name ? <p id="name-error" className="mt-2 text-sm text-destructive">{state.fieldErrors.name}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Data de início" name="startDate" type="date" value={values.startDate} error={state.fieldErrors?.startDate} required />
        <Field label="Data de fim" name="endDate" type="date" value={values.endDate} error={state.fieldErrors?.endDate} required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Origem (opcional)" name="originLabel" value={values.originLabel} error={state.fieldErrors?.originLabel} maxLength={120} />
        <Field label="Regresso (opcional)" name="returnLabel" value={values.returnLabel} error={state.fieldErrors?.returnLabel} maxLength={120} />
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">A origem e o regresso são limites da rota, não destinos.</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Número de viajantes" name="travelersCount" type="number" value={values.travelersCount} error={state.fieldErrors?.travelersCount} min="1" step="1" required />
        <div>
          <label htmlFor="baseCurrency" className="mb-2 block text-sm font-medium">Moeda base <span aria-hidden="true">*</span></label>
          <select id="baseCurrency" name="baseCurrency" defaultValue={values.baseCurrency} required aria-invalid={Boolean(state.fieldErrors?.baseCurrency)} className={inputClass}>
            {SUPPORTED_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
          {state.fieldErrors?.baseCurrency ? <p className="mt-2 text-sm text-destructive">{state.fieldErrors.baseCurrency}</p> : null}
        </div>
      </div>

      <div>
        <Field label="Orçamento total desejado (opcional)" name="targetBudget" type="text" inputMode="decimal" value={values.targetBudget} error={state.fieldErrors?.targetBudget} placeholder="0,00" />
        <p className="mt-2 text-sm text-muted-foreground">Montante total da viagem; não é multiplicado pelo número de viajantes.</p>
      </div>

      {state.message ? <p role="alert" className="rounded-control border border-destructive bg-destructive-muted p-4 text-sm text-destructive">{state.message}</p> : null}
      {state.requiresItineraryConfirmation ? <label className="flex items-start gap-3 rounded-control border border-warning bg-warning-muted p-4 text-sm"><input type="checkbox" name="confirmItineraryImpact" value="1" required className="mt-0.5"/><span>Confirmo a alteração das datas e compreendo que as atividades afetadas serão preservadas para revisão.</span></label> : null}

      <button type="submit" disabled={pending} className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "A guardar…" : mode === "create" ? "Criar viagem" : "Guardar alterações"}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  error?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  min?: string;
  step?: string;
  inputMode?: "decimal";
  placeholder?: string;
};

function Field({ label, name, value, error, type = "text", required, ...props }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">{label} {required ? <span aria-hidden="true">*</span> : null}</label>
      <input id={name} name={name} type={type} defaultValue={value} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={inputClass} {...props} />
      {error ? <p id={errorId} className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
