/** @type {import('next').NextConfig} */
// CORS é aplicado dinamicamente pelo middleware conforme a origem da chamada.
const nextConfig = {
  // Garante que o instrumentation.ts seja chamado no ciclo de vida do Next.js
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
