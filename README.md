# NurseShift

Personal nurse shift scheduler: monthly calendar, agenda list, night-shift carryover, and coworker swap tracking. Built as a MERN-style app that deploys to **Vercel** with **MongoDB Atlas** — no Docker.

## What you can do

- Register with a username, email, and password, then sign in
- Click a calendar day to add a day, evening, or night shift
- Night shifts stay on the start date and also mark the next morning
- Switch to a week-grouped list for upcoming, night, or swapped shifts
- Edit times, unit, and notes; delete a shift
- Reschedule after a coworker swap and keep the original date plus who you swapped with
- Mark a shift as called in sick (red, crossed out, hours not counted)

## 1. Create a free MongoDB Atlas database

I cannot create the Atlas account for you (it has to use your email), but the free cluster takes a few minutes:

1. Open [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a project, then a cluster. Choose the **M0 Free** tier and a region close to you (or close to `iad1` if you will host on Vercel’s default US East).
3. Under **Database Access**, add a database user with a password you will keep. Do not use special characters that break URLs (`@`, `#`, `/`) unless you URL-encode them later.
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`). Vercel does not have one fixed IP.
5. Back on the cluster, click **Connect** → **Drivers**. Copy the URI. It looks like:

   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

6. Put your password in place of `<password>` and add a database name before the query string:

   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/nursing-scheduler?retryWrites=true&w=majority`

## 2. Run locally

```bash
copy .env.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=your-atlas-uri-from-above
JWT_SECRET=a-long-random-string
```

Generate a secret in PowerShell:

```powershell
-join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register, and add a few shifts.

## 3. Deploy to Vercel (free)

1. Push this folder to a GitHub repository.
2. Sign in at [vercel.com](https://vercel.com) with GitHub and click **Add New… → Project**.
3. Import the repo. Framework preset should be **Next.js**.
4. Add the same environment variables as `.env.local`:
   - `MONGODB_URI`
   - `JWT_SECRET`
5. Deploy. Vercel gives you a `*.vercel.app` URL.

Or from this folder after installing the Vercel CLI:

```bash
npx vercel
```

Add the two env vars in the Vercel project settings if the CLI does not prompt for them, then redeploy.

## Stack

This is a MERN variation aimed at free hosting: **MongoDB Atlas**, **Next.js** (React UI + Node API routes instead of a separate Express server). One project, one Vercel deploy, no Docker.
