# 🚀 Render.com Deployment Guide

Complete step-by-step guide to deploy CompareX with Vercel + Render.com (100% FREE)

---

## Architecture Overview

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Vercel     │────────▶│  Render.com  │────────▶│  MongoDB     │
│  Frontend +  │         │   Worker     │         │   Atlas      │
│  Fast API    │◀────────│  (Scraping)  │◀────────│  (Storage)   │
└──────────────┘         └──────────────┘         └──────────────┘
    $0/month                 $0/month                 $0/month
```

---

## Prerequisites

- [x] GitHub account
- [x] MongoDB Atlas account (free tier)
- [x] Vercel account
- [x] Render.com account (will create)

---

## Step 1: Prepare Worker Code

### Create Symlinks (Share code with backend)

**Windows (PowerShell as Administrator):**
```powershell
cd c:\pricecompare\comparex\worker
New-Item -ItemType SymbolicLink -Path "models" -Target "..\backend\models"
New-Item -ItemType SymbolicLink -Path "utils" -Target "..\backend\utils"
New-Item -ItemType SymbolicLink -Path "scrapers" -Target "..\backend\scrapers"
New-Item -ItemType SymbolicLink -Path "config" -Target "..\backend\config"
```

**Linux/Mac:**
```bash
cd worker
ln -s ../backend/models models
ln -s ../backend/utils utils
ln -s ../backend/scrapers scrapers
ln -s ../backend/config config
```

### Verify Structure
```
worker/
├── server.js
├── package.json
├── models/          ← symlink to ../backend/models
├── utils/           ← symlink to ../backend/utils
├── scrapers/        ← symlink to ../backend/scrapers
└── config/          ← symlink to ../backend/config
```

---

## Step 2: Deploy Worker to Render.com

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub**
4. Authorize Render to access your repositories

### 2.2 Create Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Connect your **GitHub repository** (`comparex`)
4. Click **"Connect"**

### 2.3 Configure Service

**Basic Settings:**
- **Name:** `comparex-worker` (or any name)
- **Region:** Choose closest to you
- **Branch:** `main` (or your default branch)
- **Root Directory:** `worker`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Free"** plan ($0/month)

### 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

**MONGODB_URI**
```
mongodb+srv://username:password@cluster.mongodb.net/comparex?retryWrites=true&w=majority
```
*(Get this from MongoDB Atlas)*

**WORKER_SECRET**
```
your-random-secret-string-here
```
*(Generate a random string - save it for later)*

**PORT** (optional, Render provides this)
```
3001
```

### 2.5 Deploy!

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. ✅ Worker will be live!

### 2.6 Get Your Worker URL

After deployment completes:
- You'll see your service URL
- Format: `https://comparex-worker.onrender.com`
- **Copy this URL!**

### 2.7 Test Worker

```bash
curl https://comparex-worker.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123,
  "memory": {...}
}
```

---

## Step 3: Deploy Backend to Vercel

### 3.1 Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

**MONGODB_URI**
```
mongodb+srv://username:password@cluster.mongodb.net/comparex?retryWrites=true&w=majority
```

**WORKER_URL**
```
https://comparex-worker.onrender.com
```
*(Your Render service URL from Step 2.6)*

**WORKER_SECRET**
```
your-random-secret-string-here
```
*(Same secret as worker)*

**JWT_SECRET** (existing)
```
your-jwt-secret
```

### 3.2 Deploy to Vercel

```bash
# From project root
vercel

# Or redeploy if already deployed
vercel --prod
```

Or use Vercel GitHub integration (auto-deploy on push)

---

## Step 4: Test End-to-End

### 4.1 Test Job Creation

```bash
curl -X POST https://your-app.vercel.app/api/search/scrape \
  -H "Content-Type: application/json" \
  -d '{"query":"iPhone 15","category":"phone"}'
```

Expected response:
```json
{
  "jobId": "65abc123...",
  "status": "pending",
  "message": "Job created successfully..."
}
```

### 4.2 Check Job Status

```bash
curl https://your-app.vercel.app/api/search/status/65abc123...
```

Expected response (while running):
```json
{
  "status": "running",
  "progress": "Scraping Amazon...",
  "results": [],
  ...
}
```

