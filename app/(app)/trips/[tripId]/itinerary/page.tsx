import Link from "next/link";
import { notFound } from "next/navigation";
import { ItineraryTimeline } from "@/features/itinerary/components/timeline";
import { buildTripDays } from "@/features/itinerary/days";
import { listOwnedItinerary } from "@/features/itinerary/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { getOwnedTrip } from "@/features/trips/queries";
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
export default async function ItineraryPage({params,searchParams}:PageProps<"/trips/[tripId]/itinerary">){
 const[{tripId},query]=await Promise.all([params,searchParams]),[trip,route,items]=await Promise.all([getOwnedTrip(tripId),getOwnedRoute(tripId),listOwnedItinerary(tripId)]);if(!trip||!route||!items)notFound();
 const days=buildTripDays(trip,route.stops,items,route.legs),outside=items.filter(item=>item.tripDate<trip.startDate||item.tripDate>trip.endDate);
 return <main className="min-h-screen bg-background px-5 py-8"><div className="mx-auto max-w-4xl"><Link href={`/trips/${tripId}`} className="text-sm font-medium text-muted-foreground">← Voltar à viagem</Link><header className="my-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Itinerário diário</p><h1 className="mt-2 text-4xl font-semibold">{trip.name}</h1><p className="mt-3 text-muted-foreground">{days.length} dia(s), com horas locais, atividades flexíveis e transportes projetados da rota.</p></header>{first(query.saved)||first(query.moved)||first(query.reordered)||first(query.deleted)?<p role="status" className="mb-5 rounded-control bg-success-muted p-4 text-sm text-success">Itinerário atualizado.</p>:null}{outside.length?<section className="mb-6 rounded-card border border-warning bg-warning-muted p-5"><h2 className="font-semibold text-warning">Atividades fora das datas atuais</h2><p className="mt-1 text-sm text-warning">Foram preservadas após uma alteração da viagem. Edite cada atividade e escolha um dia válido.</p>{outside.map(item=><Link key={item.id} href={`/trips/${tripId}/itinerary/${item.id}/edit`} className="mt-3 block text-sm font-semibold underline">{item.tripDate} · {item.title}</Link>)}</section>:null}<ItineraryTimeline trip={trip} days={days}/></div></main>;
}
