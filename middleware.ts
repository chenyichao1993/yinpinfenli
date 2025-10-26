import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 临时禁用认证检查，让您可以预览网站
  // 配置好 Supabase 后请恢复此中间件
  return NextResponse.next();
  
  /* 配置 Supabase 后取消下面的注释
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect authenticated routes
  const protectedPaths = ['/upload', '/history', '/jobs'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to upload if already logged in and trying to access auth pages
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname.startsWith(path));

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/upload', req.url));
  }

  return res;
  */
}

export const config = {
  matcher: ['/upload/:path*', '/history/:path*', '/jobs/:path*', '/login', '/register'],
};