After completion:
```json
{
  "status": "completed",
  "results": [
    {
      "title": "Apple iPhone 15 Pro",
      "price": 79999,
      ...
    }
  ],
  ...
}
```

### 4.3 Test Frontend

1. Open your app: `https://your-app.vercel.app`
2. Search for "iPhone 15"
3. Watch progress updates
4. See results appear!

---

## Step 5: Monitoring

### Render Dashboard

**View Logs:**
1. Go to Render Dashboard
2. Click your `comparex-worker` service
3. Click **"Logs"** tab
4. See real-time logs

**Monitor Performance:**
- **Metrics** tab shows CPU/Memory usage
- **Events** tab shows deployments
- **Settings** for configuration

### Vercel Dashboard

**View Function Logs:**
1. Vercel Dashboard → Your Project
2. **Deployments** → Click latest
3. **Functions** tab → View logs

**Monitor Performance:**
- **Analytics** tab (if enabled)
- Real-time visitor data
- Function invocation stats

---

## Troubleshooting

### Issue: Worker not processing jobs

**Symptoms:** Jobs stay in "pending" status

**Causes & Solutions:**

1. **Worker is sleeping (free tier)**
   ```bash
   # Wake it up
   curl https://comparex-worker.onrender.com/health
   ```

2. **Wrong WORKER_URL in Vercel**
   - Check Vercel env variables
   - Should match Render URL exactly

3. **Authentication failed**
   - Verify WORKER_SECRET matches on both sides
   - Check Render logs for "Unauthorized" errors

### Issue: "Job not found" error

**Cause:** MongoDB connection issue

**Solution:**
1. Check MongoDB Atlas whitelist (allow all IPs: `0.0.0.0/0`)
2. Verify MONGODB_URI is correct in both Vercel and Render
3. Check MongoDB Atlas connection limits

### Issue: Slow first search

**Cause:** Render free tier sleeps after 15 min inactivity

**Solution:** Normal behavior
- First search after sleep: ~30-40s extra (wake-up time)
- Subsequent searches: Normal speed
- Upgrade to $7/month to disable sleep

### Issue: Out of memory

**Current:** Sequential scraping uses ~500MB (safe)

**If occurs:**
1. Check Render metrics
2. Reduce to 3 platforms instead of 4
3. Consider upgrade to paid plan

---

## Cost Breakdown

### Current Setup (100% FREE)

| Service | Plan | Cost |
|---------|------|------|
| **Render.com** | Free | $0/month |
| **Vercel** | Hobby | $0/month |
| **MongoDB Atlas** | M0 Free | $0/month |
| **Total** | | **$0/month** ✅ |

### Free Tier Limits

**Render Free:**
- 512MB RAM
- 750 hours/month (≈25 hrs/day)
- Sleeps after 15 min idle
- Wakes on request (~30s delay)

**MongoDB Atlas M0:**
- 512MB storage
- Shared cluster
- No credit card needed

**Vercel Hobby:**
- 100GB bandwidth/mo
- Serverless functions (10s timeout)
- Custom domain

---

## Upgrade Path (Optional)

### When to Upgrade Render

**Reasons:**
- Eliminate sleep delay
- Need more memory
- Higher traffic
- Custom domain

**Render Starter: $7/month**
- No sleep
- 512MB RAM (scalable to 2GB)
- Better performance
- Custom domain

---

## Deployment Checklist

- [ ] Created symlinks in `worker/` directory
- [ ] Deployed worker to Render.com
- [ ] Copied worker URL
- [ ] Set environment variables in Render
- [ ] Set environment variables in Vercel
- [ ] Tested worker health endpoint
- [ ] Tested job creation
- [ ] Tested job status checking
- [ ] Tested frontend search
- [ ] Verified results appear correctly

---

## Summary

✅ **Setup Time:** 10-15 minutes  
✅ **Total Cost:** $0/month  
✅ **Performance:** 120-180s scraping, no timeout issues  
✅ **Scaling:** Auto-scaling on Render  
✅ **Monitoring:** Real-time logs and metrics  
✅ **Maintenance:** Auto-deploy on git push  

**You're all set!** 🎉

Your CompareX platform is now:
- Deployed on Vercel (frontend + API)
- Worker on Render.com (scraping)
- Data on MongoDB Atlas
- 100% FREE and production-ready!
