/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Added *.razorpay.com and checkout.razorpay.com
            value: "frame-src 'self' https://*.razorpay.com https://razorpay.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://razorpay.com;"
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", 
          },
        ],
      },
    ];
  },
};

export default nextConfig;