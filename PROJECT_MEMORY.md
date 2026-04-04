# Project Memory

## Purpose

`leaselogic-pro` is a Turkish leasing / machine financing calculator built with `Next.js 16`, `React 19`, `TypeScript`, and `Tailwind v4`. It is deployed on Vercel and protected by `Supabase Auth`.

Production URL:

- `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`

## Core Product Behavior

- Users must sign in with email + password
- Access is allowed only if the user exists in `Authentication > Users`
- The same email must also exist in `public.authorized_users`
- `authorized_users.is_active = true` means access allowed
- `authorized_users.is_active = false` means access blocked

## Main Entry Files

- `src/app/layout.tsx`: fonts, metadata, global shell
- `src/app/page.tsx`: home route entry
- `src/app/HomeClient.tsx`: login gate, session flow, calculator shell, sign-out
- `src/lib/supabase.ts`: browser Supabase client and env wiring
- `src/lib/financeCalculations.ts`: amortization math

## Finance UI Structure

Main calculator screens:

- `src/components/finance/ForwardCalculator.tsx`
- `src/components/finance/ReverseCalculator.tsx`
- `src/components/finance/AnnualForwardCalculator.tsx`
- `src/components/finance/AnnualReverseCalculator.tsx`
- `src/components/finance/PaymentFrequencySelector.tsx`

Supporting finance UI:

- `src/components/finance/AmortizationTable.tsx`
- `src/components/finance/CurrencyComparisonReport.tsx`
- `src/components/finance/ExpenseInputCard.tsx`
- `src/components/finance/ParameterCard.tsx`
- `src/components/finance/PrintablePDF.tsx`
- `src/components/finance/RateProjectionInput.tsx`
- `src/components/finance/ResultCard.tsx`
- `src/components/finance/machineModels.ts`
- `src/components/finance/format.ts`

UI primitives live in:

- `src/components/ui/*`

## Calculation Logic

`src/lib/financeCalculations.ts` contains the reusable math:

- `calculatePMT()`
- `generateAmortization()`
- `calculateAnnualPMT()`
- `generateAnnualAmortization()`
- `expandAnnualScheduleToMonthlyPdfRows()`

Shared result row type:

- `AmortizationRow`

## Authentication and Access Control

Supabase client-side auth is handled in:

- `src/lib/supabase.ts`
- `src/app/HomeClient.tsx`

Important behavior:

- session is read in the browser
- `signInWithPassword()` is used for login
- after login, the app checks `authorized_users`
- if the table read fails or the user is inactive, the app signs the user out

This app currently uses client-side auth gating. There is no `middleware.ts` and no API route protection layer.

## Supabase Setup Files

- `SUPABASE_SETUP.md`: operational setup notes
- `supabase-authorized-users.sql`: table + RLS creation SQL

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Important:

- do not commit `.env.local`
- do not expose `service_role` or secret keys
- Vercel must contain the same two public env variables

## Local Development

Project root:

- `/Users/eminkonya/Desktop/CURSOR LEASİNG DENEME/leaselogic-pro`

Run locally:

```bash
cd "/Users/eminkonya/Desktop/CURSOR LEASİNG DENEME/leaselogic-pro"
npm run dev
```

Local URL:

- `http://localhost:3010`

If cache or stale build issues appear:

```bash
cd "/Users/eminkonya/Desktop/CURSOR LEASİNG DENEME/leaselogic-pro"
rm -rf .next
npm run dev
```

Stop the local dev server:

```bash
Ctrl + C
```

Stopping local dev does not affect the live Vercel deployment.

## Deployment

- GitHub repo: `https://github.com/eminkonya-cpu/leaselogic-pro`
- Hosting: Vercel
- App preset: `Next.js`
- Root directory: `./`

Supabase auth URL config should contain:

- `Site URL`: `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`
- Redirect URLs:
  - `https://leaselogic-mscsvzy3f-eminkonya-cpus-projects.vercel.app`
  - `http://localhost:3010`

## Safe Change Workflow

To avoid damaging the project:

1. make changes locally first
2. run `npm run lint`
3. run `npm run build` for meaningful changes
4. test login flow if auth files were touched
5. only then push to GitHub / Vercel

High-risk files / areas:

- `src/app/HomeClient.tsx`
- `src/lib/supabase.ts`
- `.env.local`
- Vercel environment variables
- Supabase `authorized_users` table and URL configuration

## Operational Reminders

New user onboarding:

1. create user in `Authentication > Users`
2. add same email into `authorized_users`
3. set `is_active = true`

User offboarding:

1. open `authorized_users`
2. set `is_active = false`

## Related Docs

- `PROJECT_HANDOVER.md`: operator-focused quick handover
- `README.md`: generic starter readme, not fully aligned with the real project setup
