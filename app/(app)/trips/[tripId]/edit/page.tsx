import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TripForm } from "@/features/trips/components/trip-form";
import { minorUnitsToInput } from "@/features/trips/money";
import { getOwnedTrip } from "@/features/trips/queries";
import { tripIdSchema } from "@/features/trips/schemas";

export default async function EditTripPage({ params }: PageProps<"/trips/[tripId]/edit">) {
  const { tripId } = await params;
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const trip = await getOwnedTrip(tripId);
  if (!trip) notFound();
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href={`/trips/${trip.id}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">← Voltar à viagem</Link>
    <header className="my-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Editar viagem</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">{trip.name}</h1><p className="mt-4 leading-7 text-muted-foreground">Altere apenas o necessário. Os restantes dados serão preservados.</p></header>
    <section className="rounded-feature border border-border bg-card p-6 shadow-sm sm:p-8"><TripForm mode="edit" tripId={trip.id} initialValues={{ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, originLabel: trip.originLabel ?? "", returnLabel: trip.returnLabel ?? "", travelersCount: String(trip.travelersCount), baseCurrency: trip.baseCurrency, targetBudget: minorUnitsToInput(trip.targetBudgetMinor, trip.baseCurrency), createRequestId: randomUUID() }} /></section>
  </div></main>;
}
