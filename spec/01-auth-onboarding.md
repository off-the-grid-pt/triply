# SPEC — Module 01: Authentication & Onboarding

Version: 1.1  
Status: APPROVED
Module ID: `01-auth-onboarding`  
Depends on: `spec/00-product.md`, `AGENTS.md`, `docs/adr/ADR-001-baseline-stack.md`  
Security milestone: required after module completion

---

## Approved amendment — email confirmation optional

Owner explicitly requested removal of the email verification requirement on 2026-09-07. This amendment supersedes all mandatory verification gates, resend screens, verification-pending success states and A-02 references below. RN-03 is replaced accordingly. Successful password signup with a provider session enters onboarding; login with a valid session requires no email-confirmed timestamp. Signup without a session must remain unauthenticated and show a recoverable error. Supabase Email provider Confirm email must be disabled separately. Password recovery still requires its valid recovery link. Private ownership, RLS, session validation and anti-enumeration requirements remain unchanged.

## 1. Purpose

Provide a secure private identity and first-run experience for Triply.

This module allows a person to create an account, verify ownership of their email address, sign in, recover access, sign out, establish minimal profile/preferences, and enter their private Triply workspace.

The module must make the path from **first visit → authenticated workspace → create first trip** short and understandable. Actual trip creation belongs to Module 02.

---

## 2. Product outcome

When this module is complete, a user can:

1. create a Triply account with email and password;
2. verify their email address;
3. sign in securely;
4. remain signed in across normal browser navigation according to the authenticated session lifetime;
5. sign out from the current session;
6. request and complete password recovery;
7. complete minimal onboarding preferences;
8. access only their own private workspace;
9. reach a clear empty-state CTA to create their first trip;
10. be redirected safely when authentication or onboarding state is incomplete.

---

## 3. Actors

### 3.1 Visitor

A person without an authenticated Triply session.

Can:
- view public authentication screens;
- create an account;
- sign in;
- request password recovery;
- complete an email-verification or password-reset link flow.

Cannot:
- access private Triply routes or user-owned data.

### 3.2 Authenticated user — onboarding incomplete

A user with a valid authenticated session whose required onboarding fields have not yet been completed.

Can:
- access onboarding;
- sign out;
- complete onboarding.

Cannot:
- enter normal private product routes until onboarding is complete, except routes explicitly required for account/security handling.

### 3.3 Authenticated user — onboarding complete

A user with a valid session and completed onboarding.

Can:
- enter the private Triply workspace;
- continue to Module 02 functionality when available;
- access account/session actions permitted by the application.

---

## 4. Scope

### Included

- email/password account creation;
- email verification;
- sign in;
- sign out;
- forgot-password request;
- password reset;
- secure authenticated session handling;
- authenticated-route protection;
- minimal onboarding;
- private user profile/preferences record;
- default locale and currency selection;
- first-trip empty state / CTA handoff to Module 02;
- loading, success, empty and error states for all flows;
- ownership/RLS foundations for user-owned data;
- security review after completion.

### Explicitly out of scope

- Google, Apple, Facebook or other OAuth/social login;
- magic-link-only authentication as the primary sign-in method;
- passkeys;
- multi-factor authentication;
- organisations, teams or workspaces shared by several accounts;
- invitations;
- collaborative trips;
- username-based login;
- public profiles;
- profile avatars;
- billing/subscriptions;
- account deletion workflow;
- changing email address;
- changing password from account settings after sign-in;
- trip creation logic itself;
- marketing website content.

These may be introduced only through future approved specs.

---

## 5. Canonical data concepts

Implementation detail is owned by Architecture/Database agents, but product behaviour requires the following conceptual records.

### 5.1 Auth identity

Managed by the approved authentication provider.

Required identity attributes:
- stable user ID;
- email;
- email verification state;
- authentication timestamps/session metadata supplied by the provider.

### 5.2 Triply user profile

A private product record associated one-to-one with an authenticated identity.

Required MVP product fields:

| Field | Requirement |
|---|---|
| `user_id` | Required, unique owner link |
| `display_name` | Required after onboarding |
| `default_currency` | Required after onboarding; ISO 4217 code |
| `locale` | Required after onboarding; MVP default `pt-PT` |
| `onboarding_completed_at` | Null until onboarding is complete |
| `created_at` | Required |
| `updated_at` | Required |

