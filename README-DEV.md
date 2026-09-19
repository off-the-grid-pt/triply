# Triply — Developer Quick Start

1. Copy `.env.example` values into `.env.local` using your Supabase project credentials.
2. Run `npm install`.
3. Run `npm run harness:ready`.
4. Run `npm run typecheck && npm run build && npm run test && npm run test:harness && npm run harness:typecheck`.
5. Only after all gates pass, start the Module 01 Architecture run.

Do not run the autonomous workflow against production credentials.


## Supabase

Follow `docs/SUPABASE-SETUP.md` before implementing Module 01 authentication.
