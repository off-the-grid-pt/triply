import Link from "next/link";
import { notFound } from "next/navigation";
import { TripPreferencesForm } from "@/features/settings/components/forms";
import { getTripPreferenceData } from "@/features/settings/queries";
import { getOwnedTrip } from "@/features/trips/queries";
export default async function TripSettingsPage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {  
const [{ tripId }, query] = await Promise.all([params, searchParams]), [trip, preferences] = await Promise.all([getOwnedTrip(tripId), getTripPreferenceData(tripId)]); if (!trip || !preferences) notFound(); return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link href={`/trips/${tripId}`}>← Voltar à viagem</Link>
      <header className="my-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Preferências da viagem</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Definições de {trip.name}</h1></header>
      {query.saved ? <p role="status" className="mb-5 rounded-control border border-success bg-success-muted p-3 text-sm text-success">Preferências guardadas.</p> : null}<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="rounded-feature border border-border bg-card p-6 sm:p-8"><TripPreferencesForm trip={trip} preferences={preferences} /></section>

        <section className="rounded-feature border border-border bg-surface p-6"><h2 className="text-xl font-semibold">Dados gerais e gestão</h2><p className="mt-2 text-sm text-muted-foreground">Nome, datas, origem, regresso, arquivo e eliminação continuam nas superfícies canónicas da viagem.</p><div className="mt-4 flex flex-wrap gap-4"><Link href={`/trips/${tripId}/edit`} className="font-semibold underline">Editar dados da viagem</Link><Link href={`/trips/${tripId}#management-title`} className="font-semibold underline">Gerir viagem</Link></div></section>
      </div></div></main>
  );
}
