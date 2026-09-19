# SPEC — Module 10: Settings & Trip Preferences

Version: 1.0  
Status: APPROVED
Module ID: `10-settings-preferences`  
Depends on: `spec/00-product.md`, `spec/01-auth-onboarding.md`, `spec/02-trips.md`, `spec/04-budget-expenses.md`, `AGENTS.md`  
Primary handoff: End of MVP product-spec phase

---

## 1. Purpose

Allow an authenticated Triply user to manage a small set of personal defaults and per-Trip preferences without silently rewriting historical trip, money, route or itinerary data.

This module exists to answer two different questions cleanly:

1. **Account defaults** — “What should Triply use when I create something new?”
2. **Trip preferences** — “How should this specific Trip behave/display where the product explicitly supports an override?”

Settings are preferences, not an alternative business-rules engine.

---

## 2. Product outcomes

When this module is complete, the authenticated user can:

1. edit their display name;
2. change their default currency for future Trips;
3. change their UI locale/language from supported locales;
4. see which defaults affect only future Trips;
5. manage supported preferences for an existing Trip without changing canonical financial history;
6. change a Trip base currency only when the rules from Modules 02 and 04 allow it;
7. understand when a preference is locked and why;
8. safely save, retry and recover from settings failures;
9. use settings on mobile and with keyboard/accessibility support;
10. never cause existing historical records to be silently converted, shifted or deleted because of a preference change.

---

## 3. Actors

### 3.1 Authenticated user

Can read and edit their own account preferences.

### 3.2 Trip owner

Can edit preferences for a Trip they own, subject to domain locks and validation.

### 3.3 Authenticated non-owner

Cannot read or mutate another user's Trip preferences.

### 3.4 Visitor

Cannot access private settings.

---

## 4. Scope

### Included — account settings

- display name;
- default currency;
- locale/language;
- clear explanations of preference effects;
- loading/saving/error/success states;
- safe validation;
- owner-only access.

### Included — Trip preferences

- Trip base currency where Module 04 permits changing it;
- traveller count as defined by Module 02;
- Trip name/date/origin-return editing is **not reimplemented here**; settings deep-links to the canonical Trip edit surface when relevant;
- preference presentation for settings already owned by another module;
- explicit lock/reason display when a preference cannot be changed.

### Out of scope for MVP

- Google/Apple authentication management;
- email-address change flow;
- password change UI beyond the approved auth/recovery flows unless separately specified;
- account deletion;
- data export / GDPR self-service center;
- notification preferences;
- push/email notification subscriptions;
- theme/light-dark preference;
- map provider settings;
- live exchange-rate provider selection;
- custom date/time format designer;
- custom first-day-of-week setting;
- collaboration/team settings;
- shared Trips and permissions;
- per-user timezone preference that rewrites Trip/local times;
- advanced accessibility personalization;
- billing/subscription settings;
- AI settings;
- units (metric/imperial) unless a later feature requires them;
- automatic currency conversion of existing Trips.

---

## 5. Source-of-truth principle

Settings MUST NOT duplicate domain ownership.

Examples:

- authentication identity/session → Module 01;
- Trip dates, traveller count, origin/return → Module 02;
- Trip base currency financial lock → Module 04;
- itinerary local-time semantics → Module 06;
- document access/privacy → Module 08.

If a setting changes domain data owned elsewhere, this module must call/use the canonical domain operation and respect all of its validation and lock rules.

Settings UI must never bypass domain rules because the user reached the field through `/settings`.

---

## 6. Account preference model

The MVP user profile contains at least:

| Field | Required | Meaning |
|---|---:|---|
| `display_name` | Yes after onboarding | Human-readable name shown in Triply |
| `default_currency` | Yes after onboarding | Default ISO 4217 currency for newly created Trips |
| `locale` | Yes after onboarding | Supported UI locale/language |
| `onboarding_completed_at` | Yes after onboarding | Canonical onboarding state; not manually editable here |

Account preference changes are owner-scoped and must not alter authentication ownership identifiers.

---

## 7. Display name

### RN-10-01 — Editable after onboarding

The user can change `display_name` after onboarding.

### RN-10-02 — Validation

Display name:

- is required;
- is trimmed;
- cannot be only whitespace;
- must use a reasonable server-enforced maximum length;
- must be handled as plain user-generated text;
- must never be rendered as executable HTML.

### RN-10-03 — No historical snapshot rewrite

