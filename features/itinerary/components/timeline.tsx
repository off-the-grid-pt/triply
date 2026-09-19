import Link from "next/link";
const travelModeLabels = { plane: "Avião", train: "Comboio", bus: "Autocarro", car: "Carro", ferry: "Ferry", other: "Outro" };
import type { Trip } from "@/features/trips/types";
import type { TripDay } from "../days";
import { overlappingItemIds } from "../days";
import { ItemActions } from "./item-actions";
export function ItineraryTimeline({ trip, days }: {
    trip: Trip;
    days: TripDay[];
}) { return (
<div className="space-y-8">{days.map((day, index) => { const overlaps = overlappingItemIds(day.items);
    const untimed = day.items.filter(item => !item.startLocalTime);
    const untimedIds = untimed.map(item => item.id); return (
<section key={day.date} id={`day-${day.date}`} className="relative scroll-mt-5 border-l border-border pl-5 sm:pl-8">
        <span aria-hidden="true" className="absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full border border-primary bg-background text-[10px] font-semibold text-link">{index + 1}</span>
        <header className="flex flex-wrap justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-link">Dia {index + 1}{day.isTransition ? " · Transição" : ""}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`))}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{day.stops.length ? day.stops.map(s => s.placeName).join(" · ") : "Sem destino associado"}
            </p>
          </div>
          <Link href={`/trips/${trip.id}/itinerary/new?date=${day.date}`} className="h-fit rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Adicionar atividade</Link>
        </header>{day.legs.map(leg => 
        <article key={leg.id} className="mt-4 rounded-card border border-border bg-surface p-4 text-sm">
          <p className="font-semibold">Transporte · {travelModeLabels[leg.mode]}
          </p>
          <p>{leg.departureDate === day.date ? `${leg.departureTime ?? "Hora flexível"}${leg.departureTimezone ? ` · ${leg.departureTimezone}` : ""}` : "Chegada neste dia"}
          </p>
          <Link href={`/trips/${trip.id}/transport/${leg.id}/edit`} className="mt-2 inline-block font-semibold underline">Editar transporte</Link>
        </article>)}{day.items.length ? 
        <div className="mt-4 space-y-3">{day.items.map(item => 
          <article key={item.id} className={`rounded-card border p-4 ${item.status === "needs_review" ? "border-warning bg-warning-muted" : "border-border bg-card"}`}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.startLocalTime ? `${item.startLocalTime}${item.endLocalTime ? `–${item.endLocalTime}` : ""}` : "A qualquer hora"}{item.timezone ? ` · ${item.timezone}` : ""}
                </p>
                <h3 className="mt-1 font-semibold">{item.title}
                </h3>{item.placeName ? 
                <p className="text-sm text-muted-foreground">{item.placeName}
                </p> : null}{item.notes ? 
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}
                </p> : null}{overlaps.has(item.id) ? 
                <p className="mt-2 text-sm font-medium text-warning">Possível sobreposição com outra atividade.</p> : null}{item.status === "needs_review" ? 
                <p className="mt-2 text-sm font-medium text-warning">Rever associação após alteração da viagem ou rota.</p> : null}
              </div>
              <Link className="text-sm font-medium text-link hover:underline" href={`/trips/${trip.id}/itinerary/${item.id}/edit`}>Editar</Link>
            </div>
            <ItemActions tripId={trip.id} itemId={item.id} currentDate={day.date} startDate={trip.startDate} endDate={trip.endDate} untimedIds={untimedIds} index={item.startLocalTime ? -1 : untimedIds.indexOf(item.id)}/>
          </article>)}
        </div> : 
        <p className="mt-5 rounded-card border border-dashed border-input p-5 text-sm text-muted-foreground">Sem atividades. Adicione uma atividade com hora ou mantenha-a flexível.</p>}
      </section>
); })}
    </div>
); }
