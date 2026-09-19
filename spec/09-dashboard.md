# SPEC — Module 09: Dashboard

Version: 1.0  
Status: APPROVED
Module ID: `09-dashboard`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `spec/03-destinations-legs.md`, `spec/04-budget-expenses.md`, `spec/05-savings-plan.md`, `spec/06-itinerary.md`, `spec/07-reservations-checklists.md`, `spec/08-documents.md`, `AGENTS.md`  
Primary handoff: Module 10 — Settings & Trip Preferences

---

## 1. Purpose

Give the traveller one reliable, actionable overview of a Trip without creating a second source of truth for any domain.

The Dashboard must answer, at a glance:

> Where does this trip stand right now, what is coming next, what still needs attention, and am I financially on track?

The Dashboard is an **aggregation and prioritization layer**. It may summarize, rank, filter and link to domain data, but it must not redefine the business rules owned by Trips, Route, Finance, Savings, Itinerary, Reservations, Checklists or Documents.

---

## 2. Product outcomes

When this module is complete, the authenticated Trip owner can:

1. open a Trip and immediately understand its current planning state;
2. see the Trip name, date range, duration, traveller count and countdown/state;
3. see the multidestination route in canonical Stop order;
4. see a compact financial summary using Module 04 calculations;
5. see savings/funding progress using Module 05 calculations;
6. see the next relevant itinerary items and Travel Legs;
7. see reservation items that need attention;
8. see incomplete or overdue checklist tasks;
9. see document warnings such as missing files or upcoming expiry;
10. navigate directly from each dashboard section to the owning module;
11. distinguish empty, ready, warning and error states clearly;
12. use the dashboard before the Trip, during the Trip and after the Trip;
13. receive useful summaries even when the Trip is only partially planned;
14. view the dashboard comfortably on mobile without losing critical information.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can view the Dashboard for Trips they own.

### 3.2 Authenticated non-owner

Cannot view, infer, aggregate or access another user's Trip dashboard data.

### 3.3 Visitor

Cannot access a private Trip Dashboard.

---

## 4. Scope

### Included

- Trip header/overview;
- countdown or lifecycle label;
- route summary;
- Stop count / country count / duration summary;
- financial overview;
- savings progress overview;
- next itinerary items;
- next Travel Leg;
- reservations requiring attention;
- checklist progress and urgent tasks;
- document warning summary;
- prioritized `Needs attention` area;
- deep links to owning modules;
- empty/loading/error/partial-data states;
- mobile-first responsive behavior;
- owner-only access;
- deterministic aggregation rules;
- acceptance scenarios for all dashboard surfaces.

### Out of scope for MVP

- editing domain data directly inside dashboard cards beyond simple navigation;
- drag-and-drop dashboard customization;
- user-configurable widgets;
- AI recommendations;
- destination recommendations;
- automatic itinerary optimization;
- real-time flight/train status;
- live weather;
- live exchange rates;
- maps requiring external map providers;
- social sharing;
- collaborative dashboards;
- notifications by email/push;
- analytics dashboards across all users;
- global personal-finance dashboard outside a Trip;
- exporting the dashboard to PDF;
- home-screen widgets for mobile OS;
- arbitrary custom KPIs.

---

## 5. Core product principle — no duplicated business truth

The Dashboard MUST NOT own canonical calculations.

Examples:

- `forecast` comes from Module 04;
- `paid` comes from Module 04;
- `actual` comes from Module 04;
- `remaining budget` comes from Module 04;
- `savings target`, `funded`, `remaining to fund` and saving pace come from Module 05;
- Stop order and next Travel Leg come from Module 03;
- itinerary timing comes from Module 06;
- reservation lifecycle comes from Module 07;
- checklist overdue/completed state comes from Module 07;
- document expiry/missing-file state comes from Module 08.

The Dashboard may cache or materialize read models for performance only if Architecture documents invalidation/refresh behavior. Such read models remain non-canonical and rebuildable from module-owned source data.

Any dashboard-specific calculation that changes the semantic meaning of module data is prohibited.

---

## 6. Dashboard context

The primary Dashboard is **Trip-specific**.

The user enters one Trip and sees its dashboard.

A future cross-Trip home screen may exist, but it is not part of this module unless explicitly added by another approved spec.

The Dashboard URL/route must identify a Trip owned by the authenticated user.

---

## 7. Trip header

The Dashboard header must show, when available:

- Trip name;
- start date;
- end date;
- duration in calendar days;
- traveller count;
- lifecycle state/countdown;
- optional route summary;
- primary action appropriate to planning state.

### 7.1 Countdown behavior

Before departure:

```text
Starts in N days
```

On the start date:

```text
Starts today
```

During the Trip:

```text
Day X of Y
```

