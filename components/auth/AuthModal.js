'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Reusable password field with show/hide toggle
function PasswordField({ id, name, placeholder, label }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          id={id}
          name={name}
          placeholder={placeholder}
          required
          style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            color: '#888',
            fontSize: '16px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            // Eye-off icon
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // Eye icon
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, initialTab = 'signup' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function switchTab(tab) {
    setActiveTab(tab);
    setError('');
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const confirm = e.target.confirm.value;

    if (!username || !email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signUpError) throw signUpError;

      onClose();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignin(e) {
    e.preventDefault();
    setError('');
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      onClose();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div id="authModal" className="modal open">
      <div className="modal-content">
        <button className="close" onClick={onClose}>×</button>
        <div className="tabs">
          <button
            className={`tab${activeTab === 'signup' ? ' active' : ''}`}
            onClick={() => switchTab('signup')}
          >Sign Up</button>
          <button
            className={`tab${activeTab === 'signin' ? ' active' : ''}`}
            onClick={() => switchTab('signin')}
          >Sign In</button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
            borderRadius: '6px', fontSize: '13px', marginBottom: '10px'
          }}>
            {error}
          </div>
        )}

        {/* Sign Up Form */}
        <form
          id="signup-form"
          className={`form-content${activeTab === 'signup' ? ' active' : ''}`}
          onSubmit={handleSignup}
        >
          <div>
            <label htmlFor="signup-username">Username</label>
            <input type="text" id="signup-username" name="username" placeholder="Enter your username" required />
          </div>
          <div>
            <label htmlFor="signup-email">Email</label>
            <input type="email" id="signup-email" name="email" placeholder="Enter your email" required />
          </div>
          <PasswordField id="signup-password" name="password" placeholder="At least 6 characters" label="Password" />
          <PasswordField id="confirm-password" name="confirm" placeholder="Confirm your password" label="Confirm Password" />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Sign In Form */}
        <form
          id="signin-form"
          className={`form-content${activeTab === 'signin' ? ' active' : ''}`}
          onSubmit={handleSignin}
        >
          <div>
            <label htmlFor="signin-email">Email</label>
            <input type="email" id="signin-email" name="email" placeholder="Enter your email" required />
          </div>
          <PasswordField id="signin-password" name="password" placeholder="Enter your password" label="Password" />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
