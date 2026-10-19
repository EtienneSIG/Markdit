export const webContentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "form-action 'none'",
].join('; ');

export function webSecurityHeaders(tls = false) {
  return {
    'Content-Security-Policy': `${webContentSecurityPolicy}; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': 'no-store',
    ...(tls ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
  };
}
