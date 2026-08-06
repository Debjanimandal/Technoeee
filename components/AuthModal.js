'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
      // Sign up — pass username in metadata so the DB trigger auto-creates the profile
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signUpError) throw signUpError;

      onClose();
      router.push('/home?username=' + encodeURIComponent(username));
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

      // Fetch username from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      onClose();
      router.push('/home?username=' + encodeURIComponent(profile?.username || email));
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
          <div>
            <label htmlFor="signup-password">Password</label>
            <input type="password" id="signup-password" name="password" placeholder="At least 6 characters" required />
          </div>
          <div>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm" placeholder="Confirm your password" required />
          </div>
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
          <div>
            <label htmlFor="signin-password">Password</label>
            <input type="password" id="signin-password" name="password" placeholder="Enter your password" required />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