The Database agent may add technical fields, but must not add new user-facing profile requirements without a spec change.

---

## 6. Global business rules

### RN-01 — Private by default

All authenticated Triply data is private to its owner. A valid authenticated user must never gain access to another user's profile or future user-owned records through direct URL, client manipulation or query changes.

### RN-02 — Email is the MVP login identifier

The MVP uses email + password. Usernames and phone-number authentication are not supported.

### RN-03 — Email verification is not an access prerequisite

A valid provider-authenticated email/password session is sufficient to enter onboarding or the private workspace. Triply must not require email_confirmed_at or sign out a valid session solely because that timestamp is absent. Disable Confirm email in the Supabase Email provider; never emulate a session, auto-confirm through a public admin endpoint or weaken ownership policies. Legacy verification URLs redirect to sign-in with recoverable feedback for invalid links.

### RN-04 — Password handling

Triply never stores or logs plaintext passwords.

The product requires a password of at least **8 characters**. The UI may provide strength guidance, but must not invent additional mandatory composition rules unless the authentication/security layer requires them and the product spec is updated.

### RN-05 — Secure sessions

Authentication tokens must follow `AGENTS.md`: never persisted in `localStorage` or `sessionStorage`.

Normal authenticated navigation must rely on the approved secure server-managed session mechanism.

### RN-06 — Generic credential errors

Sign-in errors must not disclose whether a particular email address is registered.

Example user-facing behaviour: `Não foi possível iniciar sessão. Verifique os seus dados e tente novamente.`

### RN-07 — Recovery must avoid account enumeration

The forgot-password request always returns a neutral success state whether or not an account exists for the supplied email.

Example: `Se existir uma conta associada a este email, receberá uma ligação para redefinir a palavra-passe.`

### RN-08 — Onboarding gate

A verified authenticated user whose `onboarding_completed_at` is null is routed to onboarding before normal private product screens.

### RN-09 — Minimal onboarding only

The onboarding form contains only:
- display name;
- default currency;
- locale/language.

No travel-preference questionnaire, budget questionnaire, destination interests or marketing survey is required in the MVP.

### RN-10 — Onboarding defaults

For the initial product:
- locale defaults to `pt-PT`;
- default currency defaults to `EUR`.

Both are editable before onboarding completion.

Architecture must allow additional supported locales/currencies later.

### RN-11 — Display name

`display_name` is required to complete onboarding.

Rules:
- trim leading/trailing whitespace;
- must contain at least 1 visible character after trimming;
- maximum 80 characters;
- no uniqueness requirement.

### RN-12 — Default currency

The selected default currency is a user preference for new trips and product defaults. It does **not** retroactively modify the base currency of existing trips.

Trip-specific currency behaviour is defined by later modules and ADR-002.

### RN-13 — Locale

Locale controls Triply UI formatting/copy where implemented. Changing locale later must not alter stored monetary values, dates or trip content.

### RN-14 — Successful onboarding

On completion, Triply records `onboarding_completed_at` and routes the user to their private home/empty workspace.

When Module 02 is available, that screen prominently offers `Criar a minha primeira viagem` (or approved equivalent).

### RN-15 — Onboarding is idempotent

Submitting onboarding twice because of retry, refresh or network race must not create duplicate profiles or corrupt preferences.

### RN-16 — Sign out

Signing out invalidates the current Triply session as supported by the auth provider and redirects to the public sign-in entry point.

Private pages must no longer be accessible through normal navigation after sign-out.

### RN-17 — Expired/invalid session

If an authenticated session expires or becomes invalid, private actions must fail safely and the user must be routed to sign in without exposing private data.

### RN-18 — Redirect safety

Post-auth redirects may return the user to an intended **internal Triply route**. External/open redirect targets are forbidden.

### RN-19 — Verification links

Invalid, expired or already-consumed verification links must show a recoverable state with a safe path to sign in or request a new verification email when supported.

### RN-20 — Password reset links

Invalid or expired reset links must never leave the user in a partially authenticated private state. Show a clear error and a path to request another reset.

### RN-21 — No silent account linking

Creating an account using an email already associated with an existing account must not create a duplicate Triply profile. The UI should show a safe generic/auth-provider-compatible response.

