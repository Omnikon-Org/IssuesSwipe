'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, GitBranch, LogOut, User as UserIcon, ShieldAlert, Sparkles, Menu, X } from 'lucide-react';

interface UserSession {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  xp: number;
  streak: number;
  rank: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setSession(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [pathname]); // Refresh session metrics on page changes

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { name: 'Swipe Feed', href: '/swipe', icon: Sparkles },
    { name: 'Saved Matches', href: '/matches', icon: GitBranch },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Admin', href: '/admin', icon: ShieldAlert },
  ];

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="h-6 w-6 text-brand-red animate-pulse" />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-red to-brand-green bg-clip-text text-transparent">
              IssueSwipe
            </span>
          </div>
          <div className="h-6 w-32 bg-dark-border rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/85 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={session ? '/swipe' : '/'} className="flex items-center space-x-2 group">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-red/20 to-brand-green/20 group-hover:scale-105 transition-transform duration-200">
                <Flame className="h-6 w-6 text-brand-red group-hover:text-brand-green transition-colors" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-red via-brand-purple to-brand-green bg-clip-text text-transparent">
                IssueSwipe
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          {session && (
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                        : 'text-gray-400 hover:bg-dark-border hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Metrics & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                {/* Streak */}
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold animate-pulse-slow">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  <span>{session.streak}d Streak</span>
                </div>

                {/* Profile Widget */}
                <div className="flex items-center space-x-3 pl-3 border-l border-dark-border">
                  <Link href="/profile" className="flex items-center space-x-2.5 group">
                    {session.avatarUrl ? (
                      <img
                        src={session.avatarUrl}
                        alt={session.username}
                        className="h-8 w-8 rounded-full border border-dark-border group-hover:border-brand-blue/40 transition-colors"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-dark-border flex items-center justify-center text-xs font-bold text-white">
                        {session.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-200 group-hover:text-brand-blue transition-colors">
                        @{session.username}
                      </p>
                      <p className="text-[10px] text-gray-400">{session.rank}</p>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-all cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/api/auth/github"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <span>Sign in with GitHub</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {session && (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-semibold">
                <Flame className="h-3 w-3 fill-orange-400" />
                <span>{session.streak}d</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:bg-dark-border hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && session && (
        <div className="md:hidden glass border-b border-dark-border px-4 pt-2 pb-4 space-y-2 animate-in fade-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : 'text-gray-400 hover:bg-dark-border hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-dark-border flex items-center justify-between">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5"
            >
              {session.avatarUrl ? (
                <img src={session.avatarUrl} alt={session.username} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-dark-border flex items-center justify-center text-xs font-bold">
                  {session.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-200">@{session.username}</p>
                <p className="text-[10px] text-gray-400">{session.rank}</p>
              </div>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-red hover:bg-brand-red/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
