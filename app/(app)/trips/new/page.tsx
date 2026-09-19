import { randomUUID } from "node:crypto";
import Link from "next/link";
import { TripForm } from "@/features/trips/components/trip-form";
import { getDefaultTripCurrency } from "@/features/trips/queries";

export default async function NewTripPage() {
  const currency = await getDefaultTripCurrency();
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/trips" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Voltar às viagens</Link>
    <header className="my-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nova viagem</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Comece pelo essencial.</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Defina o período e as preferências gerais. Os destinos serão adicionados depois, sem limitar a viagem a uma única cidade.</p></header>
    <section className="rounded-feature border border-border bg-card p-6 shadow-sm sm:p-8"><TripForm mode="create" initialValues={{ name: "", startDate: "", endDate: "", originLabel: "", returnLabel: "", travelersCount: "1", baseCurrency: currency, targetBudget: "", createRequestId: randomUUID() }} /></section>
  </div></main>;
}
