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
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    // Remove /api suffix if present in env var to avoid dubbing it in destination
    const destinationBase = apiUrl.replace(/\/api$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${destinationBase}/api/:path*`,
      },
    ];
  },

  // Configurações de PWA
  async generateBuildId() {
    return 'fitos-build-' + Date.now();
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  // Estratégias de cache otimizadas
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ]
});

module.exports = withBundleAnalyzer(withPWA(nextConfig));