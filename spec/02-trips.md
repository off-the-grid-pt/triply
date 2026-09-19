# SPEC — Module 02: Trips

Version: 1.0  
Status: APPROVED
Module ID: `02-trips`  
Depends on: `spec/00-product.md`, `spec/01-auth-onboarding.md`, `AGENTS.md`  
Primary handoff: Module 03 — Destinations & Travel Legs

---

## 1. Purpose

Provide the top-level object that represents a complete Triply journey.

A **Trip** is the private planning container that owns the trip-wide dates, base currency, traveller count, optional budget target, lifecycle state and later all destinations, travel legs, expenses, itinerary items, reservations, checklists and documents.

The Trip model must support both a simple weekend away and a long multi-city / multi-country backpacking journey. It must never assume that a journey is only `origin → destination → origin`.

---

## 2. Product outcome

When this module is complete, an authenticated and onboarded user can:

1. create a new trip;
2. give the trip a clear title;
3. define overall start and end dates;
4. define the trip base currency;
5. define the number of travellers;
6. optionally define an initial total target budget;
7. optionally define home origin and final return location as route boundaries;
8. open and edit an existing trip;
9. see all owned trips in a useful list/overview;
10. distinguish upcoming, ongoing, past and archived trips;
11. archive and restore a trip;
12. permanently delete a trip only through an explicit destructive confirmation flow;
13. enter a newly created trip and continue to destination planning in Module 03.

---

## 3. Actors

### 3.1 Authenticated user — onboarding complete

Can create, view, edit, archive, restore and delete only trips they own.

### 3.2 Authenticated user — onboarding incomplete

Cannot use normal Trip functionality. Routing behaviour remains governed by Module 01.

### 3.3 Visitor

Cannot access trip data or trip routes.

---

## 4. Scope

### Included

- trip creation;
- trip list / overview;
- trip empty state;
- trip details shell;
- trip title;
- start date and end date;
- base currency;
- traveller count;
- optional total target budget;
- optional home origin boundary;
- optional final return boundary;
- lifecycle state derived/suggested from dates;
- manual archive/restore;
- permanent deletion with confirmation;
- ownership and private access enforcement;
- loading, validation, success, empty and error states;
- handoff into Module 03 destination planning.

### Explicitly out of scope

- adding destinations/stops;
- ordering destinations;
- transport between destinations;
- maps or route geometry;
- flight/train/bus search;
- expense transactions;
- category budgets;
- savings calculations;
- itinerary activities;
- reservations;
- checklists;
- document uploads;
- collaboration or shared trips;
- trip templates;
- AI-generated trips;
- automatic destination recommendations;
- automatic currency exchange rates;
- booking integrations.

These belong to later approved specs.

---

## 5. Canonical product concepts

### 5.1 Trip

A Trip is the root user-owned planning record.

Required conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `owner_user_id` | Required; exactly one owner in MVP |
| `title` | Required |
| `start_date` | Required |
| `end_date` | Required |
| `base_currency` | Required ISO 4217 code |
| `traveller_count` | Required positive integer; default `1` |
| `target_budget` | Optional non-negative money amount in base currency |
| `home_origin_label` | Optional route boundary label |
| `final_return_label` | Optional route boundary label |
| `archived_at` | Null unless manually archived |
| `created_at` | Required |
| `updated_at` | Required |

Architecture/Database agents may add technical fields but must not add new user-facing requirements without an approved spec change.

### 5.2 Route boundary

`home_origin_label` and `final_return_label` describe the journey boundary only.

They are **not destinations/stops** and do not create itinerary days, destination budgets or stay records by themselves.

Example:

`Lisboa [origin boundary] → Paris → Brussels → Amsterdam → Berlin → Prague → Lisboa [return boundary]`

The stops and legs are owned by Module 03.

---

## 6. Global business rules

### RN-01 — Ownership

Every Trip belongs to exactly one authenticated Triply user in the MVP.

A user must never read, edit, archive, restore or delete another user's trip.

### RN-02 — Multi-destination invariant

The Trip data model must not contain a single required `destination` field that constrains the journey to one destination.

