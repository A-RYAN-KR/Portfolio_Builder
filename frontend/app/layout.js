import "./globals.css";
import "./resume-form.css";
import "./sandbox.css";
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "PortfolioCraft AI — Generate Stunning Portfolio Websites",
  description:
    "Create beautiful, professional portfolio websites in seconds. Paste your resume data and let AI craft a stunning personal website for you.",
  keywords: "portfolio generator, AI, website builder, resume, personal website, Gemini AI",
  openGraph: {
    title: "PortfolioCraft AI — Generate Stunning Portfolio Websites",
    description: "Create beautiful, professional portfolio websites in seconds powered by Gemini AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* 2. Add the Razorpay script here with beforeInteractive strategy */}
        <Script 
          src="https://razorpay.com" 
          strategy="beforeInteractive" 
        />
      </head>
      <body>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        {children}
      </body>
    </html>
  );
}
