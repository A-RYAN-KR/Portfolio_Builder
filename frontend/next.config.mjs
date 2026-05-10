/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Added StackBlitz, WebContainer domains, and blob: to frame-src
            value: "frame-src 'self' https://*.razorpay.com https://razorpay.com https://stackblitz.com https://*.webcontainer.io blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://razorpay.com;"
          },
          // WebContainers STRICTLY require these two headers to enable SharedArrayBuffer
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp", 
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin", // Note: If Razorpay popups break with this, change back to "same-origin-allow-popups"
          },
        ],
      },
    ];
  },
};

export default nextConfig;