After the end date:

```text
Trip completed
```

Archived status, when manually archived, must be displayed independently from date-derived lifecycle text.

### 7.2 Duration

Trip duration uses the inclusive date range defined by Module 02.

Example:

```text
10 Sep → 24 Sep = 15 calendar days
```

The Dashboard must not create a competing duration formula.

---

## 8. Planning-stage primary action

The Dashboard may expose one context-sensitive primary CTA based on the most important missing structural element.

Recommended deterministic priority:

1. if Trip has no Stops → `Add first destination`;
2. else if no financial plan exists → `Plan budget`;
3. else if itinerary is empty → `Plan itinerary`;
4. else if there are urgent checklist/document issues → `Review trip tasks`;
5. otherwise → `View itinerary`.

This CTA is navigational; it does not mutate domain data.

Architecture/Frontend must not invent an AI-generated CTA priority.

---

## 9. Route summary

The Dashboard must represent the canonical route from Module 03.

Example:

```text
Lisbon → Paris → Brussels → Amsterdam → Berlin → Prague → Lisbon
```

Where origin/return boundaries are available, they may be displayed visually with Stops, but must not be converted into Stops.

### 9.1 Required route information

At minimum:

- ordered Stop names;
- country context where needed;
- Stop count;
- unique country count;
- next Stop when determinable;
- next Travel Leg when determinable.

### 9.2 Unique country count

Country count is based on unique countries represented by Stops only.

Origin/return boundaries do not increase the Trip country count unless they are also actual Stops.

Repeating the same country across multiple Stops counts once.

### 9.3 Route empty state

If no Stops exist:

- do not fabricate a route;
- show a clear empty state;
- primary action points to Module 03 destination creation.

---

## 10. Current and next location context

The Dashboard may identify a current/next Stop using Trip dates and Stop dates.

### Before the Trip

- `Next destination` = first Stop in canonical order.

### During the Trip

- `Current destination` = Stop whose local stay date range contains the current date, when unambiguous;
- if the current date falls in an allowed gap, show `Between destinations` or equivalent rather than guessing;
- `Next destination` = next Stop after the current route position.

### After the Trip

No `next destination` is required unless useful as historical route context.

Timezone-sensitive determination must follow ADR-003 and Module 03 rules.

---

## 11. Financial overview

The financial section must consume canonical Module 04 summaries.

Recommended visible values:

- Target Budget, if defined;
- Current Forecast;
- Committed;
- Paid;
- Actual;
- Remaining Budget / budget variance, when meaningful.

The UI does not need to show every metric at equal prominence. The Design Agent may prioritize based on lifecycle while preserving access to the values.

### 11.1 Before the Trip

Primary emphasis:

- Target Budget;
- Forecast;
- Paid;
- Remaining against target.

### 11.2 During the Trip

Primary emphasis may shift to:

- Actual;
- Paid;
- remaining/variance;
- forecast vs actual.

### 11.3 After the Trip

Primary emphasis may shift to:

- final Actual;
- Target Budget;
- variance;
- forecast vs actual.

This is presentation priority only. Financial definitions never change by lifecycle.

---

## 12. Financial health state

The Dashboard may display a concise financial status derived exclusively from Module 04 values.

Recommended states:

- `No budget yet`;
- `Within budget`;
- `Near budget`;
- `Over budget`.

For MVP, `Near budget` is informational and may use a presentation threshold of **90% of Target Budget**.

Rules:

- if Target Budget is undefined, do not label a Trip over/under budget;
- if forecast or actual exceeds Target Budget, `Over budget` may be shown;
- warning never blocks Trip usage;
- exact threshold must be centralized and testable, not duplicated in multiple frontend components.

---

## 13. Savings/funding overview

The Dashboard must consume Module 05's canonical Savings Plan output.

Recommended values:

- Savings Target basis;
- Total Funded;
- Remaining to Fund;
- Funding Progress %;
- recommended monthly saving pace before departure.

The Dashboard must not reconstruct these values from Payments or available-funds inputs.

### 13.1 No savings target

If neither Target Budget nor usable Forecast exists:

- show a safe empty state;
- point to financial planning;
- do not display `0% funded` as if the target were zero.

### 13.2 Fully funded

If Module 05 says fully funded or overfunded:

- show that state positively but neutrally;
- do not imply funds are actually present in a bank account;
- do not give investment or financial advice.

---

## 14. Next itinerary items

The Dashboard should show a compact list of upcoming/relevant itinerary entries from Module 06.

Recommended maximum visible items: **3** on the Dashboard before a `View full itinerary` action.

### 14.1 Before the Trip

Show the earliest upcoming scheduled or unscheduled items near the Trip start, if available.

### 14.2 During the Trip

