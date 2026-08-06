'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('username') || 'User';

  function logout() {
    alert('You have been logged out.');
    router.push('/');
  }

  return (
    <div style={{
      fontFamily: '"Poppins", sans-serif',
      margin: 0, padding: 0,
      backgroundColor: '#0a0e1a', color: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '40px', borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        maxWidth: '600px', width: '90%'
      }}>
        <h1 style={{ fontSize: '36px', marginBottom: '20px', color: '#3A8AFF' }}>
          Welcome, <span>{username}</span>!
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '30px', color: '#cccccc' }}>
          You have successfully signed in. Explore your learning journey here.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: '5px',
              fontSize: '16px', cursor: 'pointer',
              backgroundColor: '#ff4d4d', color: 'white',
              transition: 'background-color 0.3s ease', fontFamily: '"Poppins", sans-serif'
            }}
          >
            Logout
          </button>
          <a
            href="/dashboard"
            style={{
              padding: '10px 20px', border: 'none', borderRadius: '5px',
              fontSize: '16px', cursor: 'pointer',
              backgroundColor: '#3A8AFF', color: 'white',
              textDecoration: 'none', display: 'inline-block',
              transition: 'background-color 0.3s ease'
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
