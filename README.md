# SVG Studio

AI-powered SVG creation, editing, template browsing, and sharing built with Next.js, Prisma, and NextAuth.

## What it does

SVG Studio is a web app for generating and managing SVG assets. The repository currently includes:

- AI-assisted SVG and text generation flows
- A browser-based SVG editor built on `@svgdotjs/svg.js`
- Template browsing, likes, shares, and community-style discovery
- Authenticated user areas such as dashboard, profile, security, and personal SVG management
- Admin routes for managing official SVG assets
- Optional Redis caching and optional OAuth sign-in

## Tech stack

- Next.js 15
- React 18
- TypeScript
- Prisma
- NextAuth v5 beta
- Tailwind CSS
- LangChain / OpenAI-compatible LLM endpoints
- Jest + Playwright

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_URL_INTERNAL`
- `AUTH_TRUST_HOST`

Optional variables:

- OAuth: `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- AI: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_TEMPERATURE`, `OPENAI_API_KEY`
- Cache: `REDIS_URL`
- Admin: `ADMIN_PASSWORD`
- Deployment overrides: `COOKIE_DOMAIN`, `ALLOWED_ORIGINS`, `IMAGE_DOMAINS`, `NEXT_PUBLIC_SITE_URL`

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run the app

```bash
npm run dev
```

The default local URL is `http://localhost:3000`.

## Environment behavior

- GitHub and Google sign-in buttons are hidden when their OAuth credentials are not configured.
- Admin password authentication is disabled when `ADMIN_PASSWORD` is unset.
- Redis caching falls back to in-memory storage when `REDIS_URL` is unset.
- AI features remain unavailable when AI-related variables are missing, while the rest of the app can still run.

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run test:e2e
```

## Project areas

- `src/app`: App Router pages, API routes, auth flows, dashboard, templates, admin pages
- `src/components`: UI components, editor panels, charts, modals, previews
- `src/lib`: shared auth, Prisma, caching, LLM config, utilities
- `prisma`: Prisma schema
- `tests`: Jest and Playwright coverage

## Deployment notes

- Do not commit `.env`.
- Rotate any secret that was ever pushed to a remote repository.
- Set `NEXTAUTH_URL` to your production domain before deploying.
- Use `COOKIE_DOMAIN`, `ALLOWED_ORIGINS`, and `IMAGE_DOMAINS` only when you need deployment-specific overrides.

## Current status

This repository is publishable as an open-source codebase, but it still has existing TypeScript and build issues outside the scope of secret cleanup. If you want, I can also help prepare it for public release by:

- fixing the current type-check failures
- cleaning up leftover debug logs
- adding screenshots and usage examples
- adding a license
- adding contribution guidelines
