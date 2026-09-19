# ADR-004 — Private travel documents
Status: accepted
Date: 2026-09-01

## Context
The MVP includes travel-document organization. Uploaded documents may contain sensitive personal data.

## Decision
- Use a private Supabase Storage bucket.
- Authorize every object through authenticated ownership/RLS-compatible storage policies.
- Access files through authenticated download or short-lived signed URLs created after authorization.
- Store only metadata required by the approved product spec.
- Validate size and permitted content type on the server; client validation is only convenience.
- Never expose the bucket publicly or log document contents/identity numbers.
- Require a dedicated security audit before the Documents module is considered complete.

## Consequences
- Document previews/downloads are private operations.
- Signed URLs must be short-lived and generated on demand.
- Storage cleanup/replacement must be transactional enough to avoid orphaning or unintended data loss.
