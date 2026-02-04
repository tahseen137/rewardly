# Web Deployment Guide 🌐

Deploy Rewardly as a web application to make it accessible from any browser!

## Quick Deploy Options

### Option 1: Vercel (Recommended) ⚡

Vercel offers the fastest deployment with automatic HTTPS and custom domains.

#### Steps:

1. **Install Vercel CLI** (optional, can also use web interface):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   cd fintech-idea/rewards-optimizer
   vercel
   ```
   
   Or **Deploy via GitHub**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository: `tahseen137/rewardly`
   - Vercel will auto-detect settings from `vercel.json`
   - Add environment variables (see below)
   - Click "Deploy"

3. **Your app will be live at**: `https://rewardly-[random].vercel.app`

4. **Add custom domain** (optional):
   - Go to Project Settings → Domains
   - Add your domain (e.g., `rewardly.app`)
   - Follow DNS configuration instructions

---

### Option 2: Netlify 🎯

Netlify is another excellent free option with great CI/CD.

#### Steps:

1. **Deploy via GitHub**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select `tahseen137/rewardly`
   - Netlify will auto-detect settings from `netlify.toml`
   - Add environment variables (see below)
   - Click "Deploy"

2. **Your app will be live at**: `https://rewardly-[random].netlify.app`

3. **Add custom domain** (optional):
   - Go to Site Settings → Domain Management
   - Add your custom domain

---

### Option 3: GitHub Pages (Free, No Server) 📄

Deploy directly from your GitHub repository.

#### Steps:

1. **Build the app**:
   ```bash
   npm run build:web
   ```

2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add to package.json scripts**:
   ```json
   "deploy:gh-pages": "gh-pages -d dist"
   ```

4. **Deploy**:
   ```bash
   npm run deploy:gh-pages
   ```

5. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Your app will be at: `https://tahseen137.github.io/rewardly`

---

## Environment Variables Setup 🔐

All platforms require these environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### How to Add Environment Variables:

**Vercel:**
- Project Settings → Environment Variables
- Add each variable with its value
- Redeploy after adding

**Netlify:**
- Site Settings → Environment Variables
- Add each variable
- Trigger new deploy

**GitHub Pages:**
- Environment variables are baked into the build
- Make sure `.env` is configured before running `build:web`
- Never commit `.env` to GitHub!

---

## Testing Locally 🧪

Before deploying, test the web version locally:

```bash
# Start web development server
npm run web

# Or build and preview
npm run build:web
npx serve dist
```

Open `http://localhost:8081` in your browser.

---

## Features on Web 🎨

The web version includes:
- ✅ Full card recommendation engine
- ✅ Store search with Google Places
- ✅ Card portfolio management
- ✅ Bilingual support (EN/FR)
- ✅ Responsive design for mobile and desktop
- ✅ PWA support (installable on mobile)

---

## Custom Domain Setup 🌍

### Buy a Domain:
- [Namecheap](https://namecheap.com) - ~$10/year
- [Google Domains](https://domains.google) - ~$12/year
- [Cloudflare](https://cloudflare.com) - At-cost pricing

### Configure DNS:
Both Vercel and Netlify provide detailed instructions when you add a custom domain.

Typical setup:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (or similar)
```

---

## Deployment Checklist ✅

Before deploying:

- [ ] Test locally with `npm run web`
- [ ] Verify Supabase connection works
- [ ] Test Google Places API integration
- [ ] Check responsive design on mobile/desktop
- [ ] Verify all environment variables are set
- [ ] Test in multiple browsers (Chrome, Safari, Firefox)
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

---

## Monitoring & Analytics 📊

### Add Analytics (Optional):

**Google Analytics:**
```bash
npm install @react-native-google-analytics/google-analytics
```

**Vercel Analytics:**
- Automatically available in Vercel dashboard
- No code changes needed

**Netlify Analytics:**
- Enable in Site Settings → Analytics
- $9/month for detailed insights

---

## Troubleshooting 🔧

### Build Fails:
```bash
# Clear cache and rebuild
rm -rf node_modules dist .expo
npm install
npm run build:web
```

### Environment Variables Not Working:
- Ensure they start with `EXPO_PUBLIC_`
- Redeploy after adding variables
- Check platform-specific docs

### App Not Loading:
- Check browser console for errors
- Verify Supabase URL and API key
- Test Google Places API key

---

## Cost Breakdown 💰

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Vercel** | Unlimited personal projects | $20/month Pro |
| **Netlify** | 100GB bandwidth/month | $19/month Pro |
| **GitHub Pages** | Unlimited for public repos | Free |
| **Custom Domain** | N/A | $10-15/year |

**Recommended for production**: Vercel or Netlify with custom domain

---

## Next Steps 🚀

1. Choose your deployment platform
2. Deploy using the steps above
3. Add environment variables
4. Test the live app
5. (Optional) Add custom domain
6. Share your app with users!

Your web app will be accessible from any device with a browser - no app store approval needed! 🎉
