/** @type {import('next').NextConfig} */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const nextConfig = {
  // Configuração para desenvolvimento local
  reactStrictMode: true,
  
  // Forçar renderização dinâmica para todas as páginas
  trailingSlash: false,
  generateEtags: false,
  
  // Configuração de output tracing
  outputFileTracingRoot: path.join(__dirname, '../..'),
  
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'FitOS',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // Rewrites para API (apenas em desenvolvimento)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
        // Better Auth routes
        {
          source: '/api/auth/:path*',
          destination: `${apiUrl}/api/auth/:path*`,
        },
      ];
    }
    return [];
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
  
  // Configurações experimentais removidas para evitar warnings
  
  // Configuração de headers (apenas em desenvolvimento)
  async headers() {
    if (process.env.NODE_ENV === 'development') {
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
    }
    return [];
  },
};

module.exports = nextConfig;
