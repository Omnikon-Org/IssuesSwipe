'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ExternalLink, Trash2, GitPullRequest, GitMerge, CheckCircle, ShieldAlert, Sparkles, Award } from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  stars: number;
  language: string | null;
}

interface Match {
  savedId: string;
  savedAt: string;
  issue: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    number: number;
    difficulty: string;
    estimatedTime: string;
    labels: string[];
    repository: Repository;
    contributionStatus: 'NONE' | 'OPENED' | 'SUBMITTED' | 'MERGED';
    prUrl: string | null;
  };
}

export default function SavedMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Floating XP toasts
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [toastId, setToastId] = useState(0);

  useEffect(() => {
    fetchMatches();
  }, [search, selectedLanguage]);

  async function fetchMatches() {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (selectedLanguage) q.append('language', selectedLanguage);
      
      const res = await fetch(`/api/matches?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }

  const triggerXpToast = (xpGained: number) => {
    const id = toastId;
    setToastId((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, text: `+${xpGained} XP!` }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  };

  const handleRemoveMatch = async (issueId: string) => {
    try {
      const res = await fetch('/api/matches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId }),
      });

      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.issue.id !== issueId));
      }
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  const handleUpdateContribution = async (issueId: string, status: 'SUBMITTED' | 'MERGED') => {
    try {
      const mockPrUrl = `https://github.com/simulated-pr-${Math.floor(Math.random() * 10000)}`;
      const res = await fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, status, prUrl: mockPrUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local status
        setMatches((prev) =>
          prev.map((m) =>
            m.issue.id === issueId
              ? { ...m, issue: { ...m.issue, contributionStatus: status, prUrl: mockPrUrl } }
              : m
          )
        );

        // Trigger floaters
        if (status === 'SUBMITTED') {
          triggerXpToast(100);
        } else if (status === 'MERGED') {
          triggerXpToast(250);
        }
        
        // Refresh page metrics (re-sync header profile stats)
        window.dispatchEvent(new Event('pathnameChange'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile list of languages present in user's saved matches for filter badges
  const languagesList = Array.from(
    new Set(
      matches
        .map((m) => m.issue.repository.language)
        .filter((lang): lang is string => !!lang)
    )
  );

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 relative">
      {/* Floating XP Toasts */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1.2 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex items-center space-x-1 px-4 py-2 rounded-full bg-brand-green text-white text-sm font-black shadow-lg glow-green"
            >
              <Award className="h-4 w-4" />
              <span>{toast.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Saved Matches</h2>
          <p className="text-sm text-gray-400 mt-1">Review saved issues and track contribution workflow.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search saved issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-card border border-white/5 text-sm focus:border-brand-blue outline-none transition-colors"
          />
        </div>
      </div>

      {/* Language Filters */}
      {languagesList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-gray-500 mr-2">Language:</span>
          <button
            onClick={() => setSelectedLanguage('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              selectedLanguage === ''
                ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
                : 'bg-dark-card border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {languagesList.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedLanguage === lang
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
                  : 'bg-dark-card border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* Matches Grid/List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl h-32 animate-pulse bg-dark-card/50" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5 space-y-4">
          <div className="p-4 rounded-full bg-dark-border w-fit mx-auto">
            <ShieldAlert className="h-8 w-8 text-gray-500" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white">No saved matches found</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Go back to the swipe feed to find and save issues, or clear your active filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {matches.map((match) => (
              <motion.div
                key={match.savedId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-premium rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Details Section */}
                <div className="space-y-3 flex-grow max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold text-brand-blue uppercase tracking-wider">
                      {match.issue.repository.owner} / {match.issue.repository.name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-600" />
                    <span className="text-[10px] text-gray-500">
                      Saved {new Date(match.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-brand-blue transition-colors leading-snug">
                    <a href={match.issue.url} target="_blank" rel="noreferrer" className="flex items-center space-x-1">
                      <span>#{match.issue.number} {match.issue.title}</span>
                      <ExternalLink className="h-3 w-3 inline text-gray-500 shrink-0" />
                    </a>
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {match.issue.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-2">
                    {match.issue.repository.language && (
                      <span className="px-2 py-0.5 rounded bg-dark-border text-gray-400 text-[10px] font-medium border border-white/5">
                        {match.issue.repository.language}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-bold border border-brand-blue/20">
                      {match.issue.difficulty}
                    </span>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-500 pl-2">
                      <Star className="h-3 w-3 fill-yellow-500/20 text-yellow-500/80" />
                      <span>{(match.issue.repository.stars / 1000).toFixed(1)}k stars</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Controller Section */}
                <div className="flex flex-col justify-between items-end gap-4 shrink-0 md:border-l md:border-dark-border md:pl-6">
                  {/* Status Indicator */}
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Contribution Status</span>
                    {match.issue.contributionStatus === 'OPENED' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-bold mt-1">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        <span>Opened</span>
                      </span>
                    )}
                    {match.issue.contributionStatus === 'SUBMITTED' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold mt-1">
                        <GitPullRequest className="h-3 w-3" />
                        <span>PR Submitted</span>
                      </span>
                    )}
                    {match.issue.contributionStatus === 'MERGED' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold mt-1">
                        <GitMerge className="h-3 w-3" />
                        <span>PR Merged</span>
                      </span>
                    )}
                    {match.issue.contributionStatus === 'NONE' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-dark-border text-gray-400 text-[10px] font-bold mt-1">
                        <span>Bookmarked</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    {/* Trash Button */}
                    <button
                      onClick={() => handleRemoveMatch(match.issue.id)}
                      className="p-2 rounded-lg border border-white/5 text-gray-500 hover:text-brand-red hover:bg-brand-red/10 hover:border-brand-red/20 transition-all cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Submit PR Button */}
                    {match.issue.contributionStatus === 'OPENED' && (
                      <button
                        onClick={() => handleUpdateContribution(match.issue.id, 'SUBMITTED')}
                        className="flex items-center space-x-1 px-3.5 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <GitPullRequest className="h-3.5 w-3.5" />
                        <span>Submit PR (+100 XP)</span>
                      </button>
                    )}

                    {/* Mark Merged Button */}
                    {match.issue.contributionStatus === 'SUBMITTED' && (
                      <button
                        onClick={() => handleUpdateContribution(match.issue.id, 'MERGED')}
                        className="flex items-center space-x-1 px-3.5 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Merge PR (+250 XP)</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
