/**
 * Supabase Admin Client (Service Role)
 * 用于 API 路由中需要绕过 RLS 的操作
 * 
 * ⚠️ 警告：此客户端拥有完全权限，仅在服务端使用！
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * 创建 Supabase Admin 客户端（拥有 service_role 权限）
 * ⚠️ 仅在服务端 API 路由中使用
 */
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