Priority:

1. remaining items today;
2. next Travel Leg appearing in itinerary context;
3. early items tomorrow if no more items remain today.

### 14.3 After the Trip

This section may show recent/completed historical itinerary context or collapse behind `View itinerary`. It should not pretend there are upcoming events.

### 14.4 Unscheduled items

Unscheduled items may be shown, but scheduled upcoming items take precedence.

---

## 15. Next Travel Leg

The Dashboard may feature the next active canonical Travel Leg separately from general itinerary items because inter-destination movement is operationally important.

Display when available:

- origin;
- destination;
- mode;
- local departure date/time;
- local arrival date/time when available;
- booking status metadata if attached through Module 07.

Cancelled legs are never selected as the next active leg.

Completed/past legs are not selected before a future active leg.

The Dashboard does not alter Travel Leg lifecycle.

---

## 16. Reservation summary

The Dashboard must summarize Module 07 Reservations without defining payment truth.

Recommended metrics:

- number planned/not yet booked;
- number booked;
- reservation issues needing review;
- next dated reservation.

### 16.1 Reservation `needs attention`

A Reservation may appear in `Needs attention` when canonical data indicates, for example:

- status is `planned` and its relevant date is approaching;
- an associated route/Stop relationship requires review after route change;
- a booking is cancelled but related planning still needs user action;
- another explicit Module 07 review state exists.

The Dashboard must not infer `unpaid reservation` merely from Reservation status. Payment state comes from Module 04 relationships.

---

## 17. Checklist summary

The Dashboard must consume Module 07 checklist state.

Recommended summary:

- completed / total;
- overdue count;
- due soon count;
- up to 3 priority incomplete tasks.

### 17.1 Due soon

For Dashboard presentation, `due soon` is:

```text
not completed AND due date within the next 7 calendar days
```

This threshold is dashboard presentation logic and must be centralized/tested.

Overdue tasks always rank above due-soon tasks.

Tasks without due dates rank below dated urgent tasks.

---

## 18. Document summary

The Dashboard must consume Module 08 document metadata only; it must not download private file bytes to build the summary.

Recommended metrics/warnings:

- expired documents;
- documents expiring soon;
- records marked missing / without required file according to Module 08 state;
- documents requiring review.

### 18.1 Priority

Recommended severity:

1. expired;
2. expires during Trip;
3. expiring within Module 08 warning window;
4. missing file / incomplete record;
5. informational.

The Dashboard must use Module 08's canonical expiry logic. It must not calculate legal travel eligibility.

---

## 19. `Needs attention` section

The Dashboard should provide one consolidated list of the most important actionable issues across domains.

It is a **presentation queue**, not a new task database.

No dashboard-owned `attention_item` persistence is required for MVP.

### 19.1 Eligible sources

- overdue checklist tasks;
- expired/expiring document warnings;
- route or Reservation review states;
- over-budget state;
- insufficient funding state near departure;
- planned Reservations approaching their relevant date;
- other explicitly approved module warnings.

### 19.2 Priority model

Recommended deterministic priority tiers:

**Critical attention**

- expired document relevant to the Trip;
- route/booking state that is explicitly invalid or requires review;
- other module-defined blocking correctness state.

**High attention**

- overdue checklist task;
- document expiring during the Trip;
- over-budget state;
- departure within 7 days with remaining funding > 0;

**Medium attention**

- checklist due within 7 days;
- planned Reservation with relevant date within 14 days;
- document inside standard expiry warning window;

**Low/informational**

- non-urgent incomplete planning;
- general empty-state suggestions.

Within a tier, earliest relevant date sorts first. Stable deterministic fallback sorting is required.

### 19.3 Limit

Show up to **5** items in the primary Dashboard list with `View all`/deep links where appropriate.

The Dashboard must not duplicate the same underlying issue multiple times.

---

## 20. Funding urgency warning

The Dashboard may surface a funding warning only from Module 05 data.

Recommended rule:

- Trip has not started;
- departure is within 7 calendar days;
- `remaining to fund > 0`.

Example:

```text
€420 still to fund · 5 days until departure
```

This is an advisory warning, not financial advice and never blocks the user.

---

## 21. Dashboard sections and recommended order

Default desktop information hierarchy:

1. Trip header / countdown;
2. Needs attention, only when non-empty;
3. Financial + Savings overview;
4. Route / next movement;
5. Upcoming itinerary;
6. Reservations;
7. Checklist;
8. Documents.

On mobile, the Design Agent may reorder for usability, but `Needs attention`, next movement and financial state must remain easy to reach.

The Design Agent can merge visually compatible cards, but cannot merge domain ownership or calculations.

---

## 22. Empty states

The Dashboard must remain useful for a newly created Trip.

