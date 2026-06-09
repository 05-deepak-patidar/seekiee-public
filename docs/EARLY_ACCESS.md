# Early / Limited Access Gate

Seekiee's hosted web app (`apps/web`) ships with a **waitlist gate**: anyone can
register, but a new account lands in a **pending** state and cannot use the app
until *you* approve it. This lets you run a limited early-access launch and
onboard people gradually.

## How it works

```
User signs up (Clerk)
        │
        ▼
DB user row created with approved = false
        │
        ▼
Any /dashboard, /evaluator, /api/* request
        │
   (app) layout / requireDbUser() check
        │
        ├─ approved = false  → redirect to /pending  (or 403 for API)
        └─ approved = true   → full access
```

- **Source of truth:** the Clerk user's `publicMetadata.approved` flag, mirrored
  into the `users.approved` column in Postgres.
- **You approve from the Clerk dashboard.** Setting `publicMetadata.approved = true`
  fires a `user.updated` webhook that flips `users.approved` in the DB. There's
  also a **self-heal** path in `getDbUser()` — if the webhook is missed, the next
  request re-reads Clerk metadata and syncs the DB automatically.

### Key files

| File | Role |
|------|------|
| `src/lib/db/schema.ts` | `users.approved` / `users.approvedAt` columns |
| `src/lib/auth.ts` | `requireDbUser()` (throws if not approved), `getAccessState()`, self-heal |
| `src/app/(app)/layout.tsx` | Redirects unapproved users to `/pending` |
| `src/app/pending/page.tsx` | Waitlist holding page |
| `src/app/api/webhooks/clerk/route.ts` | Syncs approval on `user.created` / `user.updated` |

## One-time setup

### 1. Push the new DB column

```bash
cd apps/web
npm run db:push          # adds users.approved + users.approved_at
```

(Or run the equivalent SQL once: `ALTER TABLE users ADD COLUMN approved boolean NOT NULL DEFAULT false, ADD COLUMN approved_at timestamp;`)

### 2. Configure the Clerk webhook (recommended)

In the [Clerk dashboard](https://dashboard.clerk.com) → **Webhooks** → **Add endpoint**:

- **Endpoint URL:** `https://seekiee.darkiee.com/api/webhooks/clerk`
- **Subscribe to events:** `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** into your env as `CLERK_WEBHOOK_SECRET`.

> Without the webhook the gate still works — `getDbUser()` self-heals from Clerk
> metadata on the next request — but the webhook makes approval instant.

### 3. (Optional) Harden sign-up with Clerk's native waitlist

If you also want to stop unapproved users from even creating a session, enable
Clerk's restricted sign-up mode: **Clerk dashboard → User & Authentication →
Restrictions → Sign-up mode → Waitlist**. With this on, sign-ups are collected
as waitlist entries and you approve them from **Clerk → Waitlist**. The app-level
`approved` gate above continues to work either way.

## Approving a user

1. Clerk dashboard → **Users** → open the user.
2. **Metadata** tab → **Public metadata** → set:
   ```json
   { "approved": true }
   ```
3. Save. The `user.updated` webhook flips `users.approved = true`; the user gets
   access on their next page load. To revoke, set `approved` back to `false` (or
   remove the key).

> Tip: you can approve in bulk via the Clerk Backend API by patching
> `public_metadata` for a list of user IDs.

## Approving the first user (yourself)

After deploying, sign up once, then set your own `publicMetadata.approved = true`
in the Clerk dashboard. You now have access and can approve others.
