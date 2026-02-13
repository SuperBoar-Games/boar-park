# Deploy Marketing Site to shop.superboar.com

## ✅ Step-by-Step Guide

### Step 1: Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Select your account → **Pages**
3. Click **"Create a project"**
4. Choose **"Connect to Git"**
5. Select the `SuperBoar-Games/boar-park` repository
6. Configure build settings:
   - **Project name:** `boar-park-marketing`
   - **Production branch:** `main`
   - **Build command:** (leave empty - static files)
   - **Build output directory:** `marketing`
7. Click **"Save and Deploy"**

### Step 2: Add Custom Domain

1. In the Pages project, go to **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter: `shop.superboar.com`
4. Click **"Continue"**
5. Cloudflare will add the DNS record automatically

### Step 3: Configure API Token (for GitHub Actions)

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Cloudflare Pages"**
4. Select your account and the `boar-park-marketing` project
5. Click **"Continue"** → **"Create Token"**
6. Copy the token

### Step 4: Add GitHub Secrets

1. Go to https://github.com/SuperBoar-Games/boar-park/settings/secrets/actions
2. Add these secrets:
   - `CLOUDFLARE_API_TOKEN` → Paste the token from Step 3
   - `CLOUDFLARE_ACCOUNT_ID` → Your Cloudflare account ID (from dashboard sidebar)

### Step 5: Merge Your PR

Once the PR with marketing site is merged to `main`:
1. GitHub Actions will auto-deploy
2. Site will be live at `shop.superboar.com`

## 🔗 Final URLs

| URL | What It Shows |
|-----|---------------|
| `https://superboar.com` | Main game / landing page |
| `https://shop.superboar.com` | E-commerce marketing site |
| `https://superboar.com/admin` | Admin panel |

## 📝 Files Added

- `marketing/wrangler.toml` - Cloudflare Pages config
- `.github/workflows/deploy-marketing.yml` - Auto-deploy on push

## 🚀 Quick Test

After deployment, your friend in Europe can visit:
```
https://shop.superboar.com
```

And see the full e-commerce site with:
- Card packs for sale
- Shopping cart
- Checkout
- Order tracking