### 22.1 Trip with no Stops

Show:

- Trip header;
- countdown;
- `Add first destination` CTA;
- financial setup CTA if appropriate;
- other sections as empty or omitted intentionally.

### 22.2 Stops exist, no finance data

Show route normally and a financial empty state pointing to Module 04.

### 22.3 Finance exists, no itinerary

Show finance/savings and an itinerary planning CTA.

### 22.4 No reservations/checklist/documents

Do not display alarming zeros such as `0 documents ready` without context.

Use neutral empty states.

### 22.5 Fully planned Trip with no attention items

Show a positive neutral state such as:

```text
Nothing urgent needs your attention.
```

Avoid gamified or exaggerated language.

---

## 23. Partial failure behavior

The Dashboard aggregates several domains and must degrade gracefully.

If one section fails to load:

- other successfully loaded sections remain usable;
- the failed section shows a scoped retry state;
- never replace the whole Dashboard with a generic failure unless Trip authorization/core Trip data itself cannot load;
- do not silently substitute stale or zero values.

Example:

- itinerary query fails;
- finance and route still render;
- itinerary card shows `Could not load itinerary` + retry.

---

## 24. Loading behavior

The Dashboard must avoid misleading transient zeros.

During loading:

- use skeleton/loading states;
- do not render `€0`, `0 tasks`, `0% funded` before data is known;
- section-level loading is preferred when architecture allows independent requests;
- layout shift should be minimized.

---

## 25. Refresh and consistency

After a mutation in an owning module, returning to the Dashboard must show updated data without requiring a manual hard refresh.

Architecture must define one consistent strategy such as:

- server revalidation;
- query invalidation;
- event-driven refresh;
- rebuildable read model refresh.

No card may remain knowingly stale after a successful user mutation within the same active session beyond the architecture-defined consistency window.

---

## 26. Deep-link behavior

Every actionable Dashboard summary must link to the owning module.

Examples:

- budget warning → Budget & Expenses;
- savings warning → Savings Plan;
- next Travel Leg → Route/Travel Leg detail;
- itinerary item → relevant itinerary day;
- overdue task → Checklist;
- expiring passport record → Documents;
- planned hotel → Reservations.

The Dashboard itself is not the primary editing surface for these domains.

---

## 27. Money presentation

All financial dashboard amounts use the Trip base currency unless explicitly showing an original source amount for context.

Formatting must follow the currency rules from ADR-002 and Module 04.

Never mix values from different currencies into an unlabeled sum.

No client-side floating-point business arithmetic is allowed where Module 04 already provides canonical values.

---

## 28. Time and timezone presentation

Trip dates use the approved Trip date model.

Activity and Travel Leg times use their canonical local timezone context from Modules 03/06.

The Dashboard must not convert all itinerary/transport times to the user's current device timezone by default.

When ambiguity is possible, show location/timezone context.

---

## 29. Archived Trips

An archived Trip Dashboard remains readable.

Rules:

- show `Archived` clearly;
- preserve historical summaries;
- avoid planning urgency copy that implies active preparation;
- destructive behavior remains owned by Module 02;
- the user can navigate historical itinerary, costs and documents according to owning-module rules.

---

## 30. Past Trips

A past Trip that is not archived remains accessible.

Dashboard presentation may shift toward historical summary:

- final/available Actual spend;
- budget variance;
- completed route;
- itinerary history;
- reservation history;
- checklist/document summaries.

Do not auto-archive it.

---

## 31. Security and privacy

### 31.1 Authorization

Every Dashboard query/read model must enforce Trip ownership.

A user cannot obtain another Trip's aggregated values by guessing IDs.

### 31.2 Data minimization

Dashboard document cards must never expose:

- private storage paths;
- document file bytes;
- unnecessary identity fields;
- signed URLs unless the user intentionally opens/downloads a document through Module 08.

### 31.3 Error privacy

Unauthorized and nonexistent Trip access must not leak whether private records exist.

### 31.4 Logs

Do not log private document metadata, booking codes, sensitive notes or signed URLs as part of dashboard aggregation diagnostics.

---

## 32. Performance requirements

The Dashboard must be designed to avoid N+1 query patterns across Stops, Finance, Itinerary, Reservations, Checklists and Documents.

Architecture must document the aggregation strategy.

Targets for MVP under normal development/test data:

- initial meaningful Dashboard content should not require dozens of sequential network requests;
- route/financial/attention summaries should be obtainable through bounded query patterns;
- rendering 60-day Trips and large checklists must remain responsive;
- private document attachments are never fetched merely to render the Dashboard.

No exact production latency SLA is imposed in this product spec, but obvious N+1 or full-file-fetch designs fail Architecture/QA review.

---

## 33. Accessibility requirements

