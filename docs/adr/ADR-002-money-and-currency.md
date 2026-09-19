# ADR-002 — Money and currency model
Status: accepted
Date: 2026-09-01

## Context
Triply must compare estimated and real costs across multiple destinations and currencies without rounding drift.

## Decision
- Persist authoritative money as integer minor units plus ISO 4217 currency code.
- Preserve the original amount/currency.
- When a value is normalized to the trip base currency, persist the normalized minor-unit amount and the conversion metadata used for that value.
- MVP conversion may be user-entered/confirmed; no live FX vendor is required.
- Never use JavaScript binary floating-point for authoritative monetary totals.
- Centralize money arithmetic in tested domain helpers.

## Consequences
- UI formatting is separate from persisted representation.
- Currencies with non-standard minor units require a currency metadata helper rather than assuming two decimals.
- Historical normalized amounts never silently change because a future exchange rate changes.