Changing display name updates the current profile presentation. It must not rewrite unrelated Trip data or historical financial records.

---

## 8. Default currency

### RN-10-04 — Account default only

`default_currency` is a default for **new Trips**.

Example:

```text
Current account default: EUR
Existing Trip A: EUR
Existing Trip B: USD

User changes default → GBP

Existing Trip A remains EUR
Existing Trip B remains USD
Next Trip defaults to GBP
```

### RN-10-05 — Supported ISO currency

The selected value must be from Triply's supported ISO 4217 currency list.

The architecture must allow the supported list to expand without schema redesign.

### RN-10-06 — No retroactive conversion

Changing account default currency must never:

- convert an existing Trip;
- modify existing Money records;
- rewrite exchange rates;
- alter payments, expenses, refunds or forecast history.

### RN-10-07 — Clear copy

The UI must explain that the change applies to future Trips by default.

Recommended copy concept:

> A moeda predefinida será usada em novas viagens. As viagens existentes não serão alteradas.

---

## 9. Locale / language

### RN-10-08 — Supported locales only

`locale` must be from the application-supported locale list.

MVP baseline remains `pt-PT`.

Architecture may prepare localization infrastructure for additional locales without requiring additional languages to ship in the MVP.

### RN-10-09 — Locale affects presentation, not canonical values

Changing locale may affect supported UI presentation such as:

- translated interface copy;
- date formatting;
- number/currency formatting;
- labels.

It must not alter:

- stored Trip dates;
- stored local itinerary times;
- Money minor-unit amounts;
- currency codes;
- exchange rates;
- user-entered notes/content.

### RN-10-10 — Unsupported locale

An unsupported locale cannot be persisted even if submitted directly to the backend.

---

## 10. Trip preferences surface

The Trip Settings surface may expose selected Trip-level configuration, but it must distinguish **editable preferences** from **canonical Trip data**.

Recommended sections:

1. General;
2. Travellers;
3. Currency;
4. Danger / archive actions via canonical Trip management surfaces where applicable.

The module does not own archive/delete behavior; Module 02 remains canonical.

---

## 11. Trip base currency

### RN-10-11 — Canonical rule delegation

Trip base currency uses Modules 02/04 rules.

### RN-10-12 — Before financial data

If no financial records exist and the canonical finance rules permit the change, the Trip owner may change base currency.

### RN-10-13 — After financial data

Once financial records exist, Settings must not offer a silent one-click currency change.

For the MVP, the recommended behavior is to **lock the field** and explain why.

Example:

> Esta moeda não pode ser alterada porque a viagem já tem dados financeiros registados.

The user is not offered an automatic historical re-conversion flow in the MVP.

### RN-10-14 — Account default remains independent

Changing Trip base currency must not change the user's account `default_currency`.

Changing account `default_currency` must not change the Trip base currency.

---

## 12. Traveller count

### RN-10-15 — Canonical Trip field

Settings may expose traveller count, but it uses the canonical Module 02 update operation.

### RN-10-16 — Informational financial behavior

Changing traveller count must not automatically multiply or divide existing costs, forecasts, payments or savings targets.

Triply may explain this behavior in supporting copy.

### RN-10-17 — Minimum

Traveller count must remain at least `1`.

---

## 13. Unsaved changes and save behavior

### RN-10-18 — Explicit safe save

Settings may use per-section save actions or a clear global save pattern, but behavior must be unambiguous.

### RN-10-19 — No false success

The UI must not display a successful save until the canonical write succeeds.

### RN-10-20 — Failed save

On network/server failure:

- keep the edited values in the form where safe;
- show an actionable error;
- do not pretend the server state changed;
- allow retry.

### RN-10-21 — Retry/idempotency

Repeated save requests caused by retry/double-click must not create duplicate profile/preference records.

### RN-10-22 — Navigation with unsaved changes

If the chosen UI pattern can leave unsaved edits, navigation away should warn the user where reasonably possible.

Do not implement a disruptive warning if fields auto-save atomically and safely; Design/Architecture must choose one coherent pattern.

---

## 14. Concurrent/stale updates

The implementation must avoid silently overwriting a newer server state with a stale form when this risk is material.

At minimum:

- refetch/revalidate after successful save;
- handle rejected stale updates safely if optimistic concurrency/versioning is used;
- never merge currency/locale changes through client-only assumptions.

Architecture decides the mechanism.

---

## 15. Security and privacy

### SEC-10-01 — Owner isolation

