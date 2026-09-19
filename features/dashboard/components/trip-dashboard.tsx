import Link from "next/link";
const travelModeLabels = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
import { documentTypeLabels } from "@/features/documents/labels";
import { formatTripDateRange } from "@/features/trips/date";
import { formatMinorUnits } from "@/features/trips/money";
import { buildAttention, countdownLabel, durationDays, financialHealth, routeContext, upcomingItinerary } from "../aggregation";
import type { DashboardData, SectionResult } from "../types";
const healthLabels = { no_budget: "Sem orçamento definido", within_budget: "Dentro do orçamento", near_budget: "Próximo do orçamento", over_budget: "Acima do orçamento" };
const money = (value: bigint | null, currency: DashboardData["trip"]["baseCurrency"]) => formatMinorUnits(value?.toString() ?? null, currency) ?? "—";
export function TripDashboard({ dashboard, today, headingLevel = 1 }: {
    dashboard: DashboardData;
    today: string;
    headingLevel?: 1 | 2;
}) {
    const Heading = headingLevel === 1 ? "h1" : "h2";
    const { trip } = dashboard;
    const route = dashboard.route.status === "ready" ? routeContext(dashboard.route.data, today) : null;
    const health = dashboard.finance.status === "ready" ? financialHealth(trip.targetBudgetMinor, dashboard.finance.data.totals) : "no_budget";
    const savings = dashboard.savings.status === "ready" ? dashboard.savings.data?.calculation ?? null : null;
    const planning = dashboard.planning.status === "ready" ? dashboard.planning.data : null;
    const documents = dashboard.documents.status === "ready" ? dashboard.documents.data : null;
    const attention = buildAttention({ trip, today, health, savings, route: dashboard.route.status === "ready" ? dashboard.route.data : null, planning, documents });
    const cta = !route?.stopCount ? { label: "Adicionar primeiro destino", href: `/trips/${trip.id}/destinations/new` } : dashboard.finance.status !== "ready" || !dashboard.finance.data.data.costs.length ? { label: "Planear orçamento", href: `/trips/${trip.id}/finance` } : dashboard.itinerary.status !== "ready" || !dashboard.itinerary.data.length ? { label: "Planear itinerário", href: `/trips/${trip.id}/itinerary/new` } : attention.length ? { label: "Rever tarefas da viagem", href: "#attention" } : { label: "Ver itinerário", href: `/trips/${trip.id}/itinerary` };
    return (
<>
    
    <header className="border-b border-border pb-8 pt-2 text-foreground">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{trip.archivedAt ? "Arquivada · " : ""}{countdownLabel(trip, today)}
          </p>
          <Heading className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{trip.name}
          </Heading>
          <p className="mt-4 text-muted-foreground">{formatTripDateRange(trip.startDate, trip.endDate)} · {durationDays(trip.startDate, trip.endDate)} dias · {trip.travelersCount} {trip.travelersCount === 1 ? "viajante" : "viajantes"}
          </p>
        </div>
        <Link href={cta.href} className="h-fit rounded-control bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{cta.label}
        </Link>
      </div>
    </header>

    
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card title="Finanças" href={`/trips/${trip.id}/finance`} result={dashboard.finance}>{dashboard.finance.status === "ready" ? <>
        <p className="font-semibold">{healthLabels[health]}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <Metric label="Orçamento" value={formatMinorUnits(trip.targetBudgetMinor, trip.baseCurrency) ?? "Não definido"}/>
          <Metric label="Previsão" value={money(dashboard.finance.data.totals.forecast, trip.baseCurrency)}/>
          <Metric label="Comprometido" value={money(dashboard.finance.data.totals.committed, trip.baseCurrency)}/>
          <Metric label="Pago" value={money(dashboard.finance.data.totals.paid, trip.baseCurrency)}/>
          <Metric label="Real" value={money(dashboard.finance.data.totals.actual, trip.baseCurrency)}/></dl></> : null}
      </Card>
      <Card title="Poupança" href={`/trips/${trip.id}/savings`} result={dashboard.savings}>{savings?.targetMinor !== null && savings ? <>
        <p className="font-semibold">{savings.state === "fully_funded" || savings.state === "overfunded" ? "Objetivo financiado" : "Progresso do financiamento"}
        </p>
        <progress aria-label="Progresso do financiamento" className="mt-4 w-full" max={10000} value={Number(savings.progressBasisPoints ?? 0n)}/>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <Metric label="Objetivo" value={money(savings.targetMinor, trip.baseCurrency)}/>
          <Metric label="Financiado" value={money(savings.totalFundedMinor, trip.baseCurrency)}/>
          <Metric label="Por financiar" value={money(savings.remainingMinor, trip.baseCurrency)}/>
          <Metric label="Ritmo mensal" value={money(savings.monthlyPaceMinor, trip.baseCurrency)}/></dl></> : dashboard.savings.status === "ready" ? 
        <p className="text-muted-foreground">Defina um orçamento ou previsão para criar um objetivo de poupança.</p> : null}
      </Card>
    </div>
    
    <section id="attention" aria-labelledby="attention-title" className="mt-6 rounded-card border border-border bg-card p-5">
      <h2 id="attention-title" className="text-base font-semibold">Precisa de atenção</h2>{attention.length ? 
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{attention.map(x => 
        <Link key={x.key} href={x.href} className="block rounded-control border-l-2 border-border bg-surface px-4 py-3 transition-colors hover:bg-muted">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{x.tier === "critical" ? "Crítico" : x.tier === "high" ? "Prioridade alta" : x.tier === "medium" ? "Prioridade média" : "Informação"}
          </p>
          <h3 className="mt-1 font-semibold">{x.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{x.detail}
          </p>
        </Link>)}
      </div> : 
      <p className="mt-3 text-muted-foreground">Nada urgente precisa da sua atenção.</p>}
    </section>
    
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card title="Rota" href={`/trips/${trip.id}/destinations/new`} result={dashboard.route}>{route?.stopCount ? <>
        <p className="break-words text-lg font-medium leading-relaxed">{[trip.originLabel, ...route.orderedStops.map(x => x.placeName), trip.returnLabel].filter(Boolean).join(" → ")}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{route.stopCount} destinos · {route.countryCount} países
        </p>
        <p className="mt-3">{route.currentStop ? `Destino atual: ${route.currentStop.placeName}` : route.nextStop ? `Próximo destino: ${route.nextStop.placeName}` : "Rota histórica"}
        </p>{route.nextLeg ? 
        <Link href={`/trips/${trip.id}/transport/${route.nextLeg.id}/edit`} className="mt-4 block rounded-card bg-surface p-3 text-sm font-semibold">Próximo transporte: {travelModeLabels[route.nextLeg.mode]} · {route.nextLeg.departureDate}{route.nextLeg.departureTime ? ` às ${route.nextLeg.departureTime}` : ""}
        </Link> : null}</> : dashboard.route.status === "ready" ? 
        <p className="text-muted-foreground">Ainda não existem destinos.</p> : null}
      </Card>
      <Card title="Próximo itinerário" href={`/trips/${trip.id}/itinerary`} result={dashboard.itinerary}>{dashboard.itinerary.status === "ready" ? upcomingItinerary(dashboard.itinerary.data, today).length ? 
        <div className="space-y-3">{upcomingItinerary(dashboard.itinerary.data, today).map(x => 
          <Link key={x.id} href={`/trips/${trip.id}/itinerary/${x.id}/edit`} className="block rounded-card bg-surface p-3">
            <strong>{x.tripDate}{x.startLocalTime ? ` · ${x.startLocalTime}` : ""}
            </strong>
            <span className="block">{x.title}
            </span>{x.timezone ? 
            <small>{x.timezone}
            </small> : null}
          </Link>)}
        </div> : 
        <p className="text-muted-foreground">Não existem atividades futuras planeadas.</p> : null}
      </Card>
    </div>
    
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <Card title="Reservas" href={`/trips/${trip.id}/planning`} result={dashboard.planning}>{planning ? 
        <p>{planning.reservations.filter(x => x.status === "booked" && !x.archivedAt).length} reservadas · {planning.reservations.filter(x => x.status === "planned" && !x.archivedAt).length} planeadas · {planning.reservations.filter(x => x.needsReview && !x.archivedAt).length} por rever
        </p> : null}
      </Card>
      <Card title="Checklist" href={`/trips/${trip.id}/planning`} result={dashboard.planning}>{planning ? <>
        <p>{planning.checklist.filter(x => x.isCompleted).length} de {planning.checklist.length} concluídas
        </p>{planning.checklist.length ? 
        <progress aria-label="Progresso da checklist" className="mt-4 w-full" max={planning.checklist.length} value={planning.checklist.filter(x => x.isCompleted).length}/> : null}</> : null}
      </Card>
      <Card title="Documentos" href={`/trips/${trip.id}/documents`} result={dashboard.documents}>{documents?.length ? 
        <p>{documents.length} registos · {documents.filter(x => x.attachmentPath).length} com ficheiro
          <br />
          <span className="text-sm text-muted-foreground">{documents.slice(0, 2).map(x => documentTypeLabels[x.type]).join(" · ")}
          </span>
        </p> : dashboard.documents.status === "ready" ? 
        <p className="text-muted-foreground">Ainda não existem documentos.</p> : null}
      </Card>
    </div>
    </>
);
}
function Card<T>({ title, href, result, children }: {
    title: string;
    href: string;
    result: SectionResult<T>;
    children: React.ReactNode;
}) { return (
<section className="min-w-0 rounded-card border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}
        </h2>
        <Link href={href} className="text-sm font-medium text-link hover:underline">Abrir</Link>
      </div>
      <div className="mt-4">{result.status === "error" ? 
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar esta secção. Tente novamente.</p> : children}
      </div>
    </section>
); }
function Metric({ label, value }: {
    label: string;
    value: string;
}) { return (
<div>
      <dt className="text-xs text-muted-foreground">{label}
      </dt>
      <dd className="mt-1 break-words text-xl font-semibold tabular-nums">{value}
      </dd>
    </div>
); }
