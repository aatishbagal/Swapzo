import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@opentelemetry/exporter-jaeger': false,
      };
    }
    
    // Ignore OpenTelemetry warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/,
    ];
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@opentelemetry/sdk-node']
  }
};

export default nextConfig;