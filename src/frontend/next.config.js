/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para desenvolvimento local
  reactStrictMode: true,
  
  // Desabilitar pre-rendering estático durante o build para evitar problemas com hooks
  output: 'standalone',
  
  // Desabilitar ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuração de imagens
  images: {
    domains: ['localhost', 'fitos.com', 'images.unsplash.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Variáveis de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'FitOS',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // Rewrites para API
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // Configuração de webpack
  webpack: (config, { dev, isServer }) => {
    // Fallbacks para Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
  
  // Configuração de headers para desenvolvimento
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