### RN-22 — Rate/abuse handling

If the auth provider rate-limits registration, sign-in, verification resend or recovery actions, Triply must surface a non-technical retry-later state and must not attempt uncontrolled automatic retries.

### RN-23 — No sensitive logging

Passwords, auth tokens, reset tokens, verification tokens and full authentication payloads must never be written to application logs, analytics events or client error telemetry.

### RN-24 — Accessibility

Authentication and onboarding must be fully operable by keyboard, expose semantic labels and provide accessible validation/error feedback.

### RN-25 — Mobile-first

All auth/onboarding flows must be usable on a narrow mobile viewport without horizontal scrolling or inaccessible controls.

---

## 7. Primary flows and acceptance criteria

Acceptance scenarios use **DADO / QUANDO / ENTÃO** so QA can map them directly into tests.

### FL-01 — Create account successfully

**DADO** que o visitante está na página de criação de conta  
**QUANDO** introduz um email válido, uma palavra-passe válida, aceita a ação de criar conta e o provedor aceita o registo  
**ENTÃO** Triply cria/associa uma única identidade  
**E** apresenta o estado de verificação de email  
**E** não permite acesso normal ao workspace antes da verificação.

### FL-02 — Invalid sign-up input

**DADO** que o visitante está a criar conta  
**QUANDO** o email é sintaticamente inválido ou a palavra-passe tem menos de 8 caracteres  
**ENTÃO** o formulário não é submetido  
**E** cada campo inválido recebe feedback associado  
**E** os valores não sensíveis permanecem disponíveis para correção.

### FL-03 — Existing email during sign-up

**DADO** que o email já pertence a uma conta  
**QUANDO** o visitante tenta criar outra conta com esse email  
**ENTÃO** Triply não cria um segundo perfil  
**E** apresenta uma resposta segura compatível com a política anti-enumeração  
**E** oferece acesso ao fluxo de sign-in/recovery sem revelar dados da conta.

### FL-04 — Verify email

**DADO** que o utilizador criou uma conta ainda não verificada  
**QUANDO** abre uma ligação de verificação válida  
**ENTÃO** a identidade passa a verificada  
**E** o utilizador é encaminhado para sign-in ou onboarding conforme o estado de sessão  
**E** nunca salta o onboarding obrigatório.

### FL-05 — Invalid verification link

**DADO** que o utilizador abre uma ligação de verificação inválida, expirada ou consumida  
**QUANDO** Triply processa a ligação  
**ENTÃO** apresenta um erro não técnico  
**E** fornece uma ação segura para regressar ao sign-in  
**E**, quando suportado, permite solicitar nova verificação.

### FL-06 — Sign in successfully

**DADO** que existe uma conta verificada  
**QUANDO** o utilizador introduz credenciais válidas  
**ENTÃO** é criada/restaurada uma sessão segura  
**E**, se onboarding estiver incompleto, é encaminhado para onboarding  
**E**, se onboarding estiver completo, é encaminhado para o workspace privado ou para um destino interno seguro previamente solicitado.

### FL-07 — Sign in fails

**DADO** que o visitante tenta iniciar sessão  
**QUANDO** as credenciais não são aceites  
**ENTÃO** nenhuma área privada é apresentada  
**E** a mensagem não confirma se o email existe  
**E** o utilizador pode tentar novamente ou iniciar recuperação de palavra-passe.

### FL-08 — Unverified user signs in

**DADO** que a conta existe mas o email ainda não foi verificado  
**QUANDO** o utilizador tenta iniciar sessão  
**ENTÃO** Triply não permite acesso normal ao workspace  
**E** mostra o estado de verificação pendente  
**E** permite reenviar a verificação quando suportado e não rate-limited.

### FL-09 — Request password recovery

**DADO** que o visitante está no fluxo `Esqueci-me da palavra-passe`  
**QUANDO** submete um email sintaticamente válido  
**ENTÃO** Triply apresenta sempre a resposta neutra definida em RN-07  
**E** não revela se a conta existe.

### FL-10 — Complete password reset

**DADO** que o utilizador abriu uma ligação de recuperação válida  
**QUANDO** define e confirma uma nova palavra-passe válida  
**ENTÃO** a palavra-passe é atualizada pelo provedor  
**E** Triply apresenta confirmação  
**E** encaminha para sign-in ou para uma sessão segura conforme a estratégia técnica aprovada  
**E** nunca expõe o token de recuperação.

