'use client';

import { useState, useEffect } from 'react';
import { Flame, Star, Award, GitPullRequest, GitMerge, CheckCircle, Clock, Shield, Sparkles } from 'lucide-react';

interface XPTransaction {
  id: string;
  amount: number;
  action: string;
  createdAt: string;
}

interface Repository {
  name: string;
  owner: string;
}

interface Issue {
  title: string;
  number: number;
  url: string;
  repository: Repository;
}

interface Contribution {
  id: string;
  status: string;
  prUrl: string | null;
  updatedAt: string;
  issue: Issue;
}

interface UserProfileData {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  publicReposCount: number;
  xp: number;
  streak: number;
  rank: string;
  languages: string; // JSON string array
  interests: string; // JSON string array
  experienceLevel: string;
  xpTransactions: XPTransaction[];
  contributions: Contribution[];
}

const RANKS = [
  { name: 'New Contributor', minXp: 0, maxXp: 100 },
  { name: 'Issue Hunter', minXp: 101, maxXp: 500 },
  { name: 'PR Warrior', minXp: 501, maxXp: 1500 },
  { name: 'Merge Machine', minXp: 1501, maxXp: 5000 },
  { name: 'Open Source Legend', minXp: 5001, maxXp: 999999 },
];

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="glass h-48 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass h-32 rounded-2xl" />
          <div className="glass h-32 rounded-2xl" />
          <div className="glass h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Could not load profile. Please try logging in again.</p>
      </div>
    );
  }

  // Parse arrays
  const languages: string[] = JSON.parse(profile.languages || '[]');
  const interests: string[] = JSON.parse(profile.interests || '[]');

  // Calculate XP progress
  const currentRankIndex = RANKS.findIndex(r => profile.xp >= r.minXp && profile.xp <= r.maxXp);
  const currentRankInfo = RANKS[currentRankIndex] || RANKS[0];
  const nextRankInfo = RANKS[currentRankIndex + 1] || null;

  const xpRequiredForCurrent = currentRankInfo.minXp;
  const xpRequiredForNext = nextRankInfo ? nextRankInfo.minXp : currentRankInfo.maxXp;
  const range = xpRequiredForNext - xpRequiredForCurrent;
  const relativeXp = profile.xp - xpRequiredForCurrent;
  const percent = nextRankInfo ? Math.min(100, Math.round((relativeXp / range) * 100)) : 100;

  // Contributions counts
  const totalContributions = profile.contributions.length;
  const mergedCount = profile.contributions.filter(c => c.status === 'MERGED').length;
  const submittedCount = profile.contributions.filter(c => c.status === 'SUBMITTED').length;

  const actionLabels: Record<string, string> = {
    SAVE_ISSUE: 'Bookmarked an issue',
    OPEN_ISSUE: 'Unlocked swipe card flow',
    SUBMIT_PR: 'Submitted a pull request',
    MERGE_PR: 'Merged a pull request',
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-8 relative z-10">
      
      {/* Profile Card Header */}
      <div className="glass-premium rounded-3xl p-6 md:p-8 border border-white/5 glow-purple flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="h-24 w-24 rounded-full border-2 border-brand-purple/40 shadow-xl"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-dark-border flex items-center justify-center text-3xl font-bold">
            {profile.username[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-grow space-y-3">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white">{profile.name || profile.username}</h2>
              <p className="text-brand-blue font-semibold text-sm">@{profile.username}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-bold uppercase">
                {profile.experienceLevel}
              </span>
              <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold animate-pulse-slow">
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>{profile.streak}d Streak</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
            {profile.bio || 'This developer is busy writing code and hasn\'t filled out their bio yet.'}
          </p>

          <div className="flex justify-center md:justify-start gap-6 text-xs text-gray-500 pt-2">
            <span><strong>{profile.followersCount}</strong> Followers</span>
            <span><strong>{profile.publicReposCount}</strong> Public Repos</span>
          </div>
        </div>
      </div>

      {/* Gamification Status (XP & Progress Bar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* XP Status Card */}
        <div className="glass rounded-2xl p-6 border border-white/5 md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Developer Level</span>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="h-5 w-5 text-brand-purple" />
                <span>{profile.rank}</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{profile.xp}</span>
              <span className="text-xs text-gray-500 block">Total XP</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="w-full h-2.5 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-purple to-brand-green rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>{currentRankInfo.minXp} XP</span>
              <span>{percent}% towards next rank</span>
              <span>{nextRankInfo ? `${nextRankInfo.minXp} XP` : 'MAX'}</span>
            </div>
          </div>
        </div>

        {/* Contribution Counter stats */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Contribution Metrics</span>
          
          <div className="grid grid-cols-3 text-center gap-2 py-4">
            <div className="space-y-1">
              <span className="text-xl font-extrabold text-brand-blue">{totalContributions - submittedCount - mergedCount}</span>
              <span className="text-[9px] text-gray-500 uppercase block">Opened</span>
            </div>
            <div className="space-y-1 border-x border-dark-border">
              <span className="text-xl font-extrabold text-yellow-500">{submittedCount}</span>
              <span className="text-[9px] text-gray-500 uppercase block">PRs</span>
            </div>
            <div className="space-y-1">
              <span className="text-xl font-extrabold text-brand-green">{mergedCount}</span>
              <span className="text-[9px] text-gray-500 uppercase block">Merged</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 flex items-center justify-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Leaderboard verified state</span>
          </div>
        </div>
      </div>

      {/* Preferences & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Programming Languages */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Programming Languages</h3>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 rounded-xl bg-dark-bg border border-white/5 text-gray-300 text-xs font-semibold"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Development Interests */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-xl bg-dark-bg border border-white/5 text-gray-300 text-xs font-semibold"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Contributions list */}
        <div className="glass rounded-2xl p-6 border border-white/5 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white">Active Contributions</h3>

          {profile.contributions.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 italic">No contributions started yet. Swipe right on some issues!</p>
          ) : (
            <div className="space-y-3">
              {profile.contributions.slice(0, 4).map((contrib) => (
                <div
                  key={contrib.id}
                  className="p-3 rounded-xl bg-dark-bg border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="truncate space-y-1">
                    <p className="text-xs font-bold text-white truncate">
                      {contrib.issue.title}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {contrib.issue.repository.owner} / {contrib.issue.repository.name}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {contrib.status === 'OPENED' && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-[9px] font-bold">Opened</span>
                    )}
                    {contrib.status === 'SUBMITTED' && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[9px] font-bold">PR Sent</span>
                    )}
                    {contrib.status === 'MERGED' && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[9px] font-bold">Merged</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent XP Transactions Feed */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Recent Activity Log</h3>

          {profile.xpTransactions.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 italic">No XP earned yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.xpTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-gray-300 block">{actionLabels[tx.action] || tx.action}</span>
                    <span className="text-[9px] text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-extrabold text-brand-green shrink-0">+{tx.amount} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
