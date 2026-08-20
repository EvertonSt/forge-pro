/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@forge-pro/ai',
    '@forge-pro/cms',
    '@forge-pro/db',
    '@forge-pro/design-system',
    '@forge-pro/payments',
    '@forge-pro/shared-types',
  ],
  // Self-contained server output: the desktop shell (apps/desktop) stages
  // .next/standalone + .next/static and runs it in a native window, so the
  // portal's demo mode ships without dragging a full monorepo along. The
  // regular `next start` path used by e2e/CI is unaffected.
  output: 'standalone',
};

export default nextConfig;
