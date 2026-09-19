import Link from "next/link";
import { formatTripDateRange } from "../date";
import { deriveTripLifecycle, lifecycleLabels } from "../lifecycle";
import { formatMinorUnits } from "../money";
import type { Trip } from "../types";

export function TripCard({ trip, today }: { trip: Trip; today: string }) {
  const lifecycle = deriveTripLifecycle(trip, today);
  const budget = formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency);
  return <article className="group flex h-full flex-col rounded-card border border-border bg-card transition-colors hover:border-muted-foreground/50">
    <div className="flex-1 p-6">
    <div className="flex items-center justify-between gap-3"><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control border border-border text-lg text-muted-foreground">↗</span><span className="rounded-control bg-muted px-2 py-1 text-xs text-muted-foreground">{lifecycleLabels[lifecycle]}</span></div>
    <h3 className="mt-6 break-words text-xl font-semibold tracking-tight"><Link className="hover:text-link" href={`/trips/${trip.id}`}>{trip.name}</Link></h3><p className="mt-2 text-sm text-muted-foreground">{formatTripDateRange(trip.startDate, trip.endDate)}</p>
    <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 text-sm"><div><dt className="text-xs text-muted-foreground">Viajantes</dt><dd className="mt-1.5 font-medium">{trip.travelersCount}</dd></div><div><dt className="text-xs text-muted-foreground">Moeda base</dt><dd className="mt-1.5 font-medium">{trip.baseCurrency}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Orçamento desejado</dt><dd className="mt-1.5 text-lg font-medium tabular-nums">{budget ?? "Não definido"}</dd></div></dl>
    </div>
    <footer className="rounded-b-card border-t border-border bg-muted/60 px-6 py-2"><Link className="flex min-h-11 items-center justify-between rounded-control text-sm font-medium text-muted-foreground hover:text-link" href={`/trips/${trip.id}`}><span>Abrir</span><span aria-hidden="true">↗</span></Link></footer>
  </article>;
}