Dashboard must:

- work with keyboard navigation;
- expose semantic headings for major sections;
- not rely on colour alone for warning/positive states;
- use accessible progress semantics for funding/checklist progress;
- provide text labels for icon-only actions;
- preserve logical focus order on mobile and desktop;
- meet the project accessibility baseline defined in `AGENTS.md`.

Charts are optional in MVP. If used, equivalent textual values are mandatory.

---

## 34. Mobile requirements

On small screens:

- key metrics remain readable without horizontal scrolling;
- route summary can collapse/scroll in a controlled accessible pattern;
- urgent items appear before low-priority historical sections;
- cards must not depend on hover;
- primary actions remain touch-friendly;
- itinerary/transport times must not truncate essential location/time data;
- financial values must handle large formatted amounts without breaking layout.

---

## 35. Recommended domain read contract

Architecture may choose implementation detail, but conceptually the Dashboard needs a read response equivalent to:

```text
TripDashboard
  tripSummary
  routeSummary
  financialSummary
  savingsSummary
  nextTravelLeg
  upcomingItinerary[]
  reservationSummary
  checklistSummary
  documentSummary
  attentionItems[]
```

Each nested summary should retain explicit domain provenance and should be rebuildable from canonical module data.

This is not a mandated database schema.

---

## 36. No new canonical database entities required

The Dashboard does not require a canonical `dashboards`, `dashboard_cards` or `attention_items` table for MVP.

Architecture may introduce a non-canonical materialized/read-model table only if justified for performance and accompanied by:

- rebuild strategy;
- invalidation rules;
- ownership isolation;
- stale-data behavior;
- tests proving it cannot diverge silently from source truth.

Default recommendation: aggregate from canonical data without persistent dashboard-owned business entities.

---

## 37. Analytics

Product analytics are optional and must not block the MVP.

If analytics exist, useful privacy-conscious events may include:

- dashboard_viewed;
- dashboard_section_opened;
- attention_item_opened;
- dashboard_primary_cta_clicked.

Do not send private document titles, booking references, financial notes or detailed itinerary text as analytics properties.

---

## 38. Acceptance scenarios

### AC-09-01 — Newly created Trip

**DADO** uma Trip válida sem Stops, finanças ou itinerário  
**QUANDO** o proprietário abre o Dashboard  
**ENTÃO** vê o cabeçalho/countdown e um CTA claro para adicionar o primeiro destino  
**E** não vê métricas falsas em zero.

### AC-09-02 — Multi-destination route

**DADO** uma Trip com Paris, Brussels, Amsterdam, Berlin e Prague  
**QUANDO** o Dashboard carrega a rota  
**ENTÃO** os Stops aparecem na ordem canónica do Módulo 03  
**E** a Dashboard não reordena nem deduz uma rota alternativa.

### AC-09-03 — Repeated country count

**DADO** dois Stops em França e um Stop na Bélgica  
**QUANDO** o Dashboard calcula o resumo visual de países  
**ENTÃO** mostra 2 países, não 3.

### AC-09-04 — Origin is not a Stop count

**DADO** origem Lisboa e Stops Paris/Brussels  
**QUANDO** o Dashboard mostra número de destinos  
**ENTÃO** conta apenas 2 Stops.

### AC-09-05 — Pre-trip countdown

**DADO** uma Trip futura  
**QUANDO** faltam 23 dias para a data de início  
**ENTÃO** o Dashboard mostra `Starts in 23 days` ou copy equivalente.

### AC-09-06 — Trip starts today

**DADO** a data de início igual à data corrente aplicável  
**QUANDO** o Dashboard abre  
**ENTÃO** mostra `Starts today` ou equivalente.

### AC-09-07 — During-trip day number

**DADO** uma Trip de 15 dias em curso  
**QUANDO** o utilizador está no 6.º dia  
**ENTÃO** mostra `Day 6 of 15` ou equivalente com cálculo inclusivo correto.

### AC-09-08 — Past Trip

**DADO** uma Trip cuja data final passou  
**QUANDO** o Dashboard abre  
**ENTÃO** mostra contexto histórico/completed  
**E** não arquiva automaticamente a Trip.

### AC-09-09 — Canonical forecast

**DADO** Module 04 reporta Forecast €2,640  
**QUANDO** o Dashboard mostra Forecast  
**ENTÃO** mostra exatamente €2,640 segundo formatação canónica  
**E** não recalcula a partir de itens no frontend.

### AC-09-10 — Target budget undefined

**DADO** uma Trip sem Target Budget  
**QUANDO** o Dashboard mostra a saúde financeira  
**ENTÃO** não classifica a Trip como dentro/fora do orçamento.

### AC-09-11 — Over budget

