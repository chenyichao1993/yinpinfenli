# Stem Splitter - Setup Guide

Complete step-by-step guide to get your Stem Splitter application up and running.

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm** or **yarn** package manager
- **Supabase Account**: Free account at [supabase.com](https://supabase.com)
- **Gaudiolab API Key**: Your API key from Gaudiolab

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for the project to be ready

2. **Run Database Migration**
   - Go to the SQL Editor in your Supabase Dashboard
   - Copy the contents of `supabase-schema.sql`
   - Paste and run in the SQL Editor
   - Verify all tables were created successfully

3. **Get Your Supabase Credentials**
   - Go to Project Settings → API
   - Copy your:
     - Project URL
     - Anon (public) key
     - Service role key (keep this secret!)

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gaudiolab API Configuration
GAUDIOLAB_API_KEY=402014dd445779de9eec99725dc771f108be12ca0c7237a935d3ff12e2b01be2ca1d473ba142ec098f17fc6a28b4b369
NEXT_PUBLIC_GAUDIOLAB_API_URL=https://restapi.gaudiolab.io/developers/api

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=1073741824
NEXT_PUBLIC_MAX_DURATION=1200
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema Verification

After running the migration, verify your Supabase database has these tables:

- ✅ `profiles` - User profiles
- ✅ `audio_uploads` - Uploaded audio file records
- ✅ `separation_jobs` - Separation job tracking
- ✅ `separated_tracks` - Separated audio stems

## 🧪 Testing the Application

### 1. Create an Account
- Go to `/register`
- Enter email and password
- Click "Create Account"

### 2. Upload a Test File
- Go to `/upload`
- Drag and drop an audio file (MP3, WAV, etc.)
- Select the stems you want to separate
- Click "Start Separation"

### 3. Monitor Job Progress
- You'll be redirected to `/jobs/[id]`
- The page will automatically poll for updates
- Wait for the separation to complete

### 4. Download Your Stems
- Once complete, preview each stem
- Download in MP3 or WAV format
- Check your history at `/history`

## 🐛 Troubleshooting

### "Unauthorized" Error
- **Problem**: API requests return 401
- **Solution**: Check your Supabase keys in `.env.local`
- **Solution**: Make sure you're logged in

### "Failed to create upload" Error
- **Problem**: Can't upload files
- **Solution**: Verify your Gaudiolab API key
- **Solution**: Check file size (must be < 1GB)
- **Solution**: Check file format (MP3, WAV, FLAC, M4A, MP4)

### Database Connection Error
- **Problem**: Can't connect to Supabase
- **Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- **Solution**: Verify your project is active on Supabase

### RLS Policy Error
- **Problem**: Can't access data
- **Solution**: Make sure you ran the complete SQL migration
- **Solution**: Check that RLS policies are enabled

### Job Status Not Updating
- **Problem**: Job stuck in "waiting" or "running"
- **Solution**: Check Gaudiolab API status
- **Solution**: Verify your API key has credits
- **Solution**: Check browser console for errors

## 🔒 Security Checklist

Before deploying to production:

- [ ] Never commit `.env.local` to git
- [ ] Use different Supabase projects for dev/prod
- [ ] Enable rate limiting on API routes
- [ ] Set up proper CORS policies
- [ ] Enable Supabase RLS on all tables
- [ ] Use service role key only in server-side code
- [ ] Set up monitoring and error tracking

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add all environment variables from `.env.local`
   - Click "Deploy"

3. **Update Environment Variables**
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Update any other environment-specific variables

### Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test file upload
- [ ] Test stem separation
- [ ] Verify email notifications work
- [ ] Check all environment variables
- [ ] Test on mobile devices
- [ ] Monitor error logs

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Gaudiolab API Documentation](https://www.gaudiolab.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 💡 Tips for Development

1. **Use the browser console** to debug API calls
2. **Check the Network tab** to see request/response data
3. **Monitor Supabase logs** for database errors
4. **Use React DevTools** for component debugging
5. **Enable verbose logging** in development

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set
4. Make sure your API keys are valid
5. Check the Gaudiolab API status

## 🎉 Success!

If everything is working:
- ✅ Users can register and login
- ✅ Files can be uploaded
- ✅ Stems are being separated
- ✅ Audio players work
- ✅ Downloads are functional

You're ready to go! 🚀







