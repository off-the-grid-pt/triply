import Link from "next/link";
import type { RouteData } from "@/features/route/types";
import { formatMinorUnits } from "@/features/trips/money";
import type { Trip } from "@/features/trips/types";
import { calculateBreakdown, calculateFinanceTotals, overpaidCostIds, remaining } from "../calculations";
import type { FinanceData } from "../types";
const format = (value: bigint, trip: Trip) => formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";
export function FinanceDashboard({ trip, data, route }: {
    trip: Trip;
    data: FinanceData;
    route: RouteData;
}) {
    const totals = calculateFinanceTotals(data.costs, data.payments, data.actuals, data.adjustments);
    const forecastRemaining = remaining(trip.targetBudgetMinor, totals.forecast);
    const actualRemaining = remaining(trip.targetBudgetMinor, totals.actual);
    const categories = calculateBreakdown(data.costs, data.actuals, data.adjustments, "categoryId");
    const stops = calculateBreakdown(data.costs, data.actuals, data.adjustments, "stopId");
    const overpaid = overpaidCostIds(data.costs, data.payments, data.adjustments);
    return (
<>
 
    <section className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{[["Orçamento alvo", trip.targetBudgetMinor === null ? "Não definido" : format(BigInt(trip.targetBudgetMinor), trip)], ["Estimado", format(totals.estimated, trip)], ["Previsão atual", format(totals.forecast, trip)], ["Comprometido", format(totals.committed, trip)], ["Pago líquido", format(totals.paid, trip)], ["Real líquido", format(totals.actual, trip)]].map(([label, value]) => 
      <article key={label} className="min-w-0 bg-card p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">{label}
        </p>
        <p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">{value}
        </p>
      </article>)}
    </section>
 {forecastRemaining !== null ? 
    <p className={`mt-5 rounded-card p-4 text-sm ${forecastRemaining < 0n ? "bg-warning-muted text-warning" : "bg-success-muted text-success"}`}>Face à previsão: {forecastRemaining < 0n ? `${format(-forecastRemaining, trip)} acima do alvo` : `restam ${format(forecastRemaining, trip)}`}. Face ao real: {actualRemaining !== null && actualRemaining < 0n ? `${format(-actualRemaining, trip)} acima do alvo` : format(actualRemaining ?? 0n, trip)}.
    </p> : null}
 {overpaid.length ? 
    <p role="status" className="mt-4 rounded-card bg-warning-muted p-4 text-sm text-warning">Aviso: {overpaid.length} custo(s) têm pagamentos líquidos acima do valor comprometido. O registo foi preservado.
    </p> : null}
 
    <div className="mt-7 flex flex-wrap gap-3">
      <Link className="rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground" href={`/trips/${trip.id}/finance/costs/new`}>Adicionar custo planeado</Link>
      <Link className="rounded-control border border-input bg-card px-5 py-2.5 text-sm font-semibold" href={`/trips/${trip.id}/finance/actuals/new`}>Registar despesa real</Link>
    </div>
 
    <section className="mt-8 grid gap-4 rounded-card border border-border bg-card md:grid-cols-2">
      <Breakdown title="Por categoria" entries={[...categories].map(([id, total]) => ({ id, label: data.categories.find(c => c.id === id)?.name ?? "Categoria", ...total }))} trip={trip}/>
      <Breakdown title="Por destino" entries={[...stops].map(([id, total]) => ({ id, label: route.stops.find(s => s.id === id)?.placeName ?? "Destino", ...total }))} trip={trip}/></section>
 
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-xl font-semibold">Custos planeados</h2>{data.costs.length ? 
      <div className="mt-4 divide-y divide-border overflow-hidden rounded-card border border-border">{data.costs.map(cost => 
        <article key={cost.id} className={`p-5 ${cost.archivedAt ? "border-border bg-surface" : "border-border bg-card"}`}>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h3 className="font-semibold">{cost.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Estimado: {cost.estimatedBaseMinor === null ? "Não definido" : format(BigInt(cost.estimatedBaseMinor), trip)} · Comprometido: {cost.committedBaseMinor === null ? "Não definido" : format(BigInt(cost.committedBaseMinor), trip)}{cost.archivedAt ? " · Arquivado" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-link">
              <Link href={`/trips/${trip.id}/finance/costs/${cost.id}/edit`}>Editar</Link>{!cost.archivedAt ? 
              <Link href={`/trips/${trip.id}/finance/payments/new?costId=${cost.id}`}>Pagamento</Link> : null}
            </div>
          </div>
        </article>)}
      </div> : 
      <p className="mt-4 rounded-card border border-dashed border-input p-6 text-muted-foreground">Ainda não existem custos planeados.</p>}
    </section>
 
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-xl font-semibold">Histórico real</h2>
      <p className="mt-2 text-sm text-muted-foreground">{data.payments.length} pagamento(s), {data.actuals.length} despesa(s) real(is) e {data.adjustments.length} ajuste(s). Despesa real não planeada: {format(totals.unplannedActual, trip)}.
      </p>
      <div className="mt-4 divide-y divide-border overflow-hidden rounded-card border border-border bg-card">{data.payments.map(p => 
        <article key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
          <div><p className="font-medium">Pagamento</p><p className="mt-1 text-muted-foreground">{p.paidOn}</p></div>
          <div className="text-right"><p className="font-semibold tabular-nums">{format(BigInt(p.baseAmountMinor), trip)}</p><Link className="mt-1 inline-block text-link hover:underline" href={`/trips/${trip.id}/finance/adjustments/new?paymentId=${p.id}`}>Registar reembolso</Link></div>
        </article>)}{data.actuals.map(a => 
        <article key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
          <div><p className="font-medium">Despesa real</p><p className="mt-1 text-muted-foreground">{a.spentOn}</p></div>
          <div className="text-right"><p className="font-semibold tabular-nums">{format(BigInt(a.baseAmountMinor), trip)}</p><Link className="mt-1 inline-block text-link hover:underline" href={`/trips/${trip.id}/finance/adjustments/new?actualId=${a.id}`}>Registar reembolso</Link></div>
        </article>)}
      </div>
    </section>
 </>
);
}
function Breakdown({ title, entries, trip }: {
    title: string;
    entries: {
        id: string;
        label: string;
        forecast: bigint;
        actual: bigint;
    }[];
    trip: Trip;
}) { return (
<article className="min-w-0 bg-card p-5 sm:p-6">
      <h2 className="font-semibold">{title}
      </h2>{entries.length ? 
      <dl className="mt-4 divide-y divide-border overflow-hidden rounded-card border border-border">{entries.map(item => 
        <div key={item.id} className="flex flex-wrap justify-between gap-3 px-4 py-3 text-sm">
          <dt>{item.label}
          </dt>
          <dd className="text-right">Prev. {format(item.forecast, trip)}
            <br />Real {format(item.actual, trip)}
          </dd>
        </div>)}
      </dl> : 
      <p className="mt-3 text-sm text-muted-foreground">Sem valores associados.</p>}
    </article>
); }
