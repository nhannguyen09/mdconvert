/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tăng body size limit cho upload file lớn (300MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '300mb',
    },
  },
};

export default nextConfig;
