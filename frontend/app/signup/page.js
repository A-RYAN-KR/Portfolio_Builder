"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid #333' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Create an Account</h1>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{success}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#000', color: '#fff', outline: 'none' }}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#000', color: '#fff', outline: 'none' }}
              required 
            />
          </div>
          <button type="submit" style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginTop: '1rem' }}>
            Sign Up
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>
          Already have an account? <Link href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
