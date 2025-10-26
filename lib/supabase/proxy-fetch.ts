// Proxy fetch wrapper for Supabase requests
// Note: Proxy is disabled by default. Enable only if needed for your network.

export const proxyFetch: typeof fetch = (url, init) => {
  // Check if proxy should be used (only in development and if explicitly enabled)
  const useProxy = process.env.NODE_ENV === 'development' && process.env.USE_PROXY === 'true';
  
  if (useProxy && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)) {
    // For Node.js environments that support proxy env vars natively
    return fetch(url, init);
  }
  
  // Default: direct fetch without proxy
  return fetch(url, init);
};