Destinations are child records managed by Module 03.

### RN-03 — Title

A trip requires a human-readable title.

Rules:
- trim leading/trailing whitespace;
- cannot be blank after trimming;
- recommended product maximum: 100 characters;
- duplicate titles are allowed for the same user.

Examples:
- `Mochilão Europa 2026`
- `Japão — Primavera`
- `Fim de semana em Madrid`

### RN-04 — Dates

`start_date` and `end_date` are required calendar dates.

Rules:
- `end_date` cannot be before `start_date`;
- same-day trips are allowed;
- dates are trip-level planning boundaries and not UTC instants;
- changing the dates after dependent modules contain data must never silently delete that data.

If a future date edit conflicts with destinations/itinerary, the UI must show a clear conflict flow defined by the dependent module rather than silently mutating child data.

### RN-05 — Base currency

Each trip has exactly one base currency used for trip-wide summaries and targets.

On creation, it defaults to the user's `default_currency` from Module 01.

The user may choose another supported ISO 4217 currency.

Changing base currency before financial records exist is allowed.

Once financial records exist, currency-change behaviour is governed by Module 04 and must not be invented in this module.

### RN-06 — Traveller count

`traveller_count`:
- defaults to `1`;
- must be an integer >= 1;
- is informational in MVP;
- does not multiply budgets or costs automatically.

All entered costs represent total trip amounts unless another approved spec explicitly says otherwise.

### RN-07 — Target budget

The total target budget is optional at trip creation.

If provided:
- it must be >= 0;
- it is denominated in the trip base currency;
- it represents the user's high-level desired cap/target for the full trip;
- it does not automatically allocate category or destination budgets.

A value of `0` is valid and means the user intentionally set a zero target, not “missing”.

### RN-08 — Origin boundary is optional

A trip may be created without a home origin.

The origin is a route boundary, not a destination record.

### RN-09 — Final return boundary is optional

A trip may be created without a final return location.

The final return boundary may differ from the origin.

Examples:
- Lisbon → multi-country trip → Lisbon
- Porto → multi-country trip → Madrid
- no boundary supplied → destinations only

### RN-10 — Lifecycle is non-destructive

Triply may derive/suggest a lifecycle label from the current date:

- `upcoming`: today < start date;
- `ongoing`: start date <= today <= end date;
- `past`: today > end date;
- `archived`: manually archived regardless of date.

The date-derived state must not trigger destructive updates, deletes or automatic archival.

### RN-11 — Archive is reversible

Archiving a trip:
- hides it from the primary active trip list by default;
- preserves all data;
- can be reversed through restore;
- does not equal deletion.

### RN-12 — Permanent deletion is explicit

Permanent deletion must require a dedicated destructive confirmation.

At minimum, the user must be clearly informed that the trip and all child data will be permanently removed.

The implementation must not use a single accidental click as final confirmation.

### RN-13 — Deletion cascades only at final confirmation

Once permanent deletion is confirmed, all child data owned by that trip must be removed according to the database architecture.

No orphaned private data or private files may remain accidentally.

Storage cleanup requirements for documents are additionally governed by Module 08.

### RN-14 — Creation does not require destinations

A Trip may exist with zero destinations.

Immediately after creation, the product must present a clear next action to add the first destination through Module 03.

### RN-15 — Partial edits must preserve data

Editing one Trip field must not reset unrelated fields.

Example: renaming the trip must not reset traveller count, budget or dates.

### RN-16 — Server-side authority

Ownership, validation and destructive actions cannot rely solely on frontend checks.

The server/data access layer must enforce them.

---

## 7. Trip creation flow

### 7.1 Entry points

A user may start creation from:
- the empty-state CTA after onboarding;
- the trips overview;
- another approved global “new trip” action.

All entry points open the same canonical creation behaviour.

### 7.2 Required creation fields

Required:
- trip title;
- start date;
- end date;
- base currency;
- traveller count.

Optional:
- target budget;
- home origin;
- final return.

### 7.3 Creation success

