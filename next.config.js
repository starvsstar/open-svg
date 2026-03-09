const parseCsv = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getConfiguredUrl = () => {
  try {
    return process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL) : null;
  } catch {
    return null;
  }
};

const configuredUrl = getConfiguredUrl();
const allowedOrigins = Array.from(
  new Set([
    "localhost:3000",
    "127.0.0.1:3000",
    configuredUrl?.host,
    ...parseCsv(process.env.ALLOWED_ORIGINS),
  ].filter(Boolean))
);

const imageDomains = Array.from(
  new Set([
    "localhost",
    "127.0.0.1",
    configuredUrl?.hostname,
    ...parseCsv(process.env.IMAGE_DOMAINS),
  ].filter(Boolean))
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins,
      appDir: true,
    }
  },
  images: {
    domains: imageDomains
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig 
