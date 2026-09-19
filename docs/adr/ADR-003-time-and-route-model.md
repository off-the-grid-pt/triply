# ADR-003 — Time and multi-destination route model
Status: accepted
Date: 2026-09-01

## Context
A Triply trip can cross cities, countries and timezones. Dates for stays and legs must remain coherent.

## Decision
- A trip owns an ordered collection of `stops`.
- A `travel_leg` connects adjacent route nodes (trip boundary/stop) and never represents the trip as a single origin/destination pair.
- Route order is explicit and stable.
- Reordering stops is a domain operation that validates affected leg adjacency and marks incompatible legs for review rather than silently rewriting booked transport.
- For scheduled itinerary/transport data, persist local date/time semantics together with an IANA timezone.
- Use UTC instants only where an instant is actually needed; never discard the originating local timezone.

## Consequences
- Cross-border, repeated-city and overnight routes are first-class.
- Timezone/DST behavior requires dedicated tests.
- A stop's stay interval and a leg's departure/arrival semantics remain distinct.
