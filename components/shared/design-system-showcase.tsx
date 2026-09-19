"use client";

import { useState } from "react";
import { TripDashboard } from "@/features/dashboard/components/trip-dashboard";
import type { DashboardData } from "@/features/dashboard/types";
import { TripCard } from "@/features/trips/components/trip-card";
import type { Trip } from "@/features/trips/types";
import { calculateSavingsPlan } from "@/features/savings/calculations";
import { AppShell } from "./app-shell";

const exampleTrip: Trip = {
  id: "00000000-0000-4000-8000-000000000001",
  userId: "00000000-0000-4000-8000-000000000002",
  name: "Japão, ao nosso ritmo",
  startDate: "2027-04-03", endDate: "2027-04-17",
  originLabel: "Lisboa", returnLabel: "Lisboa", travelersCount: 2,
  baseCurrency: "EUR", targetBudgetMinor: "420000", archivedAt: null,
  createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
};

const palette = [
  ["Canvas", "#111111", "bg-background"], ["Cartão", "#1a1a1a", "bg-card"],
  ["Superfície", "#181818", "bg-surface"], ["Subtil", "#202020", "bg-muted"],
  ["Primária", "#0075de", "bg-primary"], ["Texto", "#f6f5f4", "bg-foreground"],
] as const;
const panel = "rounded-card border border-border bg-card p-5 sm:p-7";
const primary = "rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground";
const exampleDashboard: DashboardData = {
  trip: exampleTrip,
  route: { status: "ready", data: { stops: [], legs: [] } },
  finance: { status: "ready", data: {
    data: { categories: [], costs: [], payments: [], actuals: [], adjustments: [] },
    totals: { estimated: 420000n, committed: 280000n, forecast: 420000n, paid: 160000n, actual: 145000n, unplannedActual: 0n },
  } },
  savings: { status: "ready", data: { record: null, calculation: calculateSavingsPlan({
    targetBudgetMinor: exampleTrip.targetBudgetMinor, forecastMinor: "420000", hasForecast: true,
    netPaidMinor: "160000", currentAvailableMinor: "80000", startDate: exampleTrip.startDate, today: "2026-09-06",
  }) } },
  itinerary: { status: "ready", data: [] },
  planning: { status: "ready", data: { reservations: [], checklist: [] } },
  documents: { status: "error" },
};

