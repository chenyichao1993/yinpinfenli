-- Stem Splitter Database Schema
-- Run this script in your Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX idx_audio_uploads_user_id ON audio_uploads(user_id);
CREATE INDEX idx_audio_uploads_created_at ON audio_uploads(created_at DESC);
CREATE INDEX idx_separation_jobs_user_id ON separation_jobs(user_id);
CREATE INDEX idx_separation_jobs_status ON separation_jobs(status);
CREATE INDEX idx_separation_jobs_created_at ON separation_jobs(created_at DESC);
CREATE INDEX idx_separated_tracks_job_id ON separated_tracks(job_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE separation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE separated_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policies for audio_uploads
CREATE POLICY "Users can view own uploads" 
  ON audio_uploads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" 
  ON audio_uploads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" 
  ON audio_uploads FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" 
  ON audio_uploads FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for separation_jobs
CREATE POLICY "Users can view own jobs" 
  ON separation_jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" 
  ON separation_jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" 
  ON separation_jobs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" 
  ON separation_jobs FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for separated_tracks
CREATE POLICY "Users can view own tracks" 
  ON separated_tracks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM separation_jobs 
      WHERE separation_jobs.id = separated_tracks.job_id 
      AND separation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tracks" 
  ON separated_tracks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM separation_jobs 
      WHERE separation_jobs.id = separated_tracks.job_id 
      AND separation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tracks" 
  ON separated_tracks FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM separation_jobs 
      WHERE separation_jobs.id = separated_tracks.job_id 
      AND separation_jobs.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to authentication';
COMMENT ON TABLE audio_uploads IS 'Uploaded audio files metadata';
COMMENT ON TABLE separation_jobs IS 'Audio separation job records';
COMMENT ON TABLE separated_tracks IS 'Individual separated audio stems';





