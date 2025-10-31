-- 清理特定测试数据的 SQL 脚本
-- 在 Supabase SQL Editor 中执行，用于清理本地测试环境（IP: ::1）的数据

-- 1. 删除本地测试环境的匿名用户记录
DELETE FROM anonymous_usage 
WHERE ip_subnet LIKE '%::1%' OR composite_key LIKE '%::1%';

-- 2. 删除本地测试环境的全局额度追踪记录
DELETE FROM global_quota_tracking 
WHERE ip_address = '::1' OR composite_key LIKE '%::1%';

-- 3. 查看清理后的结果（验证）
SELECT 
  'anonymous_usage' as table_name,
  COUNT(*) as remaining_count
FROM anonymous_usage
WHERE ip_subnet LIKE '%::1%' OR composite_key LIKE '%::1%'
UNION ALL
SELECT 
  'global_quota_tracking' as table_name,
  COUNT(*) as remaining_count
FROM global_quota_tracking 
WHERE ip_address = '::1' OR composite_key LIKE '%::1%';

-- 如果两个 remaining_count 都是 0，说明清理成功