Users can read/write only their own account preference record.

### SEC-10-02 — Trip ownership

Trip preferences require canonical Trip ownership checks server-side/RLS as applicable.

### SEC-10-03 — No client-only validation

Supported currency, locale, traveller count and locked Trip currency rules must be enforced on the trusted side.

### SEC-10-04 — XSS-safe text

Display name and all user-supplied preference-adjacent text are escaped/rendered safely.

### SEC-10-05 — Sensitive logging

Logs must not unnecessarily include session tokens or authentication secrets.

### SEC-10-06 — Direct API attempts

A malicious client cannot change another user's preferences or bypass a Trip currency lock by calling an endpoint directly.

---

## 16. UX states

Each settings section must define:

### Loading

- stable skeleton/loading state;
- no editable form populated with guessed defaults when canonical values are still loading.

### Ready

- current persisted values displayed accurately.

### Dirty/editing

- user can distinguish changed values where the chosen interaction pattern makes this useful.

### Saving

- duplicate submissions prevented or made idempotent;
- save action reflects progress.

### Success

- clear but non-disruptive confirmation;
- canonical values revalidated.

### Validation error

- field-level error where applicable;
- entered values preserved.

### Server/network error

- actionable retry;
- no false persisted state.

### Locked preference

- disabled/read-only field;
- reason shown in accessible text;
- no fake affordance suggesting the operation is available.

---

## 17. Mobile and accessibility

Settings must:

- work without horizontal scrolling on narrow mobile screens;
- support keyboard operation;
- expose semantic labels and descriptions;
- associate errors with fields programmatically;
- provide visible focus states;
- avoid relying on color alone for success/error/locked status;
- ensure select/dropdown controls are accessible;
- keep destructive/navigation actions clearly separated from ordinary preferences.

---

## 18. Suggested information architecture

### Account settings

```text
Settings
├─ Profile
│  └─ Name
├─ Preferences
│  ├─ Default currency
│  └─ Language
└─ Security
   └─ Link/navigation to approved authentication recovery/security flows
```

The Security section must not invent unsupported password/account-management features.

### Trip settings

```text
Trip Settings
├─ General
│  └─ Link to canonical Trip edit where appropriate
├─ Travellers
│  └─ Traveller count
├─ Currency
│  └─ Trip base currency + lock explanation
└─ Trip management
   └─ Canonical archive/delete surfaces from Module 02
```

---

## 19. Acceptance scenarios — Account settings

### AC-10-01 — Load current settings

**DADO** um utilizador autenticado com onboarding completo  
**QUANDO** abre Settings  
**ENTÃO** vê o display name, moeda predefinida e locale atualmente persistidos.

### AC-10-02 — Change display name

**DADO** Settings aberto  
**QUANDO** altera o nome para um valor válido e guarda  
**ENTÃO** o perfil é atualizado  
**E** o novo nome aparece após revalidação.

### AC-10-03 — Reject blank display name

**QUANDO** o utilizador tenta guardar um nome vazio/apenas espaços  
**ENTÃO** vê erro de validação  
**E** nenhum valor inválido é persistido.

### AC-10-04 — Change default currency

**DADO** default EUR  
**QUANDO** muda para GBP  
**ENTÃO** `default_currency = GBP`  
**E** novas Trips passam a usar GBP como default.

### AC-10-05 — Existing Trips unchanged by account currency

**DADO** uma Trip existente em EUR  
**QUANDO** o utilizador muda account default para GBP  
**ENTÃO** a Trip existente continua em EUR  
**E** nenhum Money record é reescrito.

### AC-10-06 — Unsupported currency rejected

**QUANDO** um cliente tenta persistir um código não suportado  
**ENTÃO** o backend rejeita a operação  
**E** a preferência anterior permanece intacta.

### AC-10-07 — Change locale

**DADO** locale `pt-PT`  
**QUANDO** o utilizador seleciona outro locale suportado  
**ENTÃO** a preferência é persistida  
**E** a UI pode passar a usar esse locale onde a tradução/formatação exista.

### AC-10-08 — Locale does not rewrite data

**DADO** despesas e datas já existentes  
**QUANDO** o locale muda  
**ENTÃO** apenas a apresentação suportada muda  
**E** valores/data/time canónicos permanecem idênticos.

### AC-10-09 — Unsupported locale rejected

**QUANDO** um locale não suportado é submetido diretamente  
**ENTÃO** a gravação falha com validação segura.

