# Deploying Forge-Pro to Vercel (Free Tier)

This guide walks you through deploying Forge-Pro and all 10 templates to Vercel's free tier.

## Prerequisites

1. **Node.js 22+** installed
2. **Vercel CLI** installed: `npm i -g vercel`
3. **GitHub account** (for repo hosting)
4. **Supabase account** (free tier) for database

## Quick Start (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/forge-pro.git
cd forge-pro

# 2. Install dependencies
pnpm install

# 3. Login to Vercel
vercel login

# 4. Deploy everything
./scripts/deploy-vercel.sh
```

That's it! You'll get 11 Vercel projects, all free.

## What Gets Deployed

| Project | URL | Description |
|---------|-----|-------------|
| `forge-pro` | `forge-pro.vercel.app` | Main marketplace app |
| `nimbus` | `nimbus-forge.vercel.app` | AI SaaS Landing |
| `atlas` | `atlas-forge.vercel.app` | SaaS Dashboard |
| `lumen` | `lumen-forge.vercel.app` | E-commerce Store |
| `studio` | `studio-forge.vercel.app` | Creative Agency |
| `forge` | `forge-forge.vercel.app` | Local Business |
| `pulse` | `pulse-forge.vercel.app` | Blog/Newsletter |
| `sage` | `sage-forge.vercel.app` | Course Platform |
| `mesa` | `mesa-forge.vercel.app` | Restaurant |
| `ledger` | `ledger-forge.vercel.app` | Finance Dashboard |
| `quill` | `quill-forge.vercel.app` | Documentation |

## Manual Deployment

If you prefer to deploy individually:

### Main App

```bash
cd apps/app
vercel --prod
```

### Templates

```bash
cd templates/nimbus
vercel --prod
```

## Environment Variables

### For the Main App

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for full features)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
STRIPE_SECRET_KEY=sk_live_...
```

### For Templates

Templates don't require environment variables — they're fully static.

## Setting Up Supabase (Free)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Copy your project URL and keys
3. Run the migrations:
   ```bash
   # Connect to your Supabase project
   psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   
   # Run migrations
   \i apps/app/supabase/migrations/001_initial.sql
   ```

## Custom Domains

### Free Subdomains (Automatic)

Every deployment gets a free `*.vercel.app` subdomain:
- `forge-pro.vercel.app`
- `nimbus-forge.vercel.app`
- etc.

### Custom Domains (Optional)

1. Buy a domain (~$10/year) from Namecheap or Cloudflare
2. In Vercel Dashboard → Project → Settings → Domains
3. Add your domain and follow DNS instructions

Example:
```
forge-pro.com          → Main marketplace
demo.nimbus.com        → Nimbus template demo
```

## Free Tier Limits

| Resource | Limit | Your Usage |
|----------|-------|------------|
| Projects | Unlimited | 11 |
| Bandwidth | 100GB/month per project | ~1GB |
| Build minutes | 6,000/month | ~100 |
| Serverless hours | 100/month | Minimal |
| Deployments | Unlimited | As needed |

**You'll use ~5% of the free tier.**

## Preview Deployments

Vercel automatically creates preview URLs for every Git push:

```bash
git push origin feature/new-template
# → https://feature-new-template-forge-pro.vercel.app
```

Perfect for testing before merging to main.

## Troubleshooting

### Build Fails

```bash
# Check build locally first
cd templates/nimbus
npm run build
```

### Functions Timeout

Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Missing Environment Variables

Check Vercel Dashboard → Settings → Environment Variables and make sure all required vars are set.

## Cost Summary

| Item | Cost |
|------|------|
| Vercel Hobby | $0/month |
| Supabase Free | $0/month |
| Domain (optional) | ~$10/year |
| **Total** | **$0-10/year** |

## Next Steps

1. Set up GitHub Actions for auto-deploy on push
2. Add Vercel Analytics (free tier)
3. Configure Supabase Auth for user management
4. Set up Stripe for payments

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Forge-Pro README](./README.md)
