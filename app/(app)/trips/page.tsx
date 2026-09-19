import Link from "next/link";
import { TripCard } from "@/features/trips/components/trip-card";
import { TripsPageHeader } from "@/features/trips/components/page-header";
import { StatusMessage } from "@/features/trips/components/status-message";
import { sortActiveTrips, todayInLisbon } from "@/features/trips/lifecycle";
import { getTripPageIdentity, listOwnedTrips } from "@/features/trips/queries";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TripsPage({ searchParams }: PageProps<"/trips">) {
  const [trips, identity, query] = await Promise.all([listOwnedTrips(), getTripPageIdentity(), searchParams]);
  const today = todayInLisbon();
  const activeTrips = sortActiveTrips(trips.filter((trip) => trip.archivedAt === null), today);
  const archivedTrips = trips.filter((trip) => trip.archivedAt !== null).sort((left, right) => (right.archivedAt ?? "").localeCompare(left.archivedAt ?? ""));
  const status = firstValue(query.archived) ? "archived" : firstValue(query.deleted) ? "deleted" : undefined;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <TripsPageHeader identity={identity} />
        <div className="mt-8"><StatusMessage kind={status} /></div>
        {trips.length === 0 ? <section className="flex min-h-[65vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-feature border border-border bg-card p-8 text-center sm:p-12"><div aria-hidden="true" className="mx-auto mb-8 flex size-14 items-center justify-center rounded-card border border-border text-2xl text-muted-foreground">↗</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">O mundo está à sua espera</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Ainda não tem viagens.</h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground">Crie o espaço da sua viagem agora. Depois poderá adicionar todos os destinos pela ordem certa.</p>
            <Link href="/trips/new" className="mt-8 inline-flex rounded-control bg-primary hover:bg-primary-hover px-6 py-3 text-sm font-semibold text-primary-foreground">Criar primeira viagem</Link>
          </div>
        </section> : <div className="py-10">
          <section aria-labelledby="active-trips-title">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium text-muted-foreground">Planeie. Organize. Parta.</p><h1 id="active-trips-title" className="mt-2 text-3xl font-semibold tracking-tight">As suas viagens</h1></div><p className="text-sm text-muted-foreground">{activeTrips.length} {activeTrips.length === 1 ? "viagem ativa" : "viagens ativas"}</p></div>
            {activeTrips.length === 0 ? <div className="mt-6 rounded-card border border-dashed border-border bg-card p-8 text-center"><p className="text-muted-foreground">Não existem viagens ativas. Pode restaurar uma viagem arquivada ou criar uma nova.</p><Link href="/trips/new" className="mt-4 inline-flex rounded-control bg-primary hover:bg-primary-hover px-5 py-2.5 text-sm font-semibold text-primary-foreground">Criar viagem</Link></div> : <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} today={today} />)}</div>}
          </section>
          <section aria-labelledby="archived-trips-title" className="mt-14 border-t border-border pt-10">
            <h2 id="archived-trips-title" className="text-2xl font-semibold tracking-tight">Arquivadas</h2><p className="mt-2 text-sm text-muted-foreground">Continuam privadas e podem ser restauradas ou eliminadas.</p>
            {archivedTrips.length === 0 ? <p className="mt-6 rounded-card bg-muted p-5 text-sm text-muted-foreground">Não existem viagens arquivadas.</p> : <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{archivedTrips.map((trip) => <TripCard key={trip.id} trip={trip} today={today} />)}</div>}
          </section>
        </div>}
      </div>
    </main>
  );
}
