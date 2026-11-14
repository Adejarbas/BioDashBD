/** @type {import('next').NextConfig} */
// CORS é aplicado dinamicamente pelo middleware conforme a origem da chamada.
// No Next.js 16+, instrumentation.ts é carregado nativamente por padrão.
const nextConfig = {
  serverExternalPackages: [
    '@azure/monitor-opentelemetry',
    '@opentelemetry/instrumentation',
  ],
};

module.exports = nextConfig;