On successful creation:
1. the trip is persisted;
2. ownership is assigned to the authenticated user;
3. the user enters the new Trip workspace;
4. the primary next action is to add the first destination;
5. no fake destination or placeholder stop is inserted automatically.

### 7.4 Creation failure

On failure:
- entered valid form values should remain where technically safe;
- the user receives a clear actionable error;
- duplicate submissions must be prevented while the request is in flight;
- the application must not create multiple trips from one deliberate submission.

---

## 8. Trips overview

The authenticated user needs a screen that allows them to understand their trips quickly.

### 8.1 Active/default view

Default view includes non-archived trips.

Trips should expose enough information to identify them without opening each one. At minimum:
- title;
- date range;
- lifecycle label;
- traveller count;
- base currency;
- target budget when defined.

The Design Agent may choose card/list presentation.

### 8.2 Ordering

Default ordering:
1. ongoing trips;
2. upcoming trips ordered by nearest start date;
3. past non-archived trips ordered by most recent end date.

Archived trips are shown in a separate view/filter.

### 8.3 Empty state

If the user owns no trips, the screen must explain the value of creating one and provide a clear `Criar viagem` CTA.

### 8.4 Archived view

The user must be able to find archived trips and either:
- restore them; or
- permanently delete them through the destructive flow.

---

## 9. Trip workspace shell

Opening a Trip must provide a stable trip context for later modules.

At Module 02 completion, the shell must support:
- trip identity/title;
- trip dates;
- lifecycle/status indication;
- edit trip action;
- placeholder/navigation destination for future approved modules without fabricating unavailable data;
- clear `Adicionar primeiro destino` handoff when no destinations exist.

The shell must not fake budget summaries, itinerary counts or reservations before their modules exist.

---

## 10. Edit trip flow

The user can edit:
- title;
- start/end date;
- base currency subject to RN-05;
- traveller count;
- target budget;
- origin boundary;
- return boundary.

### 10.1 Validation

The same canonical validation used at creation applies to edits.

### 10.2 Unsaved changes

If an edit surface supports multiple fields before save, closing/navigating away with unsaved changes must not silently discard them without an appropriate warning when technically feasible.

### 10.3 Conflict with child modules

Module 02 must expose a safe mechanism for dependent modules to prevent or warn about edits that would create invalid child data.

Example: reducing the trip date range when itinerary days already exist outside that range.

Module 02 must not invent the resolution policy for those child records; the owning module spec defines it.

---

## 11. Archive and restore

### Archive

DADO a trip owned by the user  
QUANDO the user explicitly archives it  
ENTÃO:
- `archived_at` becomes populated;
- the trip disappears from the default active view;
- no child records are deleted;
- the trip remains accessible through archived trips.

### Restore

DADO an archived trip owned by the user  
QUANDO the user restores it  
ENTÃO:
- `archived_at` becomes null;
- the trip returns to the appropriate active lifecycle grouping based on its dates;
- all child data remains unchanged.

---

## 12. Permanent deletion flow

DADO a trip owned by the current user  
QUANDO the user selects permanent delete  
ENTÃO Triply must show a destructive confirmation containing:
- the trip title;
- clear language that the action is permanent;
- clear language that associated destinations, expenses, itinerary, reservations, checklists and documents will also be removed once those modules exist;
- cancel and confirm actions visually distinguishable.

Recommended confirmation requirement for MVP: the user must type the trip title exactly before final deletion is enabled.

After successful deletion:
- redirect to the trips overview;
- show a success acknowledgement;
- the deleted trip URL must no longer resolve for the user;
- the trip must not remain visible in lists.

---

## 13. Validation and error behaviour

### 13.1 Invalid date range

User-facing behaviour: explain that the end date cannot be before the start date.

### 13.2 Invalid traveller count

Reject zero, negative values, decimals and non-numeric values.

### 13.3 Invalid budget

Reject negative values and malformed monetary input.

### 13.4 Unsupported currency

Reject unsupported currency codes server-side even if the client is manipulated.

### 13.5 Unauthorized/not found

Triply must not disclose another user's private trip.

For private trip routes, an unknown trip and a trip owned by someone else should produce equivalent safe behaviour from the requesting user's perspective.