### AC-10-10 — Settings write network failure

**QUANDO** ocorre falha durante save  
**ENTÃO** o formulário não mostra falso sucesso  
**E** preserva a edição quando seguro  
**E** oferece retry.

### AC-10-11 — Duplicate save

**QUANDO** o utilizador clica duas vezes ou o cliente repete o request  
**ENTÃO** existe apenas o estado final esperado  
**E** nenhum perfil duplicado é criado.

---

## 20. Acceptance scenarios — Trip preferences

### AC-10-12 — Load own Trip preferences

**DADO** uma Trip pertencente ao utilizador  
**QUANDO** abre Trip Settings  
**ENTÃO** vê apenas preferências/dados permitidos daquela Trip.

### AC-10-13 — Non-owner blocked

**DADO** uma Trip de outro utilizador  
**QUANDO** tenta abrir ou alterar Trip Settings  
**ENTÃO** o acesso é negado sem revelar dados privados.

### AC-10-14 — Change Trip currency before finance exists

**DADO** uma Trip sem qualquer registo financeiro  
**QUANDO** o owner muda a base currency para uma moeda suportada  
**ENTÃO** a alteração usa a operação canónica  
**E** é persistida.

### AC-10-15 — Trip currency locked after financial data

**DADO** uma Trip com estimated/committed/payment/expense/adjustment  
**QUANDO** abre Settings  
**ENTÃO** a moeda da Trip aparece bloqueada  
**E** existe explicação do motivo.

### AC-10-16 — Direct API cannot bypass currency lock

**DADO** uma Trip com dados financeiros  
**QUANDO** um cliente malicioso chama diretamente a operação de mudança de moeda  
**ENTÃO** o trusted layer rejeita a operação.

### AC-10-17 — Account default independent from Trip currency

**QUANDO** a Trip muda de EUR para GBP antes de haver financeiro  
**ENTÃO** `default_currency` do utilizador não muda automaticamente.

### AC-10-18 — Change traveller count

**DADO** traveller count = 1  
**QUANDO** o owner altera para 2  
**ENTÃO** a Trip passa a indicar 2 viajantes  
**E** nenhum custo existente é duplicado.

### AC-10-19 — Reject traveller count zero

**QUANDO** tenta definir 0 viajantes  
**ENTÃO** a operação é rejeitada.

### AC-10-20 — Traveller count change leaves finance intact

**DADO** forecast €2.000 e traveller count 1  
**QUANDO** muda traveller count para 2  
**ENTÃO** forecast continua €2.000  
**E** Savings Plan continua a usar os valores canónicos existentes.

---

## 21. Acceptance scenarios — Security, UX and resilience

### AC-10-21 — Unauthenticated access

**QUANDO** visitante abre Settings  
**ENTÃO** é encaminhado para autenticação segura.

### AC-10-22 — Cross-user account preference write blocked

**QUANDO** utilizador A tenta editar preferências de B por ID/API  
**ENTÃO** a operação é negada.

### AC-10-23 — XSS-safe display name

**QUANDO** display name contém markup/script-like content permitido como texto  
**ENTÃO** é apresentado como texto seguro  
**E** não executa código.

### AC-10-24 — Loading state

**DADO** Settings ainda está a carregar  
**ENTÃO** a UI não apresenta valores inventados como se fossem persistidos.

### AC-10-25 — Validation preserves other edits

**DADO** múltiplos campos editados  
**QUANDO** um campo falha validação  
**ENTÃO** os restantes valores introduzidos permanecem disponíveis para correção/save.

### AC-10-26 — Keyboard-only use

**QUANDO** o utilizador navega apenas por teclado  
**ENTÃO** consegue editar, guardar e compreender erros/locks.

### AC-10-27 — Narrow mobile viewport

**DADO** viewport móvel estreito  
**ENTÃO** Settings continua utilizável sem horizontal scroll obrigatório.

### AC-10-28 — Locked field accessible explanation

**DADO** Trip currency bloqueada  
**QUANDO** tecnologia assistiva lê o controlo  
**ENTÃO** o estado locked e a razão são compreensíveis programaticamente.

### AC-10-29 — No secret logging

**QUANDO** uma alteração de settings é registada em logs  
**ENTÃO** tokens/sessões/secrets não são registados desnecessariamente.

### AC-10-30 — Refresh after save

**DADO** uma alteração guardada com sucesso  
**QUANDO** a página é recarregada  
**ENTÃO** os valores persistidos continuam corretos.

