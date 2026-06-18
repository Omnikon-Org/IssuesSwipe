'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Flame, Star, GitPullRequest, Bookmark, Sparkles, RefreshCw, X, Check, Award, Clock } from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
}

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
  repository: Repository;
}

interface UserProgress {
  xp: number;
  rank: string;
  streak: number;
}

export default function SwipeFeed() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // XP floating toasts
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [toastId, setToastId] = useState(0);

  // Framer Motion controls
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const cardControls = useAnimation();

  // Dynamic transforms for rotation and opacity overlays based on drag offset
  const rotate = useTransform(motionX, [-200, 200], [-10, 10]);
  const opacityNope = useTransform(motionX, [-150, 0], [1, 0]);
  const opacityContribute = useTransform(motionX, [0, 150], [0, 1]);

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    setLoading(true);
    try {
      const res = await fetch('/api/issues/feed');
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }

  // Award notification toast helper
  const triggerXpToast = (xpGained: number) => {
    const id = toastId;
    setToastId((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, text: `+${xpGained} XP!` }]);
    
    // Auto-remove toast after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  };

  const handleSwipeAction = async (direction: 'SKIP' | 'CONTRIBUTE' | 'SAVE') => {
    if (currentIndex >= issues.length) return;

    const currentIssue = issues[currentIndex];
    
    // If Save, we trigger toast but don't automatically pop card from feed unless user wants it
    // Wait, Tinder lets you bookmark/save which does not skip. Let's make "SAVE" trigger
    // saving without moving the card if possible, or transition to the next card.
    // Moving to the next card feels clean and fast.
    const shouldMoveToNext = direction !== 'SAVE';

    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId: currentIssue.id,
          direction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (direction === 'CONTRIBUTE') {
          triggerXpToast(25);
        } else if (direction === 'SAVE') {
          triggerXpToast(10);
        }
      }
    } catch (err) {
      console.error('Swipe action sync failed:', err);
    }

    if (shouldMoveToNext) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // If it was a save action, bookmark it, trigger toast, and still slide to next to maintain swipe pacing
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex >= issues.length || loading) return;
      if (e.key === 'ArrowLeft') {
        swipeLeft();
      } else if (e.key === 'ArrowRight') {
        swipeRight();
      } else if (e.key === 's' || e.key === 'S') {
        saveBookmark();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, issues, loading]);

  const swipeLeft = async () => {
    await cardControls.start({ x: -400, opacity: 0, rotate: -15, transition: { duration: 0.3 } });
    handleSwipeAction('SKIP');
    motionX.set(0);
  };

  const swipeRight = async () => {
    await cardControls.start({ x: 400, opacity: 0, rotate: 15, transition: { duration: 0.3 } });
    handleSwipeAction('CONTRIBUTE');
    motionX.set(0);
  };

  const saveBookmark = async () => {
    await cardControls.start({ y: -300, opacity: 0, transition: { duration: 0.3 } });
    handleSwipeAction('SAVE');
    motionY.set(0);
  };

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 150;
    if (info.offset.x > threshold) {
      swipeRight();
    } else if (info.offset.x < -threshold) {
      swipeLeft();
    } else if (info.offset.y < -threshold) {
      saveBookmark();
    } else {
      // Snap back
      cardControls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleSyncIssues = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        await fetchFeed();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="glass-premium rounded-3xl p-6 border border-white/5 space-y-6 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-dark-border rounded" />
              <div className="h-8 w-64 bg-dark-border rounded" />
            </div>
            <div className="h-6 w-16 bg-dark-border rounded-full" />
          </div>
          <div className="h-24 bg-dark-border rounded" />
          <div className="flex space-x-2">
            <div className="h-6 w-16 bg-dark-border rounded-full" />
            <div className="h-6 w-20 bg-dark-border rounded-full" />
          </div>
          <div className="pt-6 border-t border-dark-border flex justify-between">
            <div className="h-12 w-12 rounded-full bg-dark-border" />
            <div className="h-10 w-24 bg-dark-border rounded-full" />
            <div className="h-12 w-12 rounded-full bg-dark-border" />
          </div>
        </div>
      </div>
    );
  }

  const activeIssue = issues[currentIndex];

  // 2. Empty State (No more issues)
  if (!activeIssue) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center space-y-8 relative z-10">
        <div className="p-6 rounded-full bg-brand-purple/10 border border-brand-purple/20 w-fit mx-auto glow-purple">
          <GitPullRequest className="h-12 w-12 text-brand-purple" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-white">You've cleared the queue!</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Swipe feed is empty. Hit Sync to query GitHub GraphQL API for fresh good-first-issues and help-wanted reports.
          </p>
        </div>
        <button
          onClick={handleSyncIssues}
          disabled={syncing}
          className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all mx-auto shadow-md disabled:opacity-55 cursor-pointer"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Fetching from GitHub...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Sync New Issues</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Difficulty badge colors
  const diffColors: Record<string, string> = {
    Beginner: 'text-brand-green bg-brand-green/10 border-brand-green/20',
    Intermediate: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
    Advanced: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
  };

  // Match score color gradient borders
  const scoreColors =
    activeIssue.matchScore >= 90
      ? 'border-brand-green/30 shadow-brand-green/5'
      : activeIssue.matchScore >= 75
      ? 'border-brand-blue/30 shadow-brand-blue/5'
      : 'border-brand-purple/30 shadow-brand-purple/5';

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 relative flex flex-col items-center">
      {/* Floating XP Toasts */}
      <div className="absolute top-[-20px] z-50 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: -40, scale: 1.2 }}
              exit={{ opacity: 0, y: -60 }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-brand-green text-white text-xs font-black shadow-lg"
            >
              <Award className="h-3.5 w-3.5" />
              <span>{toast.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Tinder Card */}
      <div className="relative w-full h-[480px] select-none">
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x: motionX, y: motionY, rotate }}
          animate={cardControls}
          className={`absolute inset-0 glass-premium rounded-3xl p-6 border ${scoreColors} flex flex-col justify-between cursor-grab active:cursor-grabbing shadow-2xl relative overflow-hidden`}
        >
          {/* Overlay Stamps on Drag */}
          <motion.div
            style={{ opacity: opacityContribute }}
            className="absolute top-6 left-6 border-4 border-brand-green text-brand-green font-black uppercase text-2xl px-4 py-1.5 rounded-xl rotate-[-12deg] z-40 pointer-events-none"
          >
            Contribute
          </motion.div>

          <motion.div
            style={{ opacity: opacityNope }}
            className="absolute top-6 right-6 border-4 border-brand-red text-brand-red font-black uppercase text-2xl px-4 py-1.5 rounded-xl rotate-[12deg] z-40 pointer-events-none"
          >
            Nope
          </motion.div>

          {/* Card Body Container */}
          <div className="space-y-4 flex-grow flex flex-col justify-between">
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start">
                <a
                  href={activeIssue.repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-blue hover:underline uppercase tracking-wider block truncate max-w-[240px]"
                >
                  {activeIssue.repository.owner} / {activeIssue.repository.name}
                </a>
                
                {/* Score Indicator */}
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
                  activeIssue.matchScore >= 90
                    ? 'text-brand-green bg-brand-green/10'
                    : 'text-brand-blue bg-brand-blue/10'
                }`}>
                  <Sparkles className="h-3 w-3 fill-current" />
                  <span>{activeIssue.matchScore}% Match</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mt-1 leading-snug tracking-tight">
                {activeIssue.title}
              </h3>
            </div>

            {/* Description */}
            <div className="flex-grow flex items-center my-2">
              <p className="text-sm text-gray-400 line-clamp-6 leading-relaxed overflow-y-auto max-h-[160px] pr-1">
                {activeIssue.description || 'No description provided for this issue. Open GitHub page directly to inspect code.'}
              </p>
            </div>

            {/* Badges metadata */}
            <div className="space-y-3.5">
              {/* Labels list */}
              <div className="flex flex-wrap gap-1.5">
                {activeIssue.labels.slice(0, 3).map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded bg-dark-border text-gray-300 text-[10px] border border-white/5 font-semibold"
                  >
                    {lbl}
                  </span>
                ))}
              </div>

              {/* Main metrics */}
              <div className="flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${diffColors[activeIssue.difficulty] || 'text-gray-400 bg-dark-border border-white/5'}`}>
                    {activeIssue.difficulty}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{activeIssue.estimatedTime}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span>{(activeIssue.repository.stars / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Button Controls */}
      <div className="flex items-center justify-center space-x-6 mt-8 relative z-20">
        {/* Skip button */}
        <button
          onClick={swipeLeft}
          className="w-14 h-14 rounded-full bg-dark-card border border-brand-red/20 flex items-center justify-center text-brand-red hover:bg-brand-red/10 active:scale-95 transition-all shadow-lg glow-red cursor-pointer"
          title="Skip (Left Arrow)"
        >
          <X className="h-6 w-6 stroke-[3px]" />
        </button>

        {/* Save/Bookmark button */}
        <button
          onClick={saveBookmark}
          className="px-6 h-11 rounded-full bg-dark-card border border-brand-blue/20 flex items-center space-x-1.5 text-brand-blue hover:bg-brand-blue/10 active:scale-95 transition-all shadow-lg glow-blue cursor-pointer"
          title="Save/Bookmark (S key)"
        >
          <Bookmark className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Save</span>
        </button>

        {/* Contribute button */}
        <button
          onClick={swipeRight}
          className="w-14 h-14 rounded-full bg-dark-card border border-brand-green/20 flex items-center justify-center text-brand-green hover:bg-brand-green/10 active:scale-95 transition-all shadow-lg glow-green cursor-pointer"
          title="Contribute (Right Arrow)"
        >
          <Check className="h-6 w-6 stroke-[3px]" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <p className="text-[10px] text-gray-500 text-center mt-6">
        Tip: Use Arrow keys (← Skip, → Contribute) and 'S' to Save.
      </p>
    </div>
  );
}
