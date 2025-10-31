# IhsaanTrack Deployment Guide

## Quick Deployment Steps (10-20 Users)

### Prerequisites
- GitHub account (free)
- Supabase account (free tier supports this)
- Vercel account (free tier sufficient)

---

## Step 1: Prepare Your Codebase

### 1.1 Ensure Logo File is Ready
Make sure `public/logo_ihsaantrack.png` exists and is optimized (under 100KB recommended).

### 1.2 Environment Variables
Create a `.env.local` file (don't commit this!):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 1.3 Build Locally First (Test)
```bash
npm run build
npm start
```
Visit `http://localhost:3000` and test all features before deploying.

---

## Step 2: Deploy to Vercel (Recommended - Easiest)

### 2.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ihsaantrack.git
git push -u origin main
```

### 2.2 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. **Add Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
6. Click "Deploy"

Your app will be live at: `https://your-project-name.vercel.app`

### 2.3 Custom Domain (Optional)
- In Vercel project settings → Domains
- Add your domain (e.g., `ihsaantrack.com`)
- Follow DNS configuration instructions

---

## Step 3: Supabase Production Setup

### 3.1 Verify Supabase Database
- Ensure all tables exist (check your migrations)
- Test authentication flow
- Verify Row Level Security (RLS) policies

### 3.2 Supabase Storage (if needed)
If you plan to store user uploads:
- Enable Storage in Supabase dashboard
- Create buckets with appropriate policies

### 3.3 Rate Limiting (Optional)
For 10-20 users, Supabase free tier is sufficient:
- Free tier: 500MB database, 2GB bandwidth, 50K monthly active users

---

## Step 4: Post-Deployment Checklist

### 4.1 Test These Features:
- [ ] User signup/login works
- [ ] Profile creation works
- [ ] Daily tracking entries save correctly
- [ ] Prayer times load
- [ ] Qibla direction works
- [ ] Export data works
- [ ] Dark/light theme toggle works
- [ ] Logo displays correctly

### 4.2 Security Checks:
- [ ] RLS policies prevent users from accessing others' data
- [ ] Authentication required for sensitive actions
- [ ] API routes have proper error handling

### 4.3 Performance:
- [ ] Page loads within 3 seconds
- [ ] Images optimized
- [ ] Database queries are efficient

---

## Step 5: Share with Users

### 5.1 Onboarding Instructions
Create a simple guide for users:
1. Visit: `https://your-app.vercel.app`
2. Click "Sign up"
3. Create account with email
4. Create your tracker profile
5. Start tracking!

### 5.2 User Support
- Add a help/FAQ section in the app
- Create a support email
- Monitor Vercel logs for errors

---

## Step 6: Monitoring & Maintenance

### 6.1 Monitor Usage
- **Vercel Dashboard**: Check deployment logs, analytics
- **Supabase Dashboard**: Monitor database usage, API calls
- **Error Tracking**: Consider Sentry (free tier) for error monitoring

### 6.2 Regular Updates
- Update dependencies monthly: `npm update`
- Test locally before deploying updates
- Use Vercel's preview deployments for testing

---

## Cost Estimate (10-20 Users)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby (Free) | $0 |
| Supabase | Free Tier | $0 |
| Domain (optional) | Namecheap/Google | $10-15/year |
| **Total** | | **$0-15/year** |

**Note**: Vercel free tier includes:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless functions (sufficient for your API routes)

---

## Alternative: Self-Hosting (Advanced)

If you prefer self-hosting:

### Option 1: Railway.app
1. Connect GitHub repo
2. Add environment variables
3. Deploy (free trial, then ~$5/month)

### Option 2: DigitalOcean App Platform
1. Connect GitHub repo
2. Configure Next.js
3. Add environment variables
4. Deploy ($5/month minimum)

### Option 3: VPS (Ubuntu + PM2)
- Rent VPS ($5-10/month)
- Install Node.js, PM2, Nginx
- Clone repo, build, run
- More setup required

---

## Troubleshooting

### Issue: Environment Variables Not Working
**Solution**: 
- Double-check variable names match exactly
- Ensure `NEXT_PUBLIC_` prefix for client-side vars
- Redeploy after adding env vars in Vercel

### Issue: Database Connection Errors
**Solution**:
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Review RLS policies

### Issue: Logo Not Loading
**Solution**:
- Ensure file is in `public/` folder
- Check file name matches exactly (case-sensitive)
- Verify file is committed to git

### Issue: Users Can't Sign Up
**Solution**:
- Check Supabase Auth settings (email auth enabled)
- Verify email confirmation settings
- Check Supabase logs for errors

---

## Next Steps After Launch

1. **Gather Feedback**: Ask users for feature requests
2. **Analytics**: Add Google Analytics or similar (optional)
3. **Backup Strategy**: Regular database exports
4. **Updates**: Deploy fixes/features as needed
5. **Documentation**: Keep deployment guide updated

---

## Quick Reference Commands

```bash
# Build locally
npm run build

# Test production build
npm start

# Development
npm run dev

# Check for issues
npm run lint

# Update dependencies
npm update
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Issues**: Use for bug tracking

---

**Ready to deploy?** Follow Step 2 (Vercel) for the fastest path to production! 🚀

