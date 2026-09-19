# PRODUCT SPEC — Triply MVP
Version: 0.1
Status: APPROVED
Locale: pt-PT default

## Product statement
Triply helps people plan the financial and logistical structure of a trip in one place, especially trips with multiple cities or countries.

## Core problem
Travel planning is fragmented across notes, spreadsheets, booking apps, email and maps. Users struggle to know the real expected cost, how much they still need to save, what is already booked/paid and what happens each day.

## MVP outcomes
A user can create a trip, build an ordered multi-destination route, estimate and track costs, calculate savings needs, build a daily itinerary, track reservations/checklists/documents and compare planned versus actual spend from a central dashboard.

## Core domain
`Trip` is the aggregate root. A trip contains an ordered set of `Stop` records and `TravelLeg` records. It is not limited to A→B or round trips.

## MVP modules
01 Authentication & onboarding
02 Trips
03 Destinations & travel legs
04 Budget & expenses
05 Savings plan
06 Daily itinerary
07 Reservations & checklists
08 Documents
09 Dashboard
10 Settings & trip preferences

## Out of MVP
Automatic flight/hotel booking, live inventory, social network, group expense settlement, AI destination recommendations, automatic bank sync, automatic live FX unless separately approved.
