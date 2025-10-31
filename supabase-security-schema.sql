-- 安全限制 Schema
-- 运行此 SQL 在 Supabase SQL Editor 中

-- 1. 注册 IP 追踪表
-- user_id 可以为 NULL：用于记录失败的注册尝试（5分钟限制计数）
-- user_id 不为 NULL：表示成功的注册（用于 24 小时和一年限制）
CREATE TABLE IF NOT EXISTS registration_ip_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 可以为 NULL
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 全局免费额度追踪表（IP/设备指纹在 30 天内的使用统计）
CREATE TABLE IF NOT EXISTS global_quota_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  fingerprint TEXT,
  composite_key TEXT NOT NULL, -- ip_address + fingerprint 组合键
  uses_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_reg_ip_address ON registration_ip_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_reg_created ON registration_ip_tracking(registered_at);
CREATE INDEX IF NOT EXISTS idx_reg_user_id ON registration_ip_tracking(user_id) WHERE user_id IS NOT NULL; -- 部分索引：只索引非 NULL 的 user_id（成功的注册）
CREATE INDEX IF NOT EXISTS idx_global_quota_composite ON global_quota_tracking(composite_key);
CREATE INDEX IF NOT EXISTS idx_global_quota_ip ON global_quota_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_global_quota_created ON global_quota_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_global_quota_last_used ON global_quota_tracking(last_used_at);

-- 启用 Row Level Security
ALTER TABLE registration_ip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_quota_tracking ENABLE ROW LEVEL SECURITY;

-- RLS 策略：注册 IP 追踪只允许 service role 管理（服务端）
CREATE POLICY "Service role can manage registration IP tracking"
  ON registration_ip_tracking
  FOR ALL
  TO service_role
  USING (true);

-- RLS 策略：全局额度追踪只允许 service role 管理（服务端）
CREATE POLICY "Service role can manage global quota tracking"
  ON global_quota_tracking
  FOR ALL
  TO service_role
  USING (true);

-- 函数：清理旧的注册 IP 追踪记录（超过 1 年的记录）
CREATE OR REPLACE FUNCTION public.cleanup_old_registration_tracking()
RETURNS void AS $$
BEGIN
  DELETE FROM registration_ip_tracking
  WHERE registered_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- 函数：清理旧的全局额度追踪记录（超过 30 天的记录）
CREATE OR REPLACE FUNCTION public.cleanup_old_global_quota_tracking()
RETURNS void AS $$
BEGIN
  DELETE FROM global_quota_tracking
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON TABLE registration_ip_tracking IS '注册 IP 追踪表（用于限制同一 IP 的注册频率）';
COMMENT ON TABLE global_quota_tracking IS '全局免费额度追踪表（IP/设备指纹在 30 天内的使用统计）';

