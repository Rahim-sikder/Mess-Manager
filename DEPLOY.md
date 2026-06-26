# Deployment Guide — Mess Manager

**Stack detected (built from scratch in this session):**
| Layer    | Tool     | Details                                      |
|----------|----------|----------------------------------------------|
| Database | Supabase | Managed PostgreSQL                           |
| Backend  | Render   | Node.js Web Service, `npm run build` → `node dist/index.js` |
| Frontend | Vercel   | Vite, output → `dist/`, env prefix `VITE_*`  |
| Repo     | Monorepo | `backend/` and `frontend/` under one root    |
| PM       | npm      | `package-lock.json` generated on first install |

---

## 1 — Database (Supabase)

### Run the migration

Open your Supabase project → SQL Editor → paste and run the contents of
`migrations/001_create_monthly_rent.sql`.

Alternatively, if you use a migration tool (e.g. Flyway or golang-migrate),
point it at your Supabase connection string
(`Settings → Database → Connection string → URI`).

### Credentials — who needs what

| Credential                      | Used by           | Where to set it             |
|---------------------------------|-------------------|-----------------------------|
| `SUPABASE_URL`                  | Backend (Render)  | Render env vars             |
| `SUPABASE_SERVICE_ROLE_KEY`     | Backend (Render)  | Render env vars             |
| Supabase anon key / project URL | **Not needed**    | All DB access goes via the backend; the frontend never talks to Supabase directly |

**NEVER commit `SUPABASE_SERVICE_ROLE_KEY` to git or expose it to the frontend.**
Get both values from Supabase → Project Settings → API.

---

## 2 — Backend (Render)

**Service type:** Web Service, free plan.

**Root directory:** `backend` (set this in Render's service settings before
it reads your repo, so it installs and builds only the backend folder).

**Build command:**
```
npm install && npm run build
```
This runs `tsc` (from the `build` script in `backend/package.json`) and
produces `backend/dist/`.

**Start command:**
```
node dist/index.js
```

### Environment variables to set in Render

Read from `process.env` in the source:

| Variable                  | Where to get it                       |
|---------------------------|---------------------------------------|
| `SUPABASE_URL`            | Supabase → Project Settings → API     |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API   |
| `FRONTEND_ORIGIN`         | Your Vercel URL (add after step 3)    |
| `PORT`                    | **DO NOT set this.** Render injects it automatically. The server reads `process.env.PORT` with a local fallback of 3001 — do not hardcode a port anywhere else. |

### CORS note

The Express app reads `process.env.FRONTEND_ORIGIN` for the CORS `origin`.
After Vercel gives you a URL (step 3), come back and set `FRONTEND_ORIGIN`
in Render, then trigger a redeploy.

### Cold-start warning

Free Render web services spin down after ~15 minutes of inactivity.
The first request after idle takes ~30 seconds. This is expected behaviour
on the free tier.

---

## 3 — Frontend (Vercel)

**Root directory:** `frontend` (set in Vercel project settings).

**Build command:**
```
npm run build
```
(This runs `tsc && vite build` from `frontend/package.json`.)

**Output directory:** `dist`

**Framework preset:** Vite (Vercel auto-detects this once root dir is set).

### Environment variable

| Variable              | Value                              | How your code reads it                   |
|-----------------------|------------------------------------|------------------------------------------|
| `VITE_API_BASE_URL`   | Your Render backend URL, e.g. `https://mess-backend.onrender.com` | `import.meta.env.VITE_API_BASE_URL` in `src/lib/api.ts` |

Set this in Vercel → Project → Settings → Environment Variables before the
first production build. The `VITE_*` prefix is required by Vite; values
without it are not exposed to browser code.

### SPA fallback (rewrites)

Create `frontend/public/vercel.json` with:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This prevents 404s when a user navigates directly to a client-side route.

---

## 4 — Deploy order and smoke test

### Correct order

1. Run the SQL migration in Supabase.
2. Deploy the backend on Render (without `FRONTEND_ORIGIN` yet — CORS for
   localhost is fine during testing).  Note the public URL Render assigns.
3. Set `VITE_API_BASE_URL` in Vercel to that Render URL.
4. Deploy the frontend on Vercel.  Note the Vercel URL.
5. Set `FRONTEND_ORIGIN` in Render to the Vercel URL.  Trigger a Render
   redeploy (or wait for the next automatic one).

### Smoke test checklist

- [ ] Open the Vercel URL in a browser.  The page loads with the current
      month/year pre-selected.
- [ ] Check the browser Network tab: `GET /api/rent` and `GET /api/summary`
      return 200 with no CORS errors.
- [ ] Enter a room rent value and click **Save** (`PUT /api/rent` → 200).
- [ ] Reload the page; confirm the saved value reappears (round-trip through
      Supabase confirmed).
- [ ] Open Supabase → Table Editor → `monthly_rent`; confirm the row exists.

---

## Tailwind colour tokens used

Swap any of these for your brand palette in `tailwind.config.js` → `theme.extend.colors`.

| Token              | Where used                                      |
|--------------------|-------------------------------------------------|
| `indigo-500/600/700/800` | Input focus rings, Save button, Retry button |
| `slate-50/100/200/300/400/500/600/900` | Borders, backgrounds, labels, values |
| `green-100/600/700` | "Will Get" badge; positive balance            |
| `red-50/100/200/600/700` | "Will Pay" badge; negative balance; error state |

The `tabular-nums` utility is a font feature, not a colour — no change needed.
