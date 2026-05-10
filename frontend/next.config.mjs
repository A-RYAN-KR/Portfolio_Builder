/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Added https://*.webcontainer-api.io to the frame-src
            value: "frame-src 'self' https://*.razorpay.com https://razorpay.com https://stackblitz.com https://*.webcontainer.io https://*.webcontainer-api.io blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://razorpay.com;"
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp", 
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin", 
          },
        ],
      },
    ];
  },
};

export default nextConfig;