### FL-11 — Password confirmation mismatch

**DADO** que o utilizador está a definir uma nova palavra-passe  
**QUANDO** `nova palavra-passe` e `confirmar palavra-passe` não coincidem  
**ENTÃO** o formulário não é submetido  
**E** o erro é apresentado de forma acessível.

### FL-12 — First onboarding load

**DADO** que o utilizador está autenticado, verificado e sem onboarding completo  
**QUANDO** entra na aplicação  
**ENTÃO** Triply apresenta onboarding  
**E** pré-seleciona `pt-PT` e `EUR` quando não existirem preferências  
**E** solicita o display name.

### FL-13 — Complete onboarding

**DADO** que o utilizador está no onboarding  
**QUANDO** fornece display name válido, moeda suportada e locale suportado  
**ENTÃO** o perfil é guardado de forma idempotente  
**E** `onboarding_completed_at` é definido  
**E** o utilizador entra no workspace privado  
**E** vê a próxima ação para criar a primeira viagem quando Module 02 estiver disponível.

### FL-14 — Onboarding validation fails

**DADO** que o onboarding está aberto  
**QUANDO** existe um campo obrigatório inválido ou não suportado  
**ENTÃO** nenhum estado de onboarding completo é gravado  
**E** os erros aparecem junto dos campos  
**E** o utilizador pode corrigir e submeter novamente.

### FL-15 — Network/server error during onboarding

**DADO** que os campos de onboarding são válidos  
**QUANDO** o pedido falha por erro transitório  
**ENTÃO** Triply mantém o utilizador no onboarding  
**E** não marca onboarding como concluído  
**E** apresenta uma mensagem de erro com opção de tentar novamente  
**E** não cria perfis duplicados após retry.

### FL-16 — Access private route while signed out

**DADO** que não existe sessão válida  
**QUANDO** alguém abre diretamente uma rota privada  
**ENTÃO** nenhum conteúdo privado é renderizado  
**E** é encaminhado para sign-in  
**E** a aplicação pode preservar apenas um destino interno seguro para retorno após autenticação.

### FL-17 — Access normal private route before onboarding

**DADO** que existe sessão verificada mas onboarding está incompleto  
**QUANDO** o utilizador abre uma rota privada normal  
**ENTÃO** é encaminhado para onboarding  
**E** não consegue contornar o gate alterando apenas o URL no cliente.

### FL-18 — Sign out

**DADO** que o utilizador está autenticado  
**QUANDO** seleciona `Terminar sessão`  
**ENTÃO** a sessão é encerrada  
**E** o utilizador é encaminhado para sign-in  
**E** voltar para trás no browser não deve reexpor dados privados sem uma nova sessão válida.

### FL-19 — Session expires during use

**DADO** que o utilizador estava autenticado  
**QUANDO** a sessão deixa de ser válida durante uma ação privada  
**ENTÃO** a operação não continua como autenticada  
**E** Triply encaminha para autenticação com feedback apropriado  
**E** não apresenta dados de outro utilizador nem estados inconsistentes.

### FL-20 — Malicious redirect attempt

**DADO** que uma rota de auth recebe um parâmetro de retorno externo ou não permitido  
**QUANDO** o fluxo termina  
**ENTÃO** Triply ignora o destino inseguro  
**E** redireciona para um destino interno padrão.

---

## 8. Required screens / UX states

Exact visual design belongs to Design Agent. Product requires these surfaces/states.

### 8.1 Create account

Required controls:
- email;
- password;
- primary create-account action;
- link to sign in.

Required states:
- idle;
- field validation;
- submitting;
- provider error;
- success / verification pending.

### 8.2 Verification pending/result

Must communicate:
- email verification is required;
- where the verification was sent when safe to show the user-entered address;
- resend capability when supported;
- success, expired/invalid and rate-limited states.

### 8.3 Sign in

Required controls:
- email;
- password;
- sign-in action;
- forgot-password link;
- link to account creation.

### 8.4 Forgot password

Required:
- email field;
- submit action;
- neutral completion state;
- return to sign in.

### 8.5 Reset password

