# Deployment Guide

## Prerequisites for Production

- [ ] Supabase production project created
- [ ] Gaudiolab API key with sufficient credits
- [ ] Domain name (optional but recommended)
- [ ] GitHub/GitLab account for version control

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Stem Splitter MVP"

# Push to GitHub
git remote add origin https://github.com/yourusername/stem-splitter.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Production Supabase

1. **Create Production Project**
   - Create a new Supabase project for production
   - Run the `supabase-schema.sql` in the SQL Editor
   - Verify all tables and policies are created

2. **Configure Auth Settings**
   - Go to Authentication → Settings
   - Set up email templates
   - Configure redirect URLs
   - Add your production domain to allowed URLs

### Step 3: Deploy to Vercel

1. **Import Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select "Next.js" framework

2. **Configure Environment Variables**
   Add these in Vercel project settings:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
   GAUDIOLAB_API_KEY=your-gaudiolab-api-key
   NEXT_PUBLIC_GAUDIOLAB_API_URL=https://restapi.gaudiolab.io/developers/api
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_MAX_FILE_SIZE=1073741824
   NEXT_PUBLIC_MAX_DURATION=1200
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed site!

### Step 4: Post-Deployment Configuration

1. **Update Supabase Redirect URLs**
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel URLs:
     - Site URL: `https://your-domain.vercel.app`
     - Redirect URLs: `https://your-domain.vercel.app/**`

2. **Test All Features**
   - [ ] User registration
   - [ ] User login
   - [ ] File upload
   - [ ] Stem separation
   - [ ] Audio playback
   - [ ] File download
   - [ ] History page

## 🌍 Custom Domain Setup

### On Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### Update Environment Variables

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Update Supabase

- Add custom domain to allowed redirect URLs
- Update email templates with new domain

## 📊 Monitoring & Analytics

### Set Up Error Tracking

#### Using Sentry (Recommended)

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Configure**
   - Add DSN to environment variables
   - Test error reporting

### Set Up Analytics

#### Using Vercel Analytics

1. Go to Vercel project → Analytics
2. Enable Web Analytics
3. Add to `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 🔒 Production Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies enabled on all tables
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Service role key only used server-side
- [ ] API keys in environment variables
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Content Security Policy configured
- [ ] Error messages don't expose sensitive data

## ⚡ Performance Optimization

### Enable Edge Functions

Add to `next.config.js`:

```javascript
module.exports = {
  experimental: {
    runtime: 'edge',
  },
}
```

### Image Optimization

Already configured in `next.config.js` for Supabase and Gaudiolab CDN.

### Caching Strategy

- Static pages cached at edge
- API routes use stale-while-revalidate
- Audio files served from CDN

## 📈 Scaling Considerations

### Database

- **Connection Pooling**: Enabled by default with Supabase
- **Indexes**: Already optimized in schema
- **Backups**: Automatic with Supabase

### File Storage

- **CDN**: Gaudiolab provides CDN for separated files
- **Expiration**: Files expire after set time (configured in Gaudiolab)

### Rate Limiting

Add to API routes:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## 🐛 Debugging Production Issues

### View Logs

#### Vercel Logs
```bash
vercel logs
```

#### Supabase Logs
- Go to Supabase Dashboard → Logs

### Common Issues

**Issue**: "Failed to create upload"
- Check Gaudiolab API key
- Verify API credits available
- Check file size limits

**Issue**: "Unauthorized" errors
- Verify Supabase environment variables
- Check user session
- Review RLS policies

**Issue**: Slow performance
- Enable Vercel Edge Functions
- Check database query performance
- Verify CDN caching

## 🔄 CI/CD Pipeline

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Branch Protection

Set up on GitHub:
1. Require pull request reviews
2. Require status checks to pass
3. Enable automatic branch deletion

## 📱 Mobile Testing

Test on real devices:
- iOS Safari
- Android Chrome
- Various screen sizes

Use BrowserStack or similar for comprehensive testing.

## 🎯 Go-Live Checklist

- [ ] All environment variables set
- [ ] Database migrated
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] All features tested
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] SEO metadata complete
- [ ] robots.txt configured
- [ ] Sitemap generated
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## 📧 Support & Maintenance

### Regular Tasks

- Monitor error logs weekly
- Check API usage monthly
- Review user feedback
- Update dependencies quarterly
- Backup database regularly
- Test disaster recovery

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Test locally
npm run dev

# Deploy
git push origin main
```

## 🎉 You're Live!

Your Stem Splitter application is now running in production!

Monitor your application and iterate based on user feedback.







