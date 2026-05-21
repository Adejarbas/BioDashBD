/**
 * next.config.js — adiciona headers CORS para APIs
 * Usa process.env.FRONTEND_URL (definida em .env)
 */
/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    const origins = [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://98.83.234.240',
      'http://98.83.234.240:80',
      'http://100.30.203.65',
      'http://100.30.203.65:3003',
    ].filter(Boolean).join(',');
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL || 'http://localhost:3001' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