Required:
- new password;
- confirmation;
- submit;
- invalid/expired-link state;
- success state.

### 8.6 Onboarding

Required:
- welcome/context copy;
- display name;
- default currency selector;
- locale selector;
- single primary completion action.

It should be a short first-run setup, not a multi-step survey unless Design proves a multi-step presentation improves clarity without introducing new requirements.

### 8.7 Empty private workspace

Before the user has a trip, the authenticated product must not look broken or blank.

Required content when Module 02 exists:
- concise welcome;
- explanation that no trips exist yet;
- primary action to create the first trip.

Module 01 may implement only the handoff shell/placeholder if Module 02 has not yet been implemented.

---

## 9. User-facing copy guidance

Default UI locale is Portuguese (Portugal).

Preferred terminology:

| Concept | pt-PT |
|---|---|
| Sign in | `Iniciar sessão` |
| Sign out | `Terminar sessão` |
| Create account | `Criar conta` |
| Password | `Palavra-passe` |
| Forgot password | `Esqueci-me da palavra-passe` |
| Reset password | `Redefinir palavra-passe` |
| Email verification | `Verificar email` |
| Display name | `Nome` |
| Default currency | `Moeda predefinida` |
| Language/locale | `Idioma` |

Copy must be concise and non-technical. Do not expose raw Supabase/provider error strings to users.

---

## 10. Validation rules

### Email
- required;
- trim surrounding whitespace;
- validate reasonable email syntax client-side;
- authoritative acceptance remains with auth provider;
- normalize only according to provider-safe behaviour; do not invent domain rewriting.

### Password — create/reset
- required;
- minimum 8 characters;
- maximum should follow provider/security constraints without silently truncating;
- no plaintext logging;
- reset screen requires confirmation equality.

### Display name
- required for onboarding completion;
- 1–80 visible characters after trimming.

### Default currency
- required;
- must be from the application-supported ISO 4217 list;
- default `EUR`.

### Locale
- required;
- must be from the application-supported locale list;
- MVP default `pt-PT`.

---

## 11. Authorization and privacy requirements

These are release-blocking.

1. User profile must have owner-scoped RLS.
2. Anonymous users cannot read Triply user profiles.
3. One authenticated user cannot read/update another user's profile.
4. Private route protection cannot rely only on hiding UI controls.
5. Authentication/session secrets never reach logs or public client configuration except provider-defined public keys explicitly intended for clients.
6. Server-side/private data access must derive user identity from authenticated context, not from a client-supplied arbitrary `user_id`.
7. Error monitoring/analytics must redact sensitive authentication material.
8. Security Agent must audit the module after QA and before the security milestone is marked complete.

---

## 12. Error-state catalogue

| ID | Situation | Required behaviour |
|---|---|---|
| AUTH-E01 | Invalid email syntax | Inline validation, no submit |
| AUTH-E02 | Password too short | Inline validation, no submit |
| AUTH-E03 | Invalid credentials | Generic sign-in error |
| AUTH-E04 | Email not verified | Verification-required state |
| AUTH-E05 | Sign-up rejected/duplicate | Safe generic/provider-compatible response |
| AUTH-E06 | Verification link invalid/expired | Recoverable verification error |
| AUTH-E07 | Recovery request rate-limited | Retry-later state without account disclosure |
| AUTH-E08 | Reset token invalid/expired | Do not reset; offer new recovery request |
| AUTH-E09 | Reset passwords mismatch | Inline validation |
| AUTH-E10 | Session missing/expired | Clear private state and route to sign in |
| AUTH-E11 | Onboarding save failed | Preserve form, not completed, retry action |
| AUTH-E12 | Unsupported currency/locale | Validation error, no completion |
| AUTH-E13 | Profile ownership violation | Deny access; no leaked record details |
| AUTH-E14 | Unsafe redirect | Ignore and use safe internal destination |
| AUTH-E15 | Provider unavailable/transient error | Non-technical retry state; no infinite retry |

---

## 13. Analytics / product events

Analytics is optional at implementation time unless an approved analytics solution exists. If emitted, event payloads must contain no password, token, recovery link or sensitive auth payload.

Allowed conceptual events:
- `sign_up_started`;
- `sign_up_completed`;
- `email_verification_completed`;
- `sign_in_completed`;
- `password_recovery_requested`;
- `password_reset_completed`;
- `onboarding_completed`;
- `sign_out_completed`.

