# CompareX Scraping Worker

External scraping service for CompareX - handles Puppeteer scraping outside of Vercel's 10s timeout.

## Why Separate Worker?

**Vercel Limitation:** 10-second timeout for serverless functions  
**Our Scraping Needs:** 120-180 seconds

**Solution:** Deploy worker to Render.com (FREE, no timeout limits)

---

## Quick Setup (5 Minutes)

### 1. Prepare Code

Create symlinks to share code with main backend:

**Windows (PowerShell as Admin):**
```powershell
cd worker
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

### 2. Deploy to Render.com

1. **Go to:** https://render.com
2. **Sign up** with GitHub (free)
3. **New** → **Web Service**
4. **Connect** your GitHub repository
5. **Configure:**
   - Name: `comparex-worker`
   - Root Directory: `worker`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**

6. **Environment Variables** (click "Advanced"):
   ```
   MONGODB_URI = your_mongodb_connection_string
   WORKER_SECRET = create_random_string_here
   ```

7. **Create Web Service** → Wait 2-3 minutes

8. **Copy Service URL** (e.g., `https://comparex-worker.onrender.com`)

### 3. Configure Vercel

In your Vercel project settings → Environment Variables:

```
WORKER_URL = https://comparex-worker.onrender.com
WORKER_SECRET = same_secret_as_worker
MONGODB_URI = your_mongodb_connection_string
```

### 4. Done! 🎉

Your worker is deployed and ready. Vercel will trigger it for scraping jobs.

---

## How It Works

```
User searches → Vercel (creates job) → Render Worker (scrapes) → MongoDB (stores results)
                  < 1 second              120-180 seconds           Vercel polls for results
```

---

## Architecture

**Vercel (Frontend + API):**
- Fast API routes (< 1s)
- Job creation
- Status checking
- Serves results

**Render Worker:**
- Heavy Puppeteer scraping
- No timeout limits!
- Sequential execution (memory safe)
- Updates job in real-time

**MongoDB Atlas:**
- Job queue
- Results storage
- TTL auto-cleanup

---

## API Endpoints

### Worker Endpoints

**POST /scrape**
Process a scraping job
```json
{
  "jobId": "65abc...",
  "query": "iPhone 15",
  "category": "phone"
}
```
Authorization: `Bearer YOUR_WORKER_SECRET`

**GET /health**
Health check
```json
{
  "status": "healthy",
  "uptime": 12345,
  "memory": {...}
}
```

---

## Performance

**Sequential Scraping (optimized for free tier):**
- Memory: ~500MB peak (safe for 1GB limit)
- Time: 120-180 seconds (4 platforms)
- Browser: Reused across platforms
- Timeout: None!

**Real-time Updates:**
- Job updates after each platform completes
- Frontend sees progress in real-time
- Incremental results displayed

---

## Cost

**100% FREE:**
```
Render.com:  Free tier (512MB RAM, with 750 hours/month)
Vercel:      Free tier
MongoDB:     Atlas Free (512MB)
Total:       $0/month ✅
```

---

## Monitoring

### Check Worker Status
```bash
curl https://your-worker.onrender.com/health
```

### View Logs
- Go to Render Dashboard
- Select your service
- Click "Logs" tab
- Real-time log streaming

### Monitor Performance
- Dashboard shows CPU/Memory usage
- Deploy history
- Recent requests

---

## Troubleshooting

### Worker Not Processing Jobs

**Check:**
1. Render logs: Dashboard → Logs
2. Worker is running (not sleeping)
3. Environment variables set correctly
4. MongoDB connection successful

**Fix:**
```bash
# Wake up worker (Render free tier sleeps after 15 min idle)
curl https://your-worker.onrender.com/health
```

### Jobs Stuck in "Pending"

**Cause:** Worker URL or secret mismatch

**Fix:**
1. Verify `WORKER_URL` in Vercel matches Render URL
2. Verify `WORKER_SECRET` matches on both sides
3. Check Render logs for authentication errors

### Memory Issues

**Current setup uses ~500MB (safe)**

**If issues occur:**
1. Check Render dashboard memory graph
2. Consider upgrading to paid plan ($7/mo for 512MB → 2GB)
3. Reduce to 3 platforms instead of 4

---

## Free Tier Limits

**Render Free Tier:**
- 512MB RAM (enough for sequential scraping)
- 750 hours/month (≈25 hours/day)
- Sleeps after 15 minutes of inactivity
- Wakes on first request (30s delay)

**Handling Sleep:**
Worker wakes automatically when Vercel sends request. First search after sleep will be ~30s slower (one-time wake-up).

---

## Upgrading (Optional)

**If you need:**
- Faster wake-up (no sleep)
- More memory
- Custom domain

**Render Starter Plan: $7/month**
- No sleep
- 512MB RAM (can scale to 2GB)
- Custom domain
- Better performance

---

## Local Development

```bash
cd worker
npm install
npm start

# Test locally
curl -X POST http://localhost:3001/scrape \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret" \
  -d '{"jobId":"test123","query":"iPhone","category":"phone"}'
```

---

## Deployment Updates

When you push code changes:

1. **Git push to GitHub**
2. **Render auto-deploys** (if enabled)
3. **Zero downtime** deployment

Or manual deploy:
- Render Dashboard → Manual Deploy

---

## Summary

✅ **Free tier works perfectly**  
✅ **5-minute setup**  
✅ **No timeout issues**  
✅ **Auto-scaling**  
✅ **Real-time logs**  
✅ **Automatic HTTPS**  

**Next:** Just deploy and you're done!
