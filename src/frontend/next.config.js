/** @type {import('next').NextConfig} */
const path = require('path');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Configurações básicas
  reactStrictMode: true,

  // Compressão (Sprint 7 Otimizações)
  compress: true,

  // Experimental features
  experimental: {
    // Otimizações de bundle
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*', 'chart.js', 'recharts'],
  },

  // Transpile SWR para evitar problemas com barrel optimization
  transpilePackages: ['swr'],

  // Desabilitar erros de ESLint durante o build (temporário)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Desabilitar verificação de tipos durante o build (temporário)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configurações de output
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Configuração do Turbopack (Next.js 15+)
  turbopack: {
    root: path.join(__dirname, '../../'), // Mesmo valor que outputFileTracingRoot
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Configurações de webpack (apenas quando Turbopack não estiver disponível)
  webpack: (config, { dev, isServer, webpack }) => {
    // Fallbacks para Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Cache persistente para desenvolvimento (apenas se não estiver usando Turbopack)
    if (dev && !process.env.TURBOPACK) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.join(__dirname, '.next/cache/webpack'),
      };
    }

    return config;
  },

  // Headers de segurança para PWA (seguindo documentação oficial Next.js)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },

  // Configurações de redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },

  // Configurações de rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },

  // Configurações de PWA
  async generateBuildId() {
    return 'fitos-build-' + Date.now();
  },
};

module.exports = withBundleAnalyzer(nextConfig);