Do not include the user's raw password, auth token or recovery/verification token. Avoid sending raw email unless the approved analytics/privacy policy explicitly allows it.

---

## 14. Architecture constraints for downstream agents

The Architecture Agent must propose the implementation while respecting:

- Next.js App Router + strict TypeScript baseline from ADR-001;
- Supabase Auth as the approved identity provider;
- secure server-managed session/cookie handling compatible with Supabase SSR patterns;
- no auth tokens in browser storage;
- Supabase PostgreSQL profile record;
- RLS for profile ownership;
- server-derived authenticated identity;
- safe internal redirect allowlisting/validation;
- clear separation between auth identity and Triply product profile;
- future localisation support;
- no new auth vendor or dependency without escalation.

The Product Spec controls behaviour; Architecture decides route/file/component structure.

---

## 15. Database requirements for downstream agents

Database Agent must at minimum prove:

- one profile per authenticated user;
- profile cannot be owned by a different user;
- owner-only SELECT/UPDATE policy;
- safe profile creation/upsert path compatible with onboarding idempotency;
- required timestamps;
- supported currency/locale validation strategy without creating brittle data that blocks future expansion;
- no security-definer function or trigger that bypasses RLS without explicit documented reason and security review.

Exact SQL/schema belongs to Database Agent.

---

## 16. QA requirements

QA must test at minimum:

### Functional
- sign-up success;
- sign-up invalid fields;
- duplicate/existing email behaviour;
- verification success/failure;
- verified sign-in;
- invalid credentials;
- unverified-user gate;
- recovery request;
- reset success;
- expired reset;
- onboarding success;
- onboarding validation;
- onboarding retry/idempotency;
- sign-out;
- expired session;
- private-route redirect;
- onboarding-route gate;
- safe redirect behaviour.

### Authorization
- user A cannot read/update user B profile;
- anonymous access is denied;
- client-supplied foreign user ID cannot bypass ownership.

### UX
- mobile viewport;
- keyboard-only path;
- accessible labels/errors;
- loading states prevent accidental duplicate submissions;
- raw provider errors are not shown.

### Regression
- TypeScript passes;
- build passes;
- unit/integration tests pass;
- auth E2E suite passes;
- scope checker passes;
- harness score >= 90.

---

## 17. Security milestone acceptance

The post-module Security Agent must explicitly review:

1. session storage/cookies;
2. auth callback handling;
3. redirect validation;
4. email enumeration exposure;
5. password/reset handling;
6. RLS/profile ownership;
7. logs and telemetry;
8. environment variable exposure;
9. CSRF-relevant behaviour for state-changing auth/profile actions where applicable;
10. open redirects;
11. rate-limit/provider abuse behaviour;
12. private-route server/client consistency.

Any Critical or High finding blocks module completion.

---

## 18. Definition of done

Module 01 is `DONE` only when:

- this spec is `APPROVED`;
- Architecture plan is approved by automated gates or human escalation rules;
- Design is consistent with this spec and design-system spec;
- database/profile/RLS requirements are implemented;
- auth/backend behaviour is implemented;
- frontend states are implemented;
- all acceptance flows pass QA;
- no Critical/High security finding remains;
- harness score is >= 90;
- scope validation passes;
- project state records completion and security milestone outcome.

---

## 19. Product decisions encoded in this module

The following choices are proposed as the MVP behaviour for owner review:

| ID | Decision |
|---|---|
| A-01 | Email + password only for MVP; no social OAuth |
| A-02 | Email verification required before normal workspace access |
| A-03 | Password minimum is 8 characters; no additional mandatory composition rule in product scope |
| A-04 | Minimal onboarding = display name + default currency + locale |
| A-05 | Display name is required to complete onboarding |
| A-06 | Defaults are `EUR` and `pt-PT` |
| A-07 | Incomplete onboarding gates normal private product routes |
| A-08 | Account deletion/change-email/change-password-in-settings are outside Module 01 MVP |
| A-09 | Analytics is non-blocking unless an approved analytics provider already exists |
| A-10 | Module must pass a dedicated security milestone before completion |

Approval of this spec approves A-01 through A-10 unless individually edited.