---

## 22. Data/architecture requirements

Architecture and Database agents must define implementation detail after approval, preserving these constraints:

- user preference row is one-to-one with authenticated owner identity/profile as defined by Module 01;
- no duplicate preference records due to onboarding/settings retries;
- currency codes stored canonically as ISO codes, not localized labels;
- locale stored as supported locale identifier;
- no settings table duplicates canonical Trip fields unnecessarily;
- Trip-level changes route through canonical Trip/domain operations;
- RLS/authorization protects profile and Trip preferences;
- migrations are non-destructive unless explicitly approved;
- preference additions should be backwards-compatible where practical.

Do not introduce a generic untyped JSON “settings blob” for all critical preferences unless Architecture provides a strong reason and validation strategy. Critical preferences need typed validation.

---

## 23. Observability requirements

Safe product events may include:

- `settings_opened`;
- `profile_name_updated`;
- `default_currency_updated`;
- `locale_updated`;
- `trip_settings_opened`;
- `trip_currency_change_succeeded`;
- `trip_currency_change_blocked`;
- `traveller_count_updated`;
- `settings_save_failed`.

Events must not include authentication secrets or unnecessary private content.

Analytics is non-blocking for MVP unless infrastructure already exists.

---

## 24. Agent requirements

### Architecture Agent

Must define:

- account preference ownership/model;
- supported currency/locale validation source;
- canonical update boundaries between Settings and Trips/Finance;
- stale/concurrent update strategy;
- route protection and data-fetching strategy.

### Design Agent

Must define:

- clear separation of account vs Trip settings;
- saved/dirty/error/locked states;
- explanatory copy for future-only defaults and locked currency;
- mobile and accessibility behavior;
- no confusing destructive controls mixed with ordinary preferences.

### Database Agent

Must ensure:

- one profile/preference row per user as appropriate;
- owner-only policies;
- validation-compatible schema;
- no duplicated canonical Trip finance state.

### Backend Agent

Must enforce:

- trusted validation;
- authorization;
- currency lock rules through canonical domain logic;
- idempotent profile preference updates;
- no retroactive conversions.

### Frontend Agent

Must:

- render canonical values;
- not simulate unsupported preference changes;
- show lock reasons;
- preserve edits on recoverable errors;
- revalidate successful saves.

### QA Agent

Must validate all acceptance scenarios in this spec plus regressions affecting Modules 01, 02, 04 and 05.

### Security Agent

This module does not require its own dedicated milestone, but its authorization and validation behavior is included in the final all-modules security audit.

---

## 25. Product decisions for approval

| ID | Decision | Recommendation |
|---|---|---|
| P10-01 | Account Settings MVP contains display name, default currency and locale | APPROVE |
| P10-02 | Account default currency affects new Trips only | APPROVE |
| P10-03 | Changing locale affects presentation only, never canonical stored values | APPROVE |
| P10-04 | Existing Trip base currency is independent from account default | APPROVE |
| P10-05 | Trip currency is editable only while canonical finance rules permit it | APPROVE |
| P10-06 | Once finance data exists, currency change is locked in MVP instead of offering automatic historical conversion | APPROVE |
| P10-07 | Traveller count is editable but never auto-multiplies/divides costs | APPROVE |
| P10-08 | Settings does not duplicate Trip edit/archive/delete business logic | APPROVE |
| P10-09 | Notification/theme/billing/collaboration preferences are out of MVP | APPROVE |
| P10-10 | Email change/account deletion/data-export center are separate future/security-compliance specs | APPROVE |
| P10-11 | Critical preferences use typed validation rather than an unrestricted settings JSON blob | APPROVE |
| P10-12 | `pt-PT` remains baseline locale and `EUR` onboarding default, while architecture supports adding more locales/currencies | APPROVE |

---

## 26. Definition of Ready for implementation

This module may move from `REVIEW` to `APPROVED` when:

- P10-01 through P10-12 are approved or explicitly modified by the product owner;
- no contradiction remains with approved Modules 01, 02, 04 or Product Spec;
- account defaults vs Trip-specific data ownership is explicit;
- currency-lock behavior is explicit;
- acceptance scenarios are testable;
- out-of-scope settings are explicit.

After approval, the Product Spec phase for MVP modules 01–10 is complete and the Orchestrator may move to the next gated phase defined by `CLAUDE.md` / `project-state.json`.