### 13.6 Network/server failure

Creation/edit/archive/restore/delete failures must:
- not present false success;
- preserve retriable state where practical;
- prevent double submission;
- provide a clear retry path.

---

## 14. Acceptance scenarios

### AC-01 — Create a multi-destination-ready trip

DADO an authenticated user with completed onboarding  
QUANDO they create `Mochilão Europa 2026` from 10/11/2026 to 25/11/2026 in EUR for 1 traveller  
ENTÃO one Trip is created with zero destinations and the user sees the action to add the first destination.

### AC-02 — Create without budget

DADO a valid creation form  
QUANDO target budget is left empty  
ENTÃO the Trip is created and `target_budget` remains absent/null rather than being silently converted to zero.

### AC-03 — Budget zero is intentional

DADO a valid trip  
QUANDO target budget is explicitly `0`  
ENTÃO Triply stores zero distinctly from an unspecified target budget.

### AC-04 — Default base currency

DADO the user's default currency is EUR  
QUANDO the creation flow opens  
ENTÃO EUR is preselected but remains editable before submission.

### AC-05 — Invalid dates

DADO start date 20/11/2026  
QUANDO end date is 19/11/2026  
ENTÃO submission is blocked and no Trip is created.

### AC-06 — Same-day trip

DADO start and end date are both 10/11/2026  
QUANDO all other required fields are valid  
ENTÃO the Trip can be created.

### AC-07 — Traveller count does not multiply budget

DADO traveller count = 3 and target budget = €3,000  
QUANDO the Trip is saved  
ENTÃO the target remains €3,000 total, not €9,000.

### AC-08 — Optional route boundaries

DADO a valid trip  
QUANDO origin and return fields are empty  
ENTÃO creation succeeds.

### AC-09 — Different origin and return

DADO origin = Porto and return = Madrid  
QUANDO the trip is created  
ENTÃO both values are preserved independently and neither creates a destination stop.

### AC-10 — Lifecycle upcoming

DADO today is before the trip start date  
QUANDO the user views the trip  
ENTÃO the trip is presented as upcoming without a destructive state mutation.

### AC-11 — Lifecycle ongoing

DADO today is between start and end dates inclusive  
QUANDO the user views the trip  
ENTÃO it is presented as ongoing.

### AC-12 — Lifecycle past

DADO today is after end date  
QUANDO the user views the trip  
ENTÃO it is presented as past and is not automatically archived.

### AC-13 — Archive

DADO an owned non-archived trip  
QUANDO the user archives it  
ENTÃO it leaves the default active list and remains available in archived trips with all data preserved.

### AC-14 — Restore

DADO an archived trip  
QUANDO the user restores it  
ENTÃO it returns to the appropriate date-derived group with all data preserved.

### AC-15 — Delete confirmation

DADO an owned trip  
QUANDO the user chooses permanent delete but has not completed the required destructive confirmation  
ENTÃO no deletion occurs.

### AC-16 — Delete success

DADO the destructive confirmation is valid  
QUANDO deletion succeeds  
ENTÃO the trip and its owned child data are removed and the user returns to the trips overview.

### AC-17 — Ownership isolation

DADO User A owns a Trip  
QUANDO User B attempts to access its identifier directly  
ENTÃO User B receives no private trip data and cannot infer ownership-sensitive information.

### AC-18 — Duplicate submit protection

DADO the user submits a valid new trip  
QUANDO they click/trigger submit repeatedly while the request is pending  
ENTÃO at most one intended Trip is created.

### AC-19 — Edit title only

DADO an existing trip with dates, budget and traveller count  
QUANDO only the title changes  
ENTÃO all unrelated trip fields remain unchanged.

### AC-20 — Empty trip list

DADO a user owns no trips  
QUANDO they enter the workspace  
ENTÃO they see a useful empty state with a clear create-trip action.

---

## 15. UX requirements

The creation experience should feel lighter than a traditional travel booking form.

