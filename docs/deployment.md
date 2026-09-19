# Deploy Triply to Vercel

## Linked project

- Vercel account: `gpi35625-5793`.
- Team/project: `off-the-grid/triply`.
- Dashboard: https://vercel.com/off-the-grid/triply
- Assigned production URL: https://triply-blush-nine.vercel.app
- Production publication has not been performed by this configuration task.
- Git is initialized locally; GitHub remote and Git integration remain pending
  identification of the owner's repository and GitHub authentication.
- Production and Preview currently use the production site URL for email recovery;
  Development uses `http://localhost:3000`. Supabase configuration is shared with
  the existing local project. Use a separate Supabase project and callback URL if
  isolated preview data and authentication are required.
- Supabase Authentication URL Configuration still needs the assigned production
  URL and recovery callback below; this task has no Supabase management access.

Required hosted Supabase URLs:

```text
Site URL: https://triply-blush-nine.vercel.app
Redirect URL: https://triply-blush-nine.vercel.app/auth/callback
Recovery redirect: https://triply-blush-nine.vercel.app/auth/callback?next=/auth/update-password
```

## Project configuration

Use the repository root, the Next.js framework preset, `npm ci` for installation,
and `npm run build` for the build. These settings are recorded in `vercel.json`.
Use a Node.js version compatible with `package.json` (22.12.0 or later).
Keep the framework's default output directory; Triply requires server rendering.

## Environment variables

Configure these variables in Vercel before deploying, for each target environment:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL from `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The Supabase publishable key from `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | The application's HTTPS URL for that environment |

Do not use localhost as the deployed site URL. Password recovery uses this value.
Do not commit `.env.local` or upload it as source; configure variables in Vercel.
The application does not require a Supabase service-role key.

In Supabase Authentication URL Configuration, configure the production Site URL
and allow the application's `/auth/callback` URL, including the password recovery
redirect `/auth/callback?next=/auth/update-password`. Add the corresponding URLs
for any preview environment used to test authentication.
Verify the existing database migrations and private document bucket are provisioned
in the selected Supabase project before treating the deployment as ready.

## Link and deploy

Authenticate with `npx vercel login` if needed, then run `npx vercel link` to
select the intended account/team and project. Linking does not deploy.
Set environment variables before running `npx vercel` for a preview deployment.
After checking login, password recovery and authenticated trip pages, run
`npx vercel --prod` when production publication is authorized.

## Optional GitHub integration

Create or select the intended GitHub repository, add its URL as the local `origin`,
and publish the reviewed source when authorized. Never include environment files.
Connect that repository in Vercel's project Git settings for automatic deployments.
Check the production branch before enabling the integration: pushes can deploy.
GitHub is not required for deployment through the Vercel CLI.

References: [Vercel project linking](https://vercel.com/docs/cli/link),
[CLI deployment](https://vercel.com/docs/projects/deploy-from-cli).
