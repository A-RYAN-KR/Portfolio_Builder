"use client";

import { useState } from 'react';
import Script from 'next/script';
import { toast } from 'react-hot-toast';

export default function Pricing() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async (plan, price) => {
    console.log(`Initiating payment for ${plan} plan: ₹${price}`);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login first to purchase a plan.");
      return window.location.href = '/login';
    }
    
    setLoading(true);
    try {
      // Create order via backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: price })
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            toast.error('Session expired. Please login again.');
            return window.location.href = '/login';
        }
        throw new Error('Payment creation failed');
      }
      const order = await res.json();

      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please check your connection.");
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "PortfolioCraft AI",
        description: `${plan} Plan`,
        order_id: order.id,
        handler: function (response) {
          toast.success(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
          toast.error(`Payment Failed! Reason: ${response.error.description}`);
      });
      rzp1.open();
    } catch (err) {
      console.error(err);
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pricing" id="pricing">
      <Script 
        id="razorpay-checkout-js" 
        src="https://checkout.razorpay.com/v1/checkout.js" 
      />
      <h2 className="section-title">
        <span className="section-title-accent">Simple Pricing</span>
      </h2>
      <p className="section-subtitle">Choose the perfect plan for your needs</p>
      
      <div className="pricing-grid" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
        <div className="pricing-card" style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '1rem', border: '1px solid #333', textAlign: 'center', width: '300px', position: 'relative', zIndex: 1 }}>
          <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>Basic</h3>
          <p style={{ color: '#aaa', fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>₹99<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span></p>
          <ul style={{ color: '#ccc', listStyle: 'none', padding: 0, marginBottom: '2rem', textAlign: 'left' }}>
            <li style={{ marginBottom: '0.5rem' }}>✓ 1 Portfolio</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ 3 AI Generations</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Basic Themes</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handlePayment('Basic', 99)}
            style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
            Choose Basic
          </button>
        </div>

        <div className="pricing-card" style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '1rem', border: '1px solid #3b82f6', textAlign: 'center', width: '300px', transform: 'scale(1.05)', position: 'relative', zIndex: 2 }}>
          <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>Pro</h3>
          <p style={{ color: '#aaa', fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>₹299<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span></p>
          <ul style={{ color: '#ccc', listStyle: 'none', padding: 0, marginBottom: '2rem', textAlign: 'left' }}>
            <li style={{ marginBottom: '0.5rem' }}>✓ Unlimited Portfolios</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Unlimited AI Generations</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Premium Themes</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Custom Domain</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handlePayment('Pro', 299)}
            style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
            Choose Pro
          </button>
        </div>
      </div>
    </section>
  );
}
