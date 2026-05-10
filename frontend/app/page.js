"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Pricing from "../components/Pricing";

const TEMPLATES = [
  { icon: "💻", label: "Developer", theme: "dark" },
  { icon: "🎨", label: "Designer", theme: "vibrant" },
  { icon: "📸", label: "Photographer", theme: "dark" },
  { icon: "✍️", label: "Writer", theme: "light" },
  { icon: "📊", label: "Data Scientist", theme: "dark" },
  { icon: "🎵", label: "Creative", theme: "vibrant" },
];

const FEATURES = [
  {
    icon: "📝",
    title: "Resume to Website",
    desc: "Upload your resume (PDF, DOCX, or TXT) and watch AI transform it into a stunning portfolio website.",
  },
  {
    icon: "⚡",
    title: "Instant Generation",
    desc: "Powered by Google Gemini AI — your portfolio is generated in seconds, not hours.",
  },
  {
    icon: "💬",
    title: "Conversational Edits",
    desc: "Don't like something? Just tell the AI what to change in plain English.",
  },
  {
    icon: "👁️",
    title: "Live Preview",
    desc: "See your portfolio come to life in real-time with desktop, tablet, and mobile preview modes.",
  },
  {
    icon: "🎨",
    title: "Stunning Themes",
    desc: "Choose from dark, light, or vibrant themes — each crafted with premium design aesthetics.",
  },
  {
    icon: "📱",
    title: "Fully Responsive",
    desc: "Every generated portfolio is fully responsive and looks perfect on any device.",
  },
];

const STEPS = [
  { num: "01", title: "Upload Resume", desc: "Drag & drop your resume — PDF, DOCX, or TXT. We extract all the details automatically." },
  { num: "02", title: "AI Generates", desc: "Gemini AI crafts a beautiful, unique portfolio website from your data." },
  { num: "03", title: "Preview & Refine", desc: "See the live preview and use chat to request any design changes." },
];

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const handleStartBuilding = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsLoading(true);
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/builder/${conversationId}`);
  };

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-bg" />
      <div className="landing-grid" />

      {/* Floating orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">✦</div>
          <span>PortfolioCraft AI</span>
        </div>
        <div className="nav-links">
          <a href="#how-it-works" className="nav-link">
            How it Works
          </a>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#pricing" className="nav-link">
            Pricing
          </a>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>
              Logout
            </button>
          ) : (
            <Link href="/login" className="nav-link">
              Login
            </Link>
          )}
          <button
            className="nav-link nav-link-accent"
            onClick={handleStartBuilding}
            disabled={isLoading}
            id="nav-start-btn"
          >
            {isLoading ? "Loading..." : "Build Portfolio"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Powered by Google Gemini AI
        </div>

        <h1 className="hero-title">
          Your resume,
          <br />
          <span className="hero-title-gradient">transformed into a website</span>
        </h1>

        <p className="hero-subtitle">
          Upload your resume and let PortfolioCraft AI generate a stunning,
          professional portfolio website in seconds. Edit with conversation.
        </p>

        {/* CTA Button */}
        <div className="hero-cta-group">
          <button
            className="hero-cta-primary"
            onClick={handleStartBuilding}
            disabled={isLoading}
            id="hero-start-btn"
          >
            <span className="hero-cta-icon">✦</span>
            {isLoading ? "Loading..." : "Start Building Your Portfolio"}
          </button>
          <p className="hero-cta-hint">Free • No signup required • Takes 30 seconds</p>
        </div>

        {/* Template chips */}
        <div className="template-chips">
          <span className="template-chips-label">Popular templates:</span>
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              className="template-chip"
              onClick={handleStartBuilding}
              id={`template-${i}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </main>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works" aria-label="How it works">
        <h2 className="section-title">
          <span className="section-title-accent">How it works</span>
        </h2>
        <p className="section-subtitle">Three simple steps to your dream portfolio</p>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features" aria-label="Features">
        <h2 className="section-title">
          <span className="section-title-accent">Why PortfolioCraft?</span>
        </h2>
        <p className="section-subtitle">Everything you need to create a portfolio that stands out</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-content">
          <h2 className="final-cta-title">Ready to build your portfolio?</h2>
          <p className="final-cta-desc">
            Join thousands of professionals who've crafted their dream portfolio with AI.
          </p>
          <button
            className="hero-cta-primary"
            onClick={handleStartBuilding}
            disabled={isLoading}
            id="final-start-btn"
          >
            <span className="hero-cta-icon">🚀</span>
            Get Started Now
          </button>
        </div>
      </section>

      <Pricing />

      {/* Footer */}
      <footer className="landing-footer">
        Built with ❤️ using Google Gemini AI &bull; PortfolioCraft AI © 2026
      </footer>
    </div>
  );
}
