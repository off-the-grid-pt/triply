# Agent Board — Triply

Machine truth: `project-state.json`. This board is a human-readable summary.

## Workflow
`architecture → design → database → backend → frontend → qa → done`

Routine stages auto-advance after score >= 90 and passing gates. Material decisions escalate to the owner.

## Queue
| # | Module | Depends on | Status |
|---|---|---|---|
| 01 | Authentication & Onboarding | — | spec REVIEW — ready for owner approval |
| 02 | Trips | 01 | pending |
| 03 | Destinations & Travel Legs | 02 | pending |
| 04 | Budget & Expenses | 02,03 | pending |
| 05 | Savings Plan | 04 | pending |
| 06 | Daily Itinerary | 02,03 | pending |
| 07 | Reservations & Checklists | 03,06 | pending |
| 08 | Documents | 02,07 | pending |
| 09 | Dashboard | 03–08 | pending |
| 10 | Settings & Preferences | 01 | pending |

## Security milestones
- After module 01.
- After module 08.
- Before production release.
