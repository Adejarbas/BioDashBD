/**
 * next.config.js — adiciona headers CORS para APIs
 * Usa process.env.FRONTEND_URL (definida em .env)
 */
/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    const origin = process.env.FRONTEND_URL || 'http://localhost:3001'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