Requirements:
- clearly distinguish required and optional fields;
- support keyboard navigation;
- accessible field labels and validation;
- mobile-first responsive behaviour;
- no dependency on hover for essential actions;
- visible pending state during mutations;
- destructive actions visually distinct from normal editing;
- date inputs must work without requiring precise icon clicks;
- money input must clearly indicate the selected base currency;
- optional fields must not create friction before the first trip exists.

The Design Agent owns layout decisions but cannot alter these behaviours.

---

## 16. Architecture requirements

The Architecture Agent must explicitly decide and document:
- Trip route/URL shape;
- ownership enforcement boundary;
- trip date representation;
- money representation for `target_budget`;
- supported currency source/list;
- mutation idempotency / duplicate-create mitigation;
- lifecycle derivation strategy;
- archive strategy;
- safe permanent-delete transaction strategy;
- future child-module referential model without implementing those modules prematurely.

Architecture must preserve compatibility with Module 03's unlimited ordered stops.

---

## 17. Database requirements

The Database Agent must ensure:
- strict owner foreign key;
- RLS/ownership policy for all Trip CRUD operations;
- date-range constraint where supported;
- traveller count >= 1 constraint;
- target budget >= 0 constraint when non-null;
- supported precision for money according to the money ADR;
- archive does not delete data;
- deletion semantics are explicit and safe for future children;
- indexes support owned-trip listing and lifecycle/date ordering.

No destination columns should be embedded merely to avoid creating Module 03 records.

---

## 18. Backend requirements

The Backend Agent must:
- enforce all product validation server-side;
- verify ownership for read and mutation paths;
- avoid account/trip enumeration leakage;
- prevent unintended duplicate creation;
- calculate/derive lifecycle consistently;
- preserve omitted-vs-zero semantics for target budget;
- expose safe archive, restore and delete operations;
- never trust client-provided owner IDs.

---

## 19. Frontend requirements

The Frontend Agent must implement approved design behaviour for:
- trip list;
- empty state;
- create flow;
- trip shell;
- edit flow;
- archive/restore;
- destructive delete confirmation;
- validation/pending/error/success states.

Frontend must not fabricate destinations, expenses or dashboard data owned by later modules.

---

## 20. QA requirements

QA must verify at minimum:
- every AC-01 through AC-20 scenario;
- direct unauthorized trip access;
- altered owner/user IDs;
- invalid server-side payloads bypassing UI validation;
- duplicate-submit behaviour;
- zero vs null target budget;
- archive/restore data preservation;
- permanent delete protection;
- responsive creation/edit flows;
- keyboard and accessible form behaviour;
- date lifecycle boundary cases;
- no assumption of a single destination in UI or data model.

A QA approval is invalid if multi-destination readiness has not been checked explicitly.

---

## 21. Security/privacy requirements

- trip existence is private user data;
- server-side authorization is required for every trip resource access;
- logs must not unnecessarily expose private trip content;
- destructive operations require authenticated ownership confirmation;
- direct object reference attacks must be tested;
- archived trips remain private and fully protected;
- route boundaries are private trip content.

---

## 22. Observability requirements

Without adding a third-party analytics dependency unless separately approved, the implementation should make it possible to diagnose:
- failed trip creation;
- failed trip update;
- failed archive/restore;
- failed permanent deletion;
- unexpected authorization denials;
- duplicate-mutation protection events.

Sensitive trip details must not be dumped into logs solely for diagnostics.

---

## 23. Product decisions proposed for approval

The following decisions are part of this spec proposal:

1. A Trip can exist with zero destinations.
2. Start and end dates are required at creation.
3. Same-day trips are allowed.
4. Origin and final return are optional route boundaries, not destinations.
5. Traveller count defaults to 1 and does not multiply costs.
6. Total target budget is optional; `null` and `0` have different meanings.
7. Archiving is manual and reversible; past trips are not auto-archived.
8. Permanent deletion uses a deliberate destructive confirmation; recommended MVP confirmation is typing the trip title.
9. Trip titles do not need to be unique.
10. Newly created trips proceed directly to “add first destination”, not to a fabricated placeholder itinerary.

Once the product owner approves this spec, change `Status` to `APPROVED` and release it to the Architecture stage.
