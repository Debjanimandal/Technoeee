'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose, initialTab = 'signup' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const router = useRouter();

  // Sync tab when prop changes
  if (isOpen && initialTab !== activeTab) {
    // Only sync on open
  }

  function handleSignup(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirm = e.target.confirm.value;
    if (!username || !email || !password || !confirm) {
      alert('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match!');
      return;
    }
    localStorage.setItem('user_' + email, JSON.stringify({ username, password }));
    alert('Sign-up successful! Welcome, ' + username);
    router.push('/home?username=' + encodeURIComponent(username));
    onClose();
  }

  function handleSignin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    if (!email || !password) { alert('Please fill in all fields.'); return; }
    const userData = localStorage.getItem('user_' + email);
    if (userData) {
      const user = JSON.parse(userData);
      if (user.password === password) {
        alert('Sign-in successful! Welcome back, ' + user.username);
        router.push('/home?username=' + encodeURIComponent(user.username));
        onClose();
      } else { alert('Incorrect password.'); }
    } else { alert('No account found with this email.'); }
  }

  return (
    <div id="authModal" className={`modal${isOpen ? ' open' : ''}`}>
      <div className="modal-content">
        <button className="close" onClick={onClose}>×</button>
        <div className="tabs">
          <button
            className={`tab${activeTab === 'signup' ? ' active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >Sign Up</button>
          <button
            className={`tab${activeTab === 'signin' ? ' active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >Sign In</button>
        </div>

        <form id="signup-form" className={`form-content${activeTab === 'signup' ? ' active' : ''}`} onSubmit={handleSignup}>
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
            <input type="password" id="signup-password" name="password" placeholder="Enter your password" required />
          </div>
          <div>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm" placeholder="Confirm your password" required />
          </div>
          <button type="submit">Sign Up</button>
        </form>

        <form id="signin-form" className={`form-content${activeTab === 'signin' ? ' active' : ''}`} onSubmit={handleSignin}>
          <div>
            <label htmlFor="signin-email">Email</label>
            <input type="email" id="signin-email" name="email" placeholder="Enter your email" required />
          </div>
          <div>
            <label htmlFor="signin-password">Password</label>
            <input type="password" id="signin-password" name="password" placeholder="Enter your password" required />
          </div>
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}
