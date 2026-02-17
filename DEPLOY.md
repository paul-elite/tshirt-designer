# Deployment Guide

Your code is already pushed to: **https://github.com/paul-elite/tshirt-designer**

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account & Project
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `paul-elite/tshirt-designer`
4. Railway will ask which folder - select **`server`** as the root directory

### 1.2 Add PostgreSQL Database
1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically add the `DATABASE_URL` environment variable

### 1.3 Set Environment Variables
Click on your server service → **Variables** tab → Add these:

```
JWT_SECRET=<generate-a-random-32-char-string>
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://your-app.vercel.app
```

**To generate JWT_SECRET**, run in terminal:
```bash
openssl rand -base64 32
```

### 1.4 Deploy Settings
1. Click on your server service → **Settings** tab
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install && npx prisma generate && npm run build`
4. Set **Start Command**: `npx prisma migrate deploy && npm run start`
5. Click **Deploy**

### 1.5 Get Your Backend URL
Once deployed, click on your service → **Settings** → copy the **Public Domain** URL
(e.g., `https://tshirt-designer-server-production.up.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account & Project
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import `paul-elite/tshirt-designer`

### 2.2 Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.3 Set Environment Variables
Add these environment variables:

```
VITE_API_URL=https://your-railway-url.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 2.4 Deploy
Click **Deploy** and wait for the build to complete.

### 2.5 Get Your Frontend URL
Copy your Vercel URL (e.g., `https://tshirt-designer.vercel.app`)

---

## Step 3: Update Railway with Frontend URL

Go back to Railway → your server service → **Variables** and update:
```
FRONTEND_URL=https://tshirt-designer.vercel.app
```

Railway will auto-redeploy.

---

## Step 4: Seed Database (Optional)

After deployment, you can seed discount codes by running:

```bash
# In Railway dashboard, go to your service → click "Connect" button
# Or use Railway CLI:
railway run npx tsx prisma/seed.ts
```

---

## Stripe Setup

### Test Mode (Recommended for testing)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → `STRIPE_SECRET_KEY`

### Test Card
Use `4242 4242 4242 4242` with any future expiry and any CVC.

---

## Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly.

### Database Connection
Railway automatically sets `DATABASE_URL`. If issues occur:
1. Go to PostgreSQL service → **Connect** tab
2. Copy the connection string
3. Set it manually in your server's Variables

### Build Failures
Check the deployment logs in Railway/Vercel for specific errors.

---

## URLs Summary

After deployment, you'll have:
- **Frontend**: `https://tshirt-designer.vercel.app` (or similar)
- **Backend**: `https://tshirt-designer-server.up.railway.app` (or similar)
- **GitHub**: `https://github.com/paul-elite/tshirt-designer`
