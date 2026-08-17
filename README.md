## So-Club

A media club app to organize movie watching, book reading and game playing groups. It is a book club for every kind 
of media

Currently, it only supports movies and the full planned features are still in progress.

**[Live demo](https://so-club.com)**

Built with Next.js, TypeScript, Prisma, PostgreSQL, Auth.js, TailwindCSS and shadcn/ui

---

## Features

- **Three ways to sign in**: Github, Google and passwordless email magic links, all on the same sign-in page.
- **Groups with role-based membership**: Every member is an owner, admin or member, and every group action is gated 
  by role
- **Invites**: Group owners can generate invite links to share
- **Movie search through TMDB**: Dynamic, server-side search functionality powered by the TMDB API.
- **Shared backlog**: Group members can add movies to the group. Added movies include the member that added it

## Tech Stack

| Layer         | Choice                                        |
|---------------|-----------------------------------------------|
| Framework     | Next.js (App Router) + Typescript             |
| Database      | Prisma v7 with PostgreSQL, stored in Supabase |
| Styling       | TailwindCSS + shadcn/ui                       |
| External Data | TMDB API, Resend                              |
| Testing       | Vitest                                        |
| Hosting       | Vercel                                        |

---

## Architecture

### Media Providers

Currently, there is only one media provider (TMDB), but the system is set through the MediaProvider interface:

```ts
interface MediaProvider {
    search (query: string): Promise<NormalizedMediaItem[]>;
    getByExternalId (externalId: string): Promise<NormalizedMediaItem | null>;
}
```

Where `NormalizedMediaItem` contains generic properties that all media should in theory have (title, release date, 
etc.), plus a metadata field for media-specific data.

`search` is used for search functionality that returns many mediaItems, while `getByExternalId` is for fetching one 
specific item, normally after the user has found it during search or when looking at it in detail

It is worth to note that a snapshot of a given mediaItem is stored in the database in its normalized form after it 
is added to a group to minimize calls to external APIs

### Role-based authorization guards

All group-scoped pages and actions are gated through a standardized role check that redirects back to sign-in, or to 
a 404 page when the unknown user should not know that action or page exists (for example a non-member entering a 
group directly through its address)

### Database-backed sessions

All auth data lives in the database, managed with the help of Auth.js

---

## Getting started

### Prerequisites

- Node.js and npm
- Docker (for the local testing database)
- Accounts/keys for: [TMDB](https://www.themoviedb.org/settings/api), [Resend](https://resend.com), a [GitHub OAuth app](https://github.com/settings/developers), and a [Google OAuth client](https://console.cloud.google.com/apis/credentials)

### 1. Clone and Install

```bash
  git clone https://github.com/miraclejester/so-club
  cd so-club
  npm i
```

### 2. Configure environment variables

Copy the example env file and fill it (see the [reference](#environment-variables) below):

```bash
  cp .env.example .env
```

### 3. Start the local database

```bash
  docker compose up -d
```

### 4. Migrate and seed the database

```bash
  npx prisma migrate dev
  npm run db:seed
```

### 5. Run

```bash
  npm run dev
```

### 6. Sign in

Sign in with GitHub, Google, or a magic link. To land in a group that already has a backlog, the seed script prints 
a ready-made invite link. Visit it after signing in to join a populated club.

## Environment variables

| Variable                                | Purpose                                            | Where to get it                                                |
|-----------------------------------------|----------------------------------------------------|----------------------------------------------------------------|
| `DATABASE_URL`                          | Runtime database connection (pooled in production) | Local: your Docker Postgres. Prod: Supabase transaction pooler |
| `DIRECT_URL`                            | Migration connection (unpooled)                    | Local: same as `DATABASE_URL`. Prod: Supabase session pooler   |
| `AUTH_SECRET`                           | Signs session cookies                              | `npx auth secret` or `openssl rand -base64 32`                 |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth                                       | GitHub Developer Settings → OAuth Apps                         |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth                                       | Google Cloud Console → Credentials                             |
| `AUTH_RESEND_KEY`                       | Sends magic-link emails                            | Resend dashboard → API Keys                                    |
| `TMDB_ACCESS_TOKEN`                     | Movie search and metadata                          | TMDB → Settings → API → Read Access Token                      |

Locally, `DATABASE_URL` and `DIRECT_URL` are the same Docker connection string, since local Postgres isn't behind a pooler.

If you want to host this somewhere (e.g. Vercel), these environment variables should also be set up there.

---

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

All rights reserved © Jose Montenegro