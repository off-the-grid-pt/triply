# Triply Design System
Version: 1.0 — Notion dark adaptation
Status: Implemented and validated on 2026-09-07, under the visual direction authorized by the owner on 2026-09-06.

## Source and adaptation
Reference: https://design.aioxsquad.ai/design/notion_getdesign?tag=dark
Verified source: `/data/companies/notion/designs/notion_getdesign/preview.json`, `modes.dark`.
The accompanying DESIGN.md mainly describes the light marketing site. The selected dark preview governs colors; the document informs typography, restrained borders, spacing and component geometry.

Triply uses the same quiet dark canvas, blue actions and compact controls, adapted to a travel workspace. A persistent desktop sidebar and a mobile disclosure keep trip sections reachable. Ordered stays, connecting travel legs, dates and financial labels take precedence over decoration. No invented metrics, destinations or reservations appear in authenticated pages.

## Semantic tokens
| Token | Value | Role |
| --- | --- | --- |
| background | #111111 | Page canvas |
| foreground | #f6f5f4 | Primary content |
| card | #1a1a1a | Cards, form panels |
| surface | #181818 | Sidebar, supporting panels |
| muted | #202020 | Hover, subtle fill |
| muted-foreground | #a3a3a3 | Secondary text |
| primary | #0075de | Main action |
| primary-hover | #005bab | Hover/pressed action |
| primary-foreground | #ffffff | Text on primary |
| link | #62aef0 | Inline links on dark surfaces |
| border | #ffffff24 | Structural borders |
| input | #73716e | Discernible control borders |
| ring | #62aef0 | Keyboard focus |
| success / success-muted | #78dca0 / #173327 | Completion and positive feedback |
| warning / warning-muted | #f0be78 / #33291b | Review and attention |
| destructive / destructive-muted | #ff9e9e / #391f23 | Errors and destructive actions |
| danger / danger-hover | #a72f3c / #8c2330 | Destructive button backgrounds |

Use semantic Tailwind utilities mapped to these CSS variables. Do not invert neutral palettes or use raw hex colors inside JSX. Information must never rely only on color. Financial labels remain explicit: estimated, forecast, committed, paid and actual. Values retain currency and absent values remain absent.

## Type and spacing
System sans stack (`Inter` when locally available, otherwise system-ui, Segoe UI, Arial); no proprietary font downloads or runtime font vendor. Body 16px/1.5, secondary UI 14px/1.5, metadata 12px. Headings use 600–700 weight and negative tracking: page 32–48px, section 20–24px. Display marketing copy can reach 64px. Use tabular numerals for money.

Spacing scale: 4, 8, 12, 16, 24, 32, 40, 64px. Content width up to 1200px; focused forms 640–768px. Desktop sidebar 232px, mobile single column with 16–20px gutters. Avoid page-level horizontal scrolling; long identifiers wrap and ordered route summaries can scroll within their own region.

## Components
- Controls: 4px radius, minimum 44px touch height, visible border, stable geometry on hover.
- Cards: 12px radius, thin border, no prominent shadow. Featured panels: 16px radius.
- Badges: full radius; concise text, optional semantic tint.
- Primary actions: blue; secondary actions: transparent or muted with border; destructive actions: separate red treatment and existing explicit confirmation.
- Inputs: dark card surface, clear label, helper text where needed, visible invalid border and associated error message. Selects and date/file inputs use dark browser controls.
- Focus: 2px light-blue outline with 3px offset; not removed by focus reset utilities.
- Navigation: named landmarks, active page indication, desktop sidebar, native mobile disclosure, skip link to main content.
- Progress: semantic progress element or labelled progressbar; textual amount/percentage remains visible.
- Motion: color transitions around 150ms only; honor reduced motion. No bounce or scale-on-click.

## Page composition
- Landing and authentication: editorial headline, blue CTA, quiet route illustration explicitly identified as an example; compact forms.
- Trips: workspace heading, active trip cards, separate archive section, useful empty-state action.
- Trip: contextual sidebar, editorial trip header, financial and savings panels, attention list, ordered route and daily planning. Existing route management remains reachable.
- Finance: labelled metrics and grouped category/destination breakdowns; all original actions and transaction history retained.
- Savings: prominent remaining amount, progress and explanatory target basis, rhythm cards only in valid domain states.
- Itinerary: chronological day sections and ordered events with local timezone context.
- Reservations/checklist: distinct sections and existing controls; document catalogue: filters then results; settings: focused form panels.
- All new/edit forms: common control, heading, panel and validation language.

## Required states and acceptance
Loading, empty, error, success, disabled and destructive states remain visible and accessible. Every existing field, route, action, confirmation and domain helper is retained. Test keyboard focus, mobile navigation, overflow at 375px and desktop layout at 1440px. Public `/design-system` contains synthetic examples only, never authenticated data. Run repository typecheck, build, unit, E2E and harness tests; failures cannot be reported as PASS.

## 21st.dev references
On 2026-09-07, the existing Cursor MCP connection to `https://21st.dev/api/mcp` successfully completed initialize and free catalog search. The separate CLI login returned HTTP 401. No credentials were printed or copied into this project.

References were selected from actual MCP search results and their preview images inspected:
- [Dashboard Sidebar by arunjdass](https://21st.dev/@arunjdass/components/dashboard-sidebar), demo 14941: separate workspace/trip navigation groups, quiet active row and fixed content frame. Adapted in AppShell.
- [Trip Details Card by kavikatiyar](https://21st.dev/@kavikatiyar/components/trip-details-card), demo 7957: distinct lower action strip. Adapted in TripCard, retaining multi-stop trip semantics and existing fields.
- [Financial Dashboard by ravikatiyar162](https://21st.dev/@ravikatiyar162/components/financial-dashboard), demo 8253: activity rows with labels/dates left and monetary amounts/actions right. Adapted in FinanceDashboard; no banking features added.
- [Timeline by preetsuthar17](https://21st.dev/@preetsuthar17/components/timeline), demo 5157: connected markers and chronological hierarchy. Adapted to numbered local trip days in ItineraryTimeline.

These are visual references; components are implemented in the existing stack. No paid source retrieval, copied component source, extra library or runtime service was used.
