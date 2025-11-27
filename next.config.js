/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/swagger.yaml",
        headers: [
          { key: "Content-Type", value: "application/x-yaml" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;