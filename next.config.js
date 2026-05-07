/**
 * next.config.js — adiciona headers CORS para APIs
 * Usa process.env.FRONTEND_URL (definida em .env)
 */
/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    const origin = process.env.FRONTEND_URL || 'http://13.221.119.47'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}
