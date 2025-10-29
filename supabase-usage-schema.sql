-- 免费用户使用限制 Schema
-- 运行此 SQL 在 Supabase SQL Editor 中

-- 1. 匿名用户使用记录表
CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint TEXT NOT NULL,
  ip_subnet TEXT NOT NULL,
  composite_key TEXT NOT NULL UNIQUE,
  uses_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户配额表
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_free_uses INTEGER DEFAULT 2,
  used_count INTEGER DEFAULT 0,
  is_email_verified BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 使用历史表（审计日志）
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID,
  ip_address TEXT,
  fingerprint TEXT,
  audio_duration INTEGER,
  is_free_tier BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_anonymous_composite ON anonymous_usage(composite_key);
CREATE INDEX IF NOT EXISTS idx_anonymous_created ON anonymous_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_user ON usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_created ON usage_history(created_at);

-- 启用 Row Level Security
ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的配额
CREATE POLICY "Users can view own quota" 
  ON user_quotas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quota" 
  ON user_quotas FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能查看自己的历史
CREATE POLICY "Users can view own history" 
  ON usage_history FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS 策略：匿名使用只允许 service role 管理（服务端）
CREATE POLICY "Service role can manage anonymous usage"
  ON anonymous_usage
  FOR ALL
  TO service_role
  USING (true);

-- 函数：新用户注册时自动创建配额
CREATE OR REPLACE FUNCTION public.handle_new_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, total_free_uses, used_count, is_email_verified)
  VALUES (NEW.id, 2, 0, COALESCE(NEW.email_confirmed_at IS NOT NULL, false));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：用户注册时自动创建配额
DROP TRIGGER IF EXISTS on_user_quota_created ON auth.users;
CREATE TRIGGER on_user_quota_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_quota();

-- 函数：清理旧的匿名使用记录（可选，定期运行）
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM anonymous_usage
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON TABLE anonymous_usage IS '匿名用户使用记录（浏览器指纹 + IP）';
COMMENT ON TABLE user_quotas IS '注册用户免费配额（永久 2 次）';
COMMENT ON TABLE usage_history IS '使用历史审计日志';

