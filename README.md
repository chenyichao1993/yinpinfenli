# Stem Splitter - AI-Powered Audio Stem Separation

Professional-grade audio stem separation powered by advanced AI. Extract vocals, drums, bass, guitar, and piano from any audio track in minutes.

## Features

- 🎤 **5 Stem Types**: Separate vocals, drums, bass, electric guitar, and acoustic piano
- ⚡ **Fast Processing**: Get results in just a few minutes
- 🎵 **Multiple Formats**: Support for MP3, WAV, FLAC, M4A, and MP4 files
- 💾 **Dual Download**: Get your stems in both MP3 and WAV formats
- 🎧 **Online Preview**: Listen to separated stems before downloading
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔐 **Secure Authentication**: User accounts powered by Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **API**: Gaudiolab Audio Separation API
- **Deployment**: Vercel (recommended)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Gaudiolab API key ([gaudiolab.com](https://www.gaudiolab.com))

## Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd yinpinfenli
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Run the database migration script (see Database Schema below)
3. Create a storage bucket named `audio-files` with public access
4. Copy your project URL and keys

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gaudiolab API Configuration
GAUDIOLAB_API_KEY=your_gaudiolab_api_key
NEXT_PUBLIC_GAUDIOLAB_API_URL=https://restapi.gaudiolab.io/developers/api

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=1073741824
NEXT_PUBLIC_MAX_DURATION=1200
\`\`\`

### 5. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio uploads table
CREATE TABLE audio_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT,
  duration INTEGER,
  format TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploading', 'uploaded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separation jobs table
CREATE TABLE separation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  audio_upload_id UUID REFERENCES audio_uploads(id) ON DELETE CASCADE NOT NULL,
  gaudiolab_job_id TEXT NOT NULL,
  gaudiolab_upload_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'running', 'success', 'failed')),
  separation_types TEXT[] NOT NULL,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Separated tracks table
CREATE TABLE separated_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES separation_jobs(id) ON DELETE CASCADE NOT NULL,
  track_type TEXT NOT NULL,
  mp3_url TEXT NOT NULL,
  wav_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audio_uploads_user_id ON audio_uploads(user_id);
CREATE INDEX idx_separation_jobs_user_id ON separation_jobs(user_id);
CREATE INDEX idx_separation_jobs_status ON separation_jobs(status);
CREATE INDEX idx_separated_tracks_job_id ON separated_tracks(job_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE separation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE separated_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own uploads" ON audio_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON audio_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own jobs" ON separation_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON separation_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tracks" ON separated_tracks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM separation_jobs 
    WHERE separation_jobs.id = separated_tracks.job_id 
    AND separation_jobs.user_id = auth.uid()
  )
);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

## Project Structure

\`\`\`
yinpinfenli/
├── app/
│   ├── (auth)/          # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (main)/          # Main application pages
│   │   ├── upload/
│   │   ├── jobs/[id]/
│   │   └── history/
│   ├── api/             # API routes
│   │   ├── upload/
│   │   └── jobs/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/              # UI components (shadcn/ui)
│   ├── AudioPlayer.tsx
│   ├── FileUploader.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── gaudiolab/       # Gaudiolab API client
│   └── utils.ts
├── types/
│   └── index.ts         # TypeScript types
└── public/
\`\`\`

## Features in Detail

### Audio Upload
- Drag & drop interface
- File format validation (MP3, WAV, FLAC, M4A, MP4)
- File size validation (max 1GB)
- Multiple stem selection

### Stem Separation
- Powered by Gaudiolab's advanced AI
- Support for 5 instrument types:
  - Vocals
  - Drums
  - Bass
  - Electric Guitar
  - Acoustic Piano

### Job Management
- Real-time status updates
- Job history with filtering
- Automatic status polling
- Expiration date tracking

### Audio Player
- Built-in preview player
- Individual volume control
- Download in MP3 or WAV format
- Responsive design

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## API Limits

- **Max File Size**: 1GB
- **Max Duration**: 20 minutes
- **File Formats**: MP3, WAV, FLAC, M4A, MP4
- **Rate Limits**: Refer to Gaudiolab API documentation

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
- Create an issue on GitHub
- Contact support@stemsplitter.com

## Acknowledgments

- [Gaudiolab](https://www.gaudiolab.com) for the audio separation API
- [Supabase](https://supabase.com) for authentication and database
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [Next.js](https://nextjs.org) for the framework
\`\`\`