export function DesignSystemShowcase() {
  const [name, setName] = useState("Japão, ao nosso ritmo");
  const [saved, setSaved] = useState(false);
  return (<AppShell account="Triply · Biblioteca visual">
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="border-b border-border pb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Triply / Biblioteca visual</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Design system</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Um espaço calmo para planear todas as etapas. Superfícies escuras, hierarquia clara e azul para dar o próximo passo.</p>
        <p className="mt-4 text-sm text-warning">Exemplos fictícios · Os dados desta página são apenas demonstrativos.</p>
        <nav aria-label="Secções do design system" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-link">{[["fundamentos", "Fundamentos"], ["componentes", "Componentes"], ["viagem", "Viagem e rota"]].map(([id, label]) => <a key={id} href={`#${id}`} className="py-2 hover:underline">{label}</a>)}</nav>
      </header>

      <section id="fundamentos" aria-labelledby="foundations-title" className="py-9">
        <h2 id="foundations-title" className="text-2xl font-semibold">01 / Fundamentos</h2>
        <p className="mt-2 text-sm text-muted-foreground">Contraste, espaço e poucos elementos em destaque.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{palette.map(([label, value, color]) => <div key={label} className="overflow-hidden rounded-card border border-border"><div aria-hidden="true" className={`h-20 border-b border-border ${color}`} /><div className="p-3"><p className="text-sm font-medium">{label}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{value}</p></div></div>)}</div>
        <div className={`${panel} mt-6`}><p className="text-xs uppercase tracking-widest text-muted-foreground">Tipografia · Sistema / Inter quando disponível</p><p className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Cada destino, parte da história.</p><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Títulos próximos, texto com espaço para respirar e números fáceis de comparar. Uma viagem pode ter um ou muitos destinos.</p><p className="mt-5 font-mono text-sm text-muted-foreground">4 · 8 · 16 · 24 · 40 px / Raios: 4 e 12 px</p></div>
      </section>

      <section id="componentes" aria-labelledby="components-title" className="border-t border-border py-9">
        <h2 id="components-title" className="text-2xl font-semibold">02 / Componentes</h2>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <form className={panel} onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
            <h3 className="text-lg font-semibold">Formulário de exemplo</h3><p className="mt-2 text-sm text-muted-foreground">Experimente guardar. O exemplo fica apenas nesta página.</p>
            <label htmlFor="example-trip-name" className="mt-6 block text-sm font-medium">Nome da viagem</label><input id="example-trip-name" value={name} required onChange={(event) => { setName(event.target.value); setSaved(false); }} className="mt-2 w-full border border-input px-3 py-2" />
            <label htmlFor="example-invalid" className="mt-5 block text-sm font-medium">Data de fim · exemplo de erro</label><input id="example-invalid" defaultValue="" placeholder="Escolha uma data" aria-invalid="true" aria-describedby="example-invalid-help" className="mt-2 w-full border border-input px-3 py-2" /><p id="example-invalid-help" className="mt-2 text-sm text-destructive">Indique uma data de fim para a viagem.</p>
            <div className="mt-6 flex flex-wrap gap-3"><button className={primary} type="submit">Guardar exemplo</button><button type="button" onClick={() => { setName("Japão, ao nosso ritmo"); setSaved(false); }} className="rounded-control border border-input px-4 py-2.5 text-sm">Repor</button><button type="button" disabled className="rounded-control bg-muted px-4 py-2.5 text-sm text-muted-foreground">Indisponível</button></div>
            <div role="status" className="mt-4 text-sm text-success">{saved ? "Exemplo guardado." : ""}</div>
          </form>
          <div className={panel}><h3 className="text-lg font-semibold">Estados e feedback</h3><div className="mt-6 space-y-3 text-sm"><p className="rounded-control bg-success-muted p-4 text-success">Sucesso · Alterações guardadas.</p><p className="rounded-control bg-warning-muted p-4 text-warning">Atenção · Existem detalhes por completar.</p><p className="rounded-control bg-destructive-muted p-4 text-destructive">Erro · Não foi possível guardar. Tente novamente.</p><p className="rounded-control bg-muted p-4 text-muted-foreground">A carregar · A preparar o seu espaço.</p></div><div className="mt-6 rounded-control border border-dashed border-input p-5"><h4 className="font-medium">Ainda não há reservas</h4><p className="mt-2 text-sm text-muted-foreground">As reservas da viagem aparecem aqui depois de serem adicionadas.</p></div></div>
        </div>
      </section>

      <section id="viagem" aria-labelledby="trip-example-title" className="border-t border-border py-9">
        <h2 id="trip-example-title" className="text-2xl font-semibold">03 / Viagem e rota</h2><p className="mt-2 text-sm text-muted-foreground">Exemplos fictícios · Datas locais de cada destino. Valores ilustrativos em EUR.</p>
        <div className="mt-6 grid gap-5 xl:grid-cols-2"><TripCard trip={exampleTrip} today="2026-09-06" /><div className={panel}><h3 className="text-lg font-semibold">Uma viagem, vários destinos</h3><p className="mt-2 text-sm text-muted-foreground">Partida de Lisboa · Regresso a Lisboa</p><ol className="mt-6 space-y-5">{[["Tóquio", "3–8 abr. 2027", "Voo de Lisboa para Tóquio"], ["Quioto", "8–13 abr. 2027", "Comboio de Tóquio para Quioto"], ["Osaka", "13–17 abr. 2027", "Comboio de Quioto para Osaka"]].map(([city, dates, leg], index) => <li key={city} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-border text-sm text-link">{index + 1}</span><div><p className="font-medium">{city}</p><p className="text-sm text-muted-foreground">{dates}</p><p className="mt-1 text-xs text-muted-foreground">{leg}</p></div></li>)}</ol></div></div>
        <div className={`${panel} mt-5`}><h3 className="text-lg font-semibold">Orçamento com contexto</h3><p className="mt-2 text-sm text-muted-foreground">Exemplos fictícios · Alojamento e transportes · Moeda base EUR.</p><dl className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">{[["Estimado", "4 200,00 EUR"], ["Reservado / comprometido", "2 800,00 EUR"], ["Pago", "1 600,00 EUR"], ["Real", "1 450,00 EUR"]].map(([label, amount]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 text-lg font-semibold">{amount}</dd></div>)}</dl></div>
      </section>
      <section aria-labelledby="dashboard-example-title" className="border-t border-border py-9">
        <h2 id="dashboard-example-title" className="text-2xl font-semibold">04 / Visão geral da viagem</h2>
        <p className="mb-8 mt-2 text-sm text-warning">Exemplos fictícios · Demonstração do dashboard com totais ilustrativos, secções vazias e erro de documentos simulado.</p>
        <TripDashboard dashboard={exampleDashboard} today="2026-09-06" headingLevel={2} />
      </section>
      <footer className="border-t border-border py-6 text-xs text-muted-foreground">Triply · Inspirado na referência Notion dark, adaptado ao planeamento multidestino.</footer>
    </main>
  </AppShell>);
}
