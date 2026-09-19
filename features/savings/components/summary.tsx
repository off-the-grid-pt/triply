import Link from "next/link";
import { formatMinorUnits } from "@/features/trips/money";
import type { Trip } from "@/features/trips/types";
import { formatProgress } from "../calculations";
import type { SavingsCalculation } from "../types";
const labels = { no_target: "Sem objetivo financeiro", not_funded: "Ainda não financiada", partially_funded: "Parcialmente financiada", fully_funded: "Totalmente financiada", overfunded: "Financiada com excedente", departure_today: "Partida hoje", trip_started_or_past: "Viagem iniciada ou passada" };
const money = (value: bigint | null, trip: Trip) => value === null ? "—" : formatMinorUnits(value.toString(), trip.baseCurrency) ?? "—";
export function SavingsSummary({ trip, calculation }: {
    trip: Trip;
    calculation: SavingsCalculation;
}) {
    if (calculation.state === "no_target")
        return (
<section className="rounded-feature border border-dashed border-input bg-card p-7">
      <h2 className="text-2xl font-semibold">Ainda não existe um objetivo calculável</h2>
      <p className="mt-3 text-muted-foreground">Defina um orçamento alvo ou adicione pelo menos um custo planeado com preço para calcular o plano de poupança.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/trips/${trip.id}/edit`} className="rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Definir orçamento</Link>
        <Link href={`/trips/${trip.id}/finance/costs/new`} className="rounded-control border border-input px-5 py-2.5 text-sm font-semibold">Adicionar custo</Link>
      </div>
    </section>
);
    const basis = calculation.targetBasis === "target_budget" ? "Orçamento alvo" : "Previsão atual";
    const progressPercent = Number((calculation.progressBasisPoints ?? 0n) / 100n);
    return (
<>
    <section className="rounded-feature border border-border bg-card p-6 text-foreground sm:p-8">
      <span className="rounded-control bg-muted px-3 py-1 text-xs font-semibold">{labels[calculation.state]}
      </span>
      <p className="mt-6 text-sm text-muted-foreground">Falta financiar</p>
      <p className="mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{money(calculation.remainingMinor, trip)}
      </p>{calculation.surplusMinor && calculation.surplusMinor > 0n ? 
      <p className="mt-3 text-success">Excedente: {money(calculation.surplusMinor, trip)}
      </p> : null}
      <div className="mt-7" role="progressbar" aria-label="Progresso do financiamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
        <div className="h-2 overflow-hidden rounded-control bg-muted">
          <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }}/></div>
        <p className="mt-2 text-sm">{formatProgress(calculation.progressBasisPoints)} financiado
        </p>
      </div>
    </section>
 
    <section className="mt-4 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      <Card label={`Objetivo · ${basis}`} value={money(calculation.targetMinor, trip)}/>
      <Card label="Atualmente disponível" value={money(calculation.currentAvailableMinor, trip)}/>
      <Card label="Já pago líquido" value={money(calculation.eligiblePaidMinor, trip)}/>
      <Card label="Total financiado" value={money(calculation.totalFundedMinor, trip)}/></section>
 {calculation.state === "departure_today" ? 
    <p className="mt-6 rounded-card bg-warning-muted p-5 text-warning">A viagem começa hoje. São necessários {money(calculation.remainingMinor, trip)} hoje; não são apresentados ritmos recorrentes.
    </p> : calculation.state === "trip_started_or_past" ? 
    <p className="mt-6 rounded-card bg-muted p-5">A data de partida já passou. O resumo é mantido para contexto histórico, sem recomendações futuras.</p> : calculation.remainingMinor === 0n ? 
    <p className="mt-6 rounded-card bg-success-muted p-5 text-success">O objetivo está totalmente financiado. Não é necessário um ritmo adicional de poupança.</p> : 
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-xl font-semibold">Ritmo sugerido</h2>
      <p className="mt-2 text-sm text-muted-foreground">Recomendação indicativa para os {calculation.daysUntilDeparture} dias até à partida; não é uma transferência agendada.
      </p>
      <div className="mt-4 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
        <Card label="≈ por mês" value={money(calculation.monthlyPaceMinor, trip)}/>
        <Card label="≈ por semana" value={money(calculation.weeklyPaceMinor, trip)}/>
        <Card label="≈ por dia" value={money(calculation.dailyPaceMinor, trip)}/></div>
    </section>}
 
    <p className="mt-6 text-sm text-muted-foreground">O objetivo é {money(calculation.targetMinor, trip)} ({basis}). Tem {money(calculation.currentAvailableMinor, trip)} disponíveis e {money(calculation.eligiblePaidMinor, trip)} já pagos, totalizando {money(calculation.totalFundedMinor, trip)} financiados.
    </p></>
);
}
function Card({ label, value }: {
    label: string;
    value: string;
}) { return (
<article className="min-w-0 bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}
      </p>
      <p className="mt-2 break-words text-xl font-semibold tabular-nums">{value}
      </p>
    </article>
); }
