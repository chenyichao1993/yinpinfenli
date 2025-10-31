-- 清理测试数据的 SQL 脚本
-- 在 Supabase SQL Editor 中执行此脚本，用于清空测试数据

-- 1. 清空匿名用户使用记录
DELETE FROM anonymous_usage;

-- 2. 清空全局额度追踪记录
DELETE FROM global_quota_tracking;

-- 3. 清空注册 IP 追踪记录（可选，如果只想清理测试数据）
-- DELETE FROM registration_ip_tracking WHERE user_id IS NULL; -- 只删除失败的注册尝试

-- 4. 查看清理后的记录数（验证）
SELECT 
  (SELECT COUNT(*) FROM anonymous_usage) as anonymous_count,
  (SELECT COUNT(*) FROM global_quota_tracking) as global_quota_count;

-- 注意：此脚本会删除所有测试数据
-- 在生产环境使用时请谨慎，建议先备份数据

