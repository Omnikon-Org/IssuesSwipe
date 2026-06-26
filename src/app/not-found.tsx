import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 glass-premium p-10 rounded-3xl glow-purple border border-dark-border">
        <div className="mx-auto w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center glow-purple">
          <ShieldAlert className="h-12 w-12 text-brand-purple" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-6xl font-black text-text-primary tracking-tighter">404</h1>
          <h2 className="text-xl font-bold text-text-secondary">Page Not Found</h2>
          <p className="text-sm text-text-tertiary">
            The repository or page you are looking for has been archived, deleted, or never existed.
          </p>
        </div>

        <Link 
          href="/swipe" 
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-sm shadow-md transition-all hover:-translate-y-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to safety</span>
        </Link>
      </div>
    </div>
  );
}
