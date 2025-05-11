/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix PDF.js import errors
  transpilePackages: ['pdfjs-dist'],
  
  // Disable strictmode to prevent duplicate mounting
  reactStrictMode: false,
  
  // Explicitly handle browser-only modules
  webpack: (config) => {
    // Make these node modules empty during server-side rendering
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  
  // Increase allowed image size to handle PDFs
  images: {
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },
};

module.exports = nextConfig;