**DADO** Target Budget €2,500 e Forecast €2,700  
**QUANDO** o Dashboard carrega  
**ENTÃO** pode mostrar `Over budget`  
**E** a navegação/uso da Trip continua disponível.

### AC-09-12 — Near budget

**DADO** Target Budget definido e consumo/forecast no limiar centralizado de 90% sem ultrapassar o limite  
**QUANDO** o Dashboard carrega  
**ENTÃO** pode mostrar um estado `Near budget` não bloqueante.

### AC-09-13 — Savings canonical values

**DADO** Module 05 devolve target €3,000, funded €1,000 e remaining €2,000  
**QUANDO** o Dashboard mostra poupança  
**ENTÃO** usa estes valores sem recontar Payments.

### AC-09-14 — Savings target unavailable

**DADO** sem Target Budget nem Forecast utilizável  
**QUANDO** o Dashboard mostra Savings  
**ENTÃO** apresenta empty state  
**E** não mostra `0% funded`.

### AC-09-15 — Fully funded

**DADO** Module 05 marca a viagem como fully funded  
**QUANDO** o Dashboard carrega  
**ENTÃO** mostra o estado sem afirmar que o dinheiro existe numa conta bancária.

### AC-09-16 — Funding urgency

**DADO** faltam 5 dias para a viagem e Module 05 indica €420 ainda por financiar  
**QUANDO** o Dashboard gera Needs Attention  
**ENTÃO** inclui um aviso de alta prioridade sobre financiamento restante.

### AC-09-17 — No funding urgency far from departure

**DADO** faltam 60 dias e existe valor por financiar  
**QUANDO** o Dashboard carrega  
**ENTÃO** o valor aparece no Savings summary  
**MAS** não precisa ser classificado como alerta de alta prioridade por proximidade.

### AC-09-18 — Upcoming itinerary limit

**DADO** 10 próximos itinerary items  
**QUANDO** o Dashboard carrega  
**ENTÃO** mostra no máximo 3 no resumo principal  
**E** oferece navegação para o itinerário completo.

### AC-09-19 — Today itinerary priority

**DADO** uma Trip em curso com atividades restantes hoje e atividades amanhã  
**QUANDO** o Dashboard carrega  
**ENTÃO** as atividades restantes de hoje têm prioridade.

### AC-09-20 — No more items today

**DADO** não existem atividades restantes hoje e existem atividades amanhã  
**QUANDO** o Dashboard carrega  
**ENTÃO** pode mostrar as primeiras atividades de amanhã com data/contexto claro.

### AC-09-21 — Next Travel Leg

**DADO** um leg Paris → Brussels futuro e ativo  
**QUANDO** o Dashboard carrega  
**ENTÃO** mostra esse leg como próximo movimento com horários locais canónicos.

### AC-09-22 — Cancelled leg ignored

**DADO** um leg futuro cancelado seguido por outro leg ativo  
**QUANDO** o Dashboard escolhe o próximo movimento  
**ENTÃO** ignora o cancelado.

### AC-09-23 — Reservation planned

**DADO** uma Reservation `planned` com data relevante próxima  
**QUANDO** satisfaz a regra de attention  
**ENTÃO** aparece em Needs Attention com deep link para Reservations.

### AC-09-24 — Reservation payment separation

**DADO** uma Reservation `booked` sem informação de pagamento associada  
**QUANDO** o Dashboard mostra Reservations  
**ENTÃO** não assume `paid` nem `unpaid` a partir de Reservation status.

### AC-09-25 — Overdue checklist

**DADO** uma checklist task incompleta com due date passada  
**QUANDO** o Dashboard carrega  
**ENTÃO** a task entra na contagem overdue e tem prioridade sobre due-soon tasks.

### AC-09-26 — Due soon checklist

**DADO** uma task incompleta com due date dentro dos próximos 7 dias  
**QUANDO** o Dashboard carrega  
**ENTÃO** aparece como due soon.

### AC-09-27 — Completed task excluded

**DADO** uma task concluída cuja due date passou  
**QUANDO** o Dashboard calcula overdue  
**ENTÃO** não conta a task como overdue.

### AC-09-28 — Expired document

**DADO** um documento expirado segundo Module 08  
**QUANDO** o Dashboard carrega  
**ENTÃO** mostra warning de alta prioridade  
**SEM** afirmar regras legais de entrada num país.

### AC-09-29 — Document expires during Trip

**DADO** um passaporte cujo expiry date ocorre durante a Trip  
**QUANDO** Module 08 sinaliza essa condição  
**ENTÃO** o Dashboard prioriza o aviso adequadamente.

### AC-09-30 — Dashboard does not fetch files

