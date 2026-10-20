const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // El frontend habla con el backend en same-origin, igual que nginx en producción.
    return [
      { source: '/api/:path*', destination: `${SERVER_URL}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${SERVER_URL}/socket.io/:path*` }
    ];
  }
};

export default nextConfig;
