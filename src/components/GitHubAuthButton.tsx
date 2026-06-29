'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';

interface GitHubAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function GitHubAuthButton({ children, className, redirectTo = '/swipe', ...props }: GitHubAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      let idToken = '';
      
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
        idToken = 'mock_developer_token';
      } else {
        const provider = new GithubAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        idToken = await userCredential.user.getIdToken();
      }

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isNew) {
          router.push('/onboarding');
        } else {
          router.push(redirectTo);
        }
        router.refresh();
      } else {
        console.error('Failed to create session');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