**DADO** vários documentos com ficheiros privados  
**QUANDO** o Dashboard carrega  
**ENTÃO** apenas metadata/resumos necessários são consultados  
**E** nenhum attachment é transferido automaticamente.

### AC-09-31 — Attention deduplication

**DADO** a mesma Reservation gera um canonical review state consumido por dois resumos  
**QUANDO** Needs Attention é montado  
**ENTÃO** o mesmo problema não aparece duplicado como dois attention items equivalentes.

### AC-09-32 — Attention limit

**DADO** 12 issues elegíveis  
**QUANDO** o Dashboard carrega  
**ENTÃO** mostra no máximo 5 na lista principal  
**ORDENADAS** deterministicamente por prioridade/data.

### AC-09-33 — No urgent items

**DADO** uma Trip bem planeada sem warnings elegíveis  
**QUANDO** o Dashboard abre  
**ENTÃO** pode mostrar `Nothing urgent needs your attention` ou equivalente  
**E** não inventa tarefas.

### AC-09-34 — Partial section failure

**DADO** falha no carregamento de Itinerary  
**QUANDO** Finance, Route e Checklist carregam corretamente  
**ENTÃO** essas secções continuam utilizáveis  
**E** Itinerary mostra erro/retry local.

### AC-09-35 — Core Trip failure

**DADO** a Trip não pode ser autorizada/carregada  
**QUANDO** o Dashboard abre  
**ENTÃO** nenhum agregado privado é mostrado.

### AC-09-36 — No transient zero

**DADO** Finance ainda está a carregar  
**QUANDO** o Dashboard renderiza  
**ENTÃO** usa loading state  
**E** não mostra €0 temporário como valor real.

### AC-09-37 — Mutation refresh

**DADO** o utilizador adiciona um Payment com sucesso  
**QUANDO** volta ao Dashboard  
**ENTÃO** Paid/Savings refletem o novo estado segundo a estratégia de consistência aprovada sem hard refresh manual.

### AC-09-38 — Unauthorized ID

**DADO** utilizador A tenta abrir Dashboard da Trip de utilizador B por ID  
**QUANDO** envia o pedido  
**ENTÃO** não recebe aggregates, counts, nomes ou qualquer informação privada da Trip B.

### AC-09-39 — Archived Trip

**DADO** uma Trip arquivada  
**QUANDO** o Dashboard abre  
**ENTÃO** mostra estado Archived  
**E** evita urgency copy de preparação como se a Trip estivesse ativa.

### AC-09-40 — Route gap during Trip

**DADO** a data corrente cai num gap permitido entre Stops  
**QUANDO** o Dashboard determina localização  
**ENTÃO** mostra `Between destinations` ou equivalente  
**E** não inventa um Current Stop.

### AC-09-41 — Timezone preservation

**DADO** próximo leg parte de Tokyo às 09:00 JST  
**QUANDO** o utilizador abre o Dashboard em Portugal  
**ENTÃO** o horário principal continua contextualizado em horário local de partida, não convertido silenciosamente para Lisboa.

### AC-09-42 — Multi-currency safety

**DADO** a Trip contém custos originais em JPY, CZK e EUR mas base currency EUR  
**QUANDO** o Dashboard mostra totais  
**ENTÃO** usa os totais canónicos em EUR  
**E** não soma moedas originais diretamente.

### AC-09-43 — Mobile 15-day backpacking trip

**DADO** uma Trip de 15 dias, 5 países e vários alerts  
**QUANDO** o Dashboard é usado num ecrã pequeno  
**ENTÃO** valores, rota, next leg e attention list permanecem legíveis e acionáveis sem hover.

### AC-09-44 — Large Trip

**DADO** uma Trip de 60 dias com muitos Stops/tasks/documents  
**QUANDO** o Dashboard carrega  
**ENTÃO** usa resumos limitados e não tenta renderizar todas as entidades na página inicial.

### AC-09-45 — Keyboard accessibility

**DADO** um utilizador que navega apenas por teclado  
**QUANDO** percorre o Dashboard  
**ENTÃO** consegue aceder aos cards, links, retries e primary CTA numa ordem lógica.

### AC-09-46 — Warning not colour-only

**DADO** um estado Over Budget  
**QUANDO** é apresentado  
**ENTÃO** existe texto/semântica explícita além de cor vermelha/amarela.

### AC-09-47 — Deep link ownership

**DADO** um attention item de documento expirado  
**QUANDO** o utilizador o seleciona  
**ENTÃO** é levado ao contexto do documento no módulo proprietário  
**E** o Dashboard não edita o documento inline.

### AC-09-48 — Stable sort

**DADO** dois attention items da mesma prioridade e data  
**QUANDO** o Dashboard é recarregado sem mudança de dados  
**ENTÃO** a ordem permanece determinística.

