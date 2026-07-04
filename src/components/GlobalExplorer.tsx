'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Clock, MessageSquare, AlertCircle, Sparkles, ChevronRight, Bookmark, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Issue {
  id: string;
  githubId: string;
  title: string;
  description: string | null;
  url: string;
  number: number;
  difficulty: string;
  estimatedTime: string;
  labels: string[];
  matchScore: number;
  createdAt: string;
  repository: {
    id: string;
    name: string;
    owner: string;
    url: string;
    stars: number;
    language: string | null;
  };
}

export default function GlobalExplorer({ user }: { user: any }) {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [goodFirstIssueOnly, setGoodFirstIssueOnly] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [selectedLanguage, selectedDifficulty, goodFirstIssueOnly]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedLanguage !== 'All') q.append('language', selectedLanguage);
      if (selectedDifficulty !== 'All') q.append('difficulty', selectedDifficulty);
      if (goodFirstIssueOnly) q.append('gfi', 'true');

      const res = await fetch(`/api/issues/feed?${q.toString()}`);
      if (res.ok) {
        const data: Issue[] = await res.json();
        // Fallback createdAt if missing
        const issuesWithDates = data.map(i => ({
            ...i, 
            createdAt: (i as any).createdAt || new Date().toISOString()
        }));
        setIssues(issuesWithDates);
      }
    } catch (error) {
      console.error('Failed to fetch issues', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      issue.title.toLowerCase().includes(q) ||
      (issue.description && issue.description.toLowerCase().includes(q)) ||
      issue.repository.name.toLowerCase().includes(q) ||
      issue.repository.owner.toLowerCase().includes(q)
    );
  });

  const handleSwipeTransition = (issueId: string) => {
    // Navigate to swipe page and pass the issueId to prioritize it
    router.push(`/swipe?issueId=${issueId}`);
  };

  const getLanguageColor = (lang: string | null) => {
    if (!lang) return 'bg-gray-400';
    const colors: Record<string, string> = {
      TypeScript: 'bg-blue-500',
      JavaScript: 'bg-yellow-500',
      Python: 'bg-green-600',
      Go: 'bg-cyan-500',
      Rust: 'bg-orange-600',
      HTML: 'bg-orange-500',
      CSS: 'bg-indigo-500',
    };
    return colors[lang] || 'bg-brand-purple';
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
          Global Explorer
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Discover millions of GitHub issues across open-source repositories and instantly review them using Swipe Mode.
        </p>

        {/* Credits */}
        <div className="flex items-center justify-center space-x-3 mt-4 pt-4 border-t border-dark-border/50 max-w-md mx-auto">
          <p className="text-[11px] text-text-tertiary">
            Powered by <span className="font-bold text-brand-purple">Git-Issues</span> by Yuvraj
          </p>
          <a href="https://github.com/Yuvraj-Sarathe/Git-Issue" target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-[10px] bg-bg-pill hover:bg-dark-card border border-dark-border px-2 py-1 rounded transition-colors text-text-secondary hover:text-text-primary">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
            <span>GitHub</span>
          </a>
          <a href="https://gitissue.vercel.app/" target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-[10px] bg-bg-pill hover:bg-dark-card border border-dark-border px-2 py-1 rounded transition-colors text-text-secondary hover:text-text-primary">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span>Live App</span>
          </a>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-3xl mx-auto mb-8 relative"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-purple/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center bg-dark-card border border-dark-border rounded-full shadow-lg group-focus-within:border-brand-purple transition-all duration-300 overflow-hidden glass-premium">
            <Search className="h-5 w-5 text-text-tertiary ml-5" />
            <input 
              type="text" 
              placeholder="Search repositories, technologies or issues..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-transparent border-none focus:outline-none text-text-primary text-sm py-4 px-4 placeholder-text-tertiary"
            />
          </div>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-12"
      >
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-2 rounded-full bg-bg-pill text-text-secondary text-xs font-bold border border-dark-border focus:border-brand-purple outline-none appearance-none cursor-pointer hover:bg-dark-card transition-colors"
        >
          <option value="All">Language: All</option>
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-4 py-2 rounded-full bg-bg-pill text-text-secondary text-xs font-bold border border-dark-border focus:border-brand-purple outline-none appearance-none cursor-pointer hover:bg-dark-card transition-colors"
        >
          <option value="All">Difficulty: All</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <button 
          onClick={() => setGoodFirstIssueOnly(!goodFirstIssueOnly)}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
            goodFirstIssueOnly 
              ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' 
              : 'bg-bg-pill border-dark-border text-text-secondary hover:bg-dark-card'
          }`}
        >
          Good First Issue
        </button>

        <button className="px-4 py-2 rounded-full bg-bg-pill text-text-secondary text-xs font-bold border border-dark-border hover:bg-dark-card transition-colors">
          Help Wanted
        </button>

        <button className="px-4 py-2 rounded-full bg-bg-pill text-text-secondary text-xs font-bold border border-dark-border hover:bg-dark-card transition-colors">
          Recently Updated
        </button>
      </motion.div>

      {/* Issue Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-dark-card rounded-2xl border border-dark-border animate-pulse" />
          ))}
        </div>
      ) : filteredIssues.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredIssues.map((issue) => (
              <motion.div
                key={issue.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden shadow-sm hover:shadow-brand-purple/20 transition-all duration-300 flex flex-col group relative"
              >
                {/* Purple subtle glow on hover */}
                <div className="absolute inset-0 bg-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="p-5 flex-grow flex flex-col">
                  {/* Repo info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-6 w-6 rounded bg-black border border-dark-border flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm">
                      {issue.repository.owner[0]?.toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-text-secondary truncate">
                      {issue.repository.owner}/<span className="text-text-primary">{issue.repository.name}</span>
                    </p>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-brand-purple transition-colors">
                    {issue.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-text-secondary line-clamp-2 mb-4 flex-grow">
                    {issue.description || 'No description provided.'}
                  </p>

                  {/* Labels */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {issue.labels.slice(0, 3).map(lbl => {
                      const isGfi = lbl.toLowerCase().includes('good first issue');
                      return (
                        <span 
                          key={lbl} 
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            isGfi 
                              ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' 
                              : 'bg-bg-pill text-text-tertiary border-dark-border/40'
                          }`}
                        >
                          {lbl}
                        </span>
                      )
                    })}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-[10px] text-text-tertiary border-t border-dark-border/60 pt-3 mt-auto">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className={`h-2 w-2 rounded-full ${getLanguageColor(issue.repository.language)}`} />
                        <span>{issue.repository.language || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{(issue.repository.stars / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-bg-pill/50 p-3 border-t border-dark-border flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 rounded-lg hover:bg-dark-card text-text-tertiary hover:text-brand-purple transition-colors" title="Save Issue">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <a href={issue.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-dark-card text-text-tertiary hover:text-text-primary transition-colors" title="View on GitHub">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                    </a>
                  </div>
                  <button 
                    onClick={() => handleSwipeTransition(issue.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold transition-transform active:scale-95 shadow-md shadow-brand-purple/20"
                  >
                    <span>Swipe Issue</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-lg mx-auto text-center space-y-6 py-16 px-4 bg-dark-card border border-dark-border rounded-3xl"
        >
          <div className="p-5 rounded-full bg-bg-pill border border-dark-border w-fit mx-auto">
            <Search className="h-10 w-10 text-text-tertiary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-primary">No matching issues found.</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Try adjusting your filters or search query to find more issues.
            </p>
          </div>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('All');
              setSelectedDifficulty('All');
              setGoodFirstIssueOnly(false);
            }}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-bg-pill hover:bg-dark-card text-text-primary border border-dark-border text-xs font-bold transition-all mx-auto shadow-sm"
          >
            <span>Reset Filters</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
