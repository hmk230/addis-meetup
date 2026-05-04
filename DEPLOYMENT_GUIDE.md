# 🚀 Addis Meetup — Deployment Guide for Beginners

Follow these steps in order. Total time: about 30–45 minutes. Everything is FREE.

---

## What You'll Need
- A computer with internet
- A free GitHub account → https://github.com
- A free Supabase account → https://supabase.com
- A free Render account → https://render.com
- A free Vercel account → https://vercel.com

---

## STEP 1 — Set Up Supabase (Your Database)

Supabase stores all your data: players, meetups, registrations.

1. Go to https://supabase.com and click **Start for Free**
2. Sign up with GitHub or email
3. Click **New Project**
4. Fill in:
   - **Name:** addis-meetup
   - **Database Password:** choose a strong password (save this!)
   - **Region:** pick the closest to Ethiopia (e.g. EU West)
5. Click **Create new project** — wait about 2 minutes for it to start

### Run the Database Tables

6. In Supabase, click **SQL Editor** in the left sidebar
7. Click **New query**
8. Open the file `backend/schema.sql` from your downloaded zip
9. Copy ALL the text and paste it into the SQL Editor
10. Click **Run** (green button)
11. You should see "Success. No rows returned"

### Create a Storage Bucket

12. Click **Storage** in the left sidebar
13. Click **New bucket**
14. Name it: `payments`
15. Check the box **Public bucket**
16. Click **Create bucket**

### Get Your Supabase Keys

17. Click **Project Settings** (gear icon) → **API**
18. Copy and save these two values somewhere safe:
    - **Project URL** → looks like `https://xxxxx.supabase.co`
    - **service_role** key → the long key under "Project API keys" (NOT the anon key)

---

## STEP 2 — Upload Code to GitHub

GitHub is where your code lives online so Render and Vercel can access it.

1. Go to https://github.com and sign in
2. Click the **+** button (top right) → **New repository**
3. Name it: `addis-meetup`
4. Leave it **Public**
5. Click **Create repository**

### Upload your files

**Easiest way — GitHub Desktop:**
1. Download GitHub Desktop from https://desktop.github.com
2. Install and sign in
3. Click **File → Add Local Repository**
4. Select the `addis-meetup` folder from your downloaded zip
5. Click **Publish repository** → uncheck "Keep this code private" → **Publish**

**Alternative — drag and drop on GitHub website:**
1. On your new repo page, click **uploading an existing file**
2. Drag the entire `addis-meetup` folder contents into the upload area
3. Click **Commit changes**

---

## STEP 3 — Deploy Backend to Render

Render runs your Express/Node.js server.

1. Go to https://render.com and sign up (use GitHub login — easier)
2. Click **New +** → **Web Service**
3. Click **Connect account** next to GitHub and authorize
4. Find and select your `addis-meetup` repository
5. Fill in the settings:
   - **Name:** addis-meetup-api
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free
6. Scroll down to **Environment Variables** and add these one by one:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | your Project URL from Step 1 |
   | `SUPABASE_SERVICE_KEY` | your service_role key from Step 1 |
   | `JWT_SECRET` | type any long random text e.g. `addismeetup_super_secret_2024_xyz` |
   | `FRONTEND_URL` | leave blank for now (you'll add this after Step 4) |

7. Click **Create Web Service**
8. Wait 2–4 minutes for it to build. Look for "Your service is live 🎉"
9. **Copy your Render URL** — looks like `https://addis-meetup-api.onrender.com`

---

## STEP 4 — Deploy Frontend to Vercel

Vercel hosts your React app.

1. Go to https://vercel.com and sign up (use GitHub login)
2. Click **Add New → Project**
3. Import your `addis-meetup` GitHub repository
4. In **Configure Project** settings:
   - **Root Directory:** click Edit → type `frontend` → Save
   - **Framework Preset:** Vite (should auto-detect)
5. Click **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your Render URL + `/api` e.g. `https://addis-meetup-api.onrender.com/api` |

6. Click **Deploy**
7. Wait 1–2 minutes. Vercel will give you a URL like `https://addis-meetup.vercel.app`

### Link frontend URL back to Render

8. Go back to Render → your service → **Environment**
9. Edit `FRONTEND_URL` and set it to your Vercel URL e.g. `https://addis-meetup.vercel.app`
10. Click **Save Changes** — Render will redeploy automatically

---

## STEP 5 — Create Your Admin Account

1. Open your Vercel app URL in a browser
2. Sign up with your phone number and a strong password
3. Go to Supabase → **SQL Editor** → New query
4. Paste this (replace with YOUR phone number):

```sql
update users set role = 'admin' where phone = '+2519XXXXXXXX';
```

5. Click **Run**
6. Log out of the app and log back in — you'll now see the Admin dashboard!

---

## STEP 6 — Configure Payment Details

1. Log in as admin
2. Go to the **Settings** tab (bottom nav)
3. Fill in:
   - **Bank Name:** e.g. Commercial Bank of Ethiopia
   - **Account Number:** your account number
   - **Telebirr Number:** your Telebirr number
   - **Telegram Username:** e.g. @AddisMeetupAdmin
4. Click **Save Changes**

---

## STEP 7 — Create Your First Meetup

1. Go to **Meetups** tab in admin
2. Click **+ Create Meetup**
3. Fill in title, location, date, max players, price
4. Click **Create**

Share your Vercel URL with players and you're live! ✅

---

## 💰 Pricing Tiers (how it works for players)

When a player registers, they choose how many games they want this week:

| Games | Discount | Example (350 ETB base) |
|-------|----------|------------------------|
| 1 game | Full price | 350 ETB |
| 2 games | Save 25% of 1 game | 612.50 ETB |
| 3 games | Save 50% of 1 game | 875 ETB |
| 4 games | Save 50% of 1 game | 1,225 ETB |

This multiplies by the number of players they register.

---

## 🔧 Common Problems

**"Application error" on Render:**
- Check Render logs → click your service → Logs tab
- Usually means an environment variable is missing or wrong

**Login not working:**
- Make sure VITE_API_URL in Vercel ends with `/api`
- Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are correct

**Images not uploading:**
- Make sure you created the `payments` storage bucket in Supabase
- Make sure the bucket is set to Public

**Slow first load:**
- Render free tier "sleeps" after 15 minutes of inactivity. First visit wakes it up (takes ~30 seconds). Normal after that.

---

## 📞 Tech Stack Summary

| Part | Service | Cost |
|------|---------|------|
| Frontend (React app) | Vercel | Free |
| Backend (Node.js API) | Render | Free |
| Database + Storage | Supabase | Free |
| **Total** | | **$0/month** |