---

## 39. Agent requirements

### Product Agent

Must prevent:

- new Dashboard-only business semantics;
- invented financial calculations;
- legal/travel eligibility claims;
- hidden mutations from summary cards.

### Architecture Agent

Must define:

- aggregation/query strategy;
- read-model boundaries;
- cache/revalidation strategy;
- partial failure strategy;
- N+1 prevention;
- domain ownership of every displayed value;
- attention-item derivation without creating a competing task database.

### Design Agent

Must design:

- new Trip empty state;
- partially planned state;
- pre-trip state;
- during-trip state;
- past/archived state;
- attention states;
- section-level loading/error states;
- responsive mobile hierarchy;
- accessible progress/warning presentation.

### Database Agent

Must not introduce canonical Dashboard business tables unless Architecture explicitly justifies a rebuildable read model.

If a read model is introduced, it must enforce owner isolation and safe invalidation.

### Backend Agent

Must:

- authorize Trip ownership before aggregation;
- reuse canonical domain services/queries/calculations;
- avoid N+1 patterns;
- return explicit null/unavailable states instead of fabricated zeroes;
- avoid returning document attachment data.

### Frontend Agent

Must:

- avoid client-side recreation of domain formulas;
- never show loading values as real zeroes;
- handle section-level failure;
- deep-link to owners;
- preserve local timezone context;
- avoid colour-only warnings.

### QA Agent

Must map and verify all AC-09 scenarios and run regression around Modules 03–08 summaries.

---

## 40. Definition of Done

Module 09 can be marked implementation-complete only when:

- this spec is APPROVED;
- Architecture documents aggregation/domain ownership clearly;
- Design covers all required lifecycle, empty, loading and error states;
- Database introduces no competing source of truth;
- Backend authorization and aggregate consistency pass automated tests;
- Frontend does not recreate financial/savings/domain calculations;
- all AC-09 scenarios pass or have approved test mappings;
- QA verdict is APPROVED;
- no open P0/P1 privacy, correctness or cross-user access defect exists;
- Module 10 can change user/trip preferences without requiring Dashboard business-rule rewrites.

---

## 41. Product decisions proposed for owner approval

### P09-01 — Dashboard is Trip-specific in MVP

No cross-Trip/global home dashboard is required in Module 09.

**Recommendation: APPROVE.**

### P09-02 — Dashboard is read/aggregation-first

Domain edits happen in owning modules; Dashboard cards primarily deep-link instead of becoming mini editors.

**Recommendation: APPROVE.**

### P09-03 — No duplicated financial or savings calculations

Dashboard consumes canonical Module 04/05 summaries.

**Recommendation: APPROVE.**

### P09-04 — Needs Attention is derived, not persisted as a new task system

No canonical Dashboard-owned attention table is required for MVP.

**Recommendation: APPROVE.**

### P09-05 — Show at most 5 primary attention items

Prioritize deterministically and link to owning modules.

**Recommendation: APPROVE.**

### P09-06 — Show at most 3 upcoming itinerary items

The Dashboard remains a summary, not the full itinerary.

**Recommendation: APPROVE.**

### P09-07 — Checklist `due soon` means within 7 days

Overdue outranks due-soon; completed tasks are excluded.

**Recommendation: APPROVE.**

### P09-08 — Funding urgency activates within 7 days of departure

Only when canonical `remaining to fund > 0`.

**Recommendation: APPROVE.**

### P09-09 — Planned Reservation attention window is 14 days

A planned Reservation with a relevant date within 14 days may be surfaced as a medium-priority planning warning.

**Recommendation: APPROVE.**

### P09-10 — `Near budget` threshold is 90%

This is an informational dashboard threshold, centralized and non-blocking.

**Recommendation: APPROVE.**

### P09-11 — Partial section failure must degrade gracefully

One failed aggregate must not blank the entire Dashboard when the Trip and other sections can load safely.

**Recommendation: APPROVE.**

### P09-12 — No private document files are fetched for Dashboard summaries

Only safe metadata/derived warning counts are consumed.

**Recommendation: APPROVE.**

### P09-13 — Past Trips remain accessible and are not auto-archived

Dashboard shifts presentation toward historical summary while preserving manual archive semantics.

**Recommendation: APPROVE.**

### P09-14 — No external live data in MVP Dashboard

Weather, flight status, maps and live FX are deferred to future modules/integrations.

**Recommendation: APPROVE.**

---

## 42. Approval gate

This spec may move from `REVIEW` to `APPROVED` only after the Product Owner approves or modifies P09-01 through P09-14.

Until then:

- Architecture may inspect the spec;
- autonomous implementation must not start;
- agents must not invent competing dashboard calculations, prioritization or persistence rules.
