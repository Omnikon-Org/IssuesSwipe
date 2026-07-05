'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, MessageSquare, AlertCircle,
  Sparkles, ChevronRight, Bookmark, RefreshCw, Settings,
  ChevronDown, ChevronLeft, Check, X, Tag, Code, TrendingUp,
  User, CircleDot, Sprout, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { calculateMatchScore } from '@/lib/matching';

// ─── Types ───────────────────────────────────────────────────────────────

interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

interface IssueLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface UserAvatar {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  comments: number;
  labels: IssueLabel[];
  user: UserAvatar;
  assignees: UserAvatar[];
  pull_request?: any;
  repository_url: string;
}

interface PaginationUrls {
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────

const LABELS = [
  { name: "good first issue", color: "7057ff", description: "Good for newcomers" },
  { name: "help wanted", color: "008672", description: "Extra attention" },
  { name: "priority: critical", color: "b60205", description: "" },
  { name: "priority: high", color: "d93f0b", description: "" },
  { name: "priority: low", color: "0e8a16", description: "" },
  { name: "priority: medium", color: "fbca04", description: "" },
  { name: "status: can't reproduce", color: "fec1c1", description: "" },
  { name: "status: confirmed", color: "215cea", description: "" },
  { name: "status: duplicate", color: "cfd3d7", description: "" },
  { name: "status: needs information", color: "fef2c0", description: "" },
  { name: "status: wont do/fix", color: "eeeeee", description: "" },
  { name: "type: bug", color: "d73a4a", description: "Something isn't working" },
  { name: "type: discussion", color: "d4c5f9", description: "" },
  { name: "type: documentation", color: "006b75", description: "" },
  { name: "type: enhancement", color: "84b6eb", description: "" },
  { name: "type: epic", color: "3E4B9E", description: "" },
  { name: "type: feature request", color: "fbca04", description: "" },
  { name: "type: question", color: "d876e3", description: "" },
  { name: "frontend", color: "bfdbfe", description: "" },
  { name: "backend", color: "bbf7d0", description: "" },
  { name: "database", color: "fde047", description: "" },
  { name: "management", color: "cbd5e1", description: "" },
];

const TRENDING = [
  { name: 'gssoc', color: 'ff6b6b' },
  { name: 'hacktoberfest', color: 'ffa94d' },
  { name: 'jwoc', color: '69db7c' },
  { name: 'kwoc', color: '4dabf7' },
  { name: 'iwoc', color: 'da77f2' },
  { name: 'dwoc', color: 'f783ac' },
];

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Python', 'Java', 'Go', 'Rust', 'C++', 'Ruby', 'PHP', 'Swift',
];

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Newest' },
  { value: 'created-asc', label: 'Oldest' },
  { value: 'comments-desc', label: 'Most commented' },
  { value: 'updated-desc', label: 'Recently updated' },
  { value: 'best-match', label: 'Best match' },
];

const API_BASE = 'https://api.github.com';

// ─── Helpers ─────────────────────────────────────────────────────────────

const getTextColorForBg = (hexColor: string) => {
  const r = parseInt(hexColor.substring(0, 2), 16) || 0;
  const g = parseInt(hexColor.substring(2, 4), 16) || 0;
  const b = parseInt(hexColor.substring(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

const parseLinkHeader = (header: string | null): PaginationUrls => {
  if (!header) return {};
  const links = header.split(',');
  const result: any = {};
  links.forEach((link) => {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) result[match[2]] = match[1];
  });
  return result;
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(dateString));
};

const extractRepoFromUrl = (repoUrl: string | null | undefined) => {
  if (!repoUrl) return 'unknown/repo';
  return repoUrl.replace('https://api.github.com/repos/', '');
};

const computeDifficulty = (labels: IssueLabel[]): string => {
  const names = labels.map((l) => l.name.toLowerCase());
  if (names.some((n) => n.includes('good first issue') || n === 'beginner')) return 'beginner';
  if (names.some((n) => n.includes('advanced'))) return 'advanced';
  return 'intermediate';
};

// ─── Component ──────────────────────────────────────────────────────────

export default function GlobalExplorer({ user }: { user: any }) {
  const router = useRouter();

  // Search & data
  const [searchInput, setSearchInput] = useState('');
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationUrls>({});

  // Rate limit & PAT
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [pat, setPat] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [patInput, setPatInput] = useState('');

  // Sort
  const [sortOpen, setSortOpen] = useState(false);
  const [sortParam, setSortParam] = useState('created-desc');
  const sortRef = useRef<HTMLDivElement>(null);

  // Filters
  const [unassignedFilter, setUnassignedFilter] = useState(false);
  const [noCommentsFilter, setNoCommentsFilter] = useState(false);
  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [excludedLabels, setExcludedLabels] = useState<string[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);
  const [customLabelInput, setCustomLabelInput] = useState('');
  const [customLabelExcludeMode, setCustomLabelExcludeMode] = useState(false);

  // Load PAT on mount
  useEffect(() => {
    try {
      const savedPat = localStorage.getItem('githubPat');
      if (savedPat) {
        setPat(savedPat);
        setPatInput(savedPat);
      }
    } catch {
      // localStorage unavailable (SSR, restricted mode, etc.) — skip PAT restore
    }
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── GitHub API helpers ─────────────────────────────────────────────

  const getHeaders = useCallback(() => {
    const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
    if (pat) headers['Authorization'] = `token ${pat}`;
    return headers;
  }, [pat]);

  const updateRateLimit = (res: Response) => {
    const limit = res.headers.get('x-ratelimit-limit');
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    if (limit && remaining && reset) {
      setRateLimit({
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      });
    }
  };

  const handleApiError = async (res: Response) => {
    let message = `API Error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.message) message = data.message;
    } catch (_) {}
    if (res.status === 403 || res.status === 429) {
      message = 'API Rate limit exceeded (10/min unauthenticated, 30/min with token).';
    }
    setError(message);
    throw new Error(message);
  };

  // ─── Build query & fetch ────────────────────────────────────────────

  const buildSearchQuery = useCallback(() => {
    const parts = ['type:issue', 'state:open'];
    if (searchInput) parts.push(searchInput);
    if (unassignedFilter) parts.push('no:assignee');
    if (noCommentsFilter) parts.push('comments:0');
    activeLabels.forEach((label) => parts.push(`label:"${label}"`));
    excludedLabels.forEach((label) => parts.push(`-label:"${label}"`));
    activeLanguages.forEach((lang) => parts.push(`language:${lang}`));
    return parts.join(' ');
  }, [searchInput, unassignedFilter, noCommentsFilter, activeLabels, excludedLabels, activeLanguages]);

  const fetchIssuesList = useCallback(
    async (pageUrl?: string) => {
      const isFirstPage = !pageUrl;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        let fetchUrl = pageUrl;
        if (!fetchUrl) {
          const [sort, direction] = sortParam.split('-');
          const query = buildSearchQuery();
          const queryParams = new URLSearchParams({ q: query, per_page: '30' });
          if (sort !== 'best-match') {
            queryParams.append('sort', sort);
            queryParams.append('order', direction);
          }
          fetchUrl = `${API_BASE}/search/issues?${queryParams.toString()}`;
        }

        const res = await fetch(fetchUrl, { headers: getHeaders() });
        updateRateLimit(res);
        if (!res.ok) await handleApiError(res);

        const data = await res.json();
        setPagination(parseLinkHeader(res.headers.get('link')));
        setTotalCount(data?.total_count ?? 0);
        const items = data?.items ?? [];
        const onlyIssues = items.filter(
          (item: GitHubIssue) => !item.pull_request,
        );

        if (isFirstPage) setIssues(onlyIssues);
        else setIssues((prev) => [...prev, ...onlyIssues]);
      } catch (err: any) {
        console.error(err);
      } finally {
        if (isFirstPage) setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortParam, getHeaders, buildSearchQuery],
  );

  // Keep a ref to the latest fetchIssuesList to avoid stale closures in debounce
  const fetchRef = useRef(fetchIssuesList);
  fetchRef.current = fetchIssuesList;

  // ─── Fetch orchestration effects ────────────────────────────────────

  // Initial fetch on mount
  useEffect(() => {
    fetchIssuesList();
    // Run only once on mount — intentionally omitting deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search (500ms): only searchInput triggers debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchRef.current(), 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Immediate: filter / sort changes fire without debounce
  useEffect(() => {
    fetchIssuesList();
  }, [sortParam, activeLabels, excludedLabels, activeLanguages, unassignedFilter, noCommentsFilter]);

  // ─── Filter handlers ────────────────────────────────────────────────

  const toggleLabel = (labelName: string) => {
    setExcludedLabels((prev) => prev.filter((l) => l !== labelName));
    setActiveLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName],
    );
  };

  const toggleExcludeLabel = (labelName: string) => {
    setActiveLabels((prev) => prev.filter((l) => l !== labelName));
    setExcludedLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName],
    );
  };

  const toggleLanguage = (langName: string) => {
    setActiveLanguages((prev) =>
      prev.includes(langName)
        ? prev.filter((l) => l !== langName)
        : [...prev, langName],
    );
  };

  const handleCustomLabelAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customLabelInput.trim()) {
      const tags = customLabelInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (customLabelExcludeMode) {
        setExcludedLabels((prev) => {
          const next = [...prev];
          tags.forEach((t) => { if (!next.includes(t)) next.push(t); });
          return next;
        });
      } else {
        setActiveLabels((prev) => {
          const next = [...prev];
          tags.forEach((t) => { if (!next.includes(t)) next.push(t); });
          return next;
        });
      }
      setCustomLabelInput('');
    }
  };

  const clearAllFilters = () => {
    setActiveLabels([]);
    setExcludedLabels([]);
    setActiveLanguages([]);
    setUnassignedFilter(false);
    setNoCommentsFilter(false);
  };

  const hasActiveFilters =
    unassignedFilter || noCommentsFilter ||
    activeLabels.length > 0 || excludedLabels.length > 0 ||
    activeLanguages.length > 0;

  // ─── Save PAT ───────────────────────────────────────────────────────

  const savePat = () => {
    try {
      localStorage.setItem('githubPat', patInput);
    } catch {
      // localStorage unavailable — PAT only persists for this session
    }
    setPat(patInput);
    setShowSettings(false);
  };

  // ─── Compute match score for an issue ────────────────────────────────

  const getMatchScore = useCallback(
    (item: GitHubIssue) => {
      const difficulty = computeDifficulty(item.labels);
      return calculateMatchScore(
        {
          preferredLanguages: user?.preferredLanguages || '[]',
          preferredTopics: user?.preferredTopics || '[]',
          experienceLevel: user?.experienceLevel || 'intermediate',
        } as any,
        {
          title: item.title,
          description: item.body,
          difficulty,
          labels: JSON.stringify(item.labels?.map((l: any) => l.name) || []),
          repository: {
            language: 'unknown',
            languages: JSON.stringify(activeLanguages.length > 0 ? activeLanguages : []),
            stars: 0,
          },
        } as any,
      );
    },
    [user, activeLanguages],
  );

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
      {/* ─── Hero Section ────────────────────────────────────────────────── */}
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

        {/* Rate Limit + PAT row */}
        <div className="flex items-center justify-center gap-3 mt-2">
          {rateLimit && (
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                rateLimit.remaining > rateLimit.limit * 0.2
                  ? 'text-brand-green border-brand-green/30 bg-brand-green/10'
                  : rateLimit.remaining > rateLimit.limit * 0.05
                    ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                    : 'text-brand-red border-brand-red/30 bg-brand-red/10'
              }`}
            >
              {rateLimit.remaining}/{rateLimit.limit} remaining
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-primary transition-colors px-2 py-1 rounded-lg bg-bg-pill border border-dark-border"
          >
            <Settings className="h-3 w-3" />
            PAT
          </button>
        </div>

        {/* PAT Settings inline */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-md mx-auto bg-dark-card border border-dark-border rounded-2xl p-4 flex items-center gap-3">
                <input
                  type="password"
                  placeholder="Enter GitHub Personal Access Token"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 bg-bg-pill border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-purple"
                />
                <button
                  onClick={savePat}
                  className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* ─── Search Bar ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-3xl mx-auto mb-8 relative"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-purple/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-dark-card border border-dark-border rounded-full shadow-lg group-focus-within:border-brand-purple transition-all duration-300 overflow-hidden glass-premium">
            <Search className="h-5 w-5 text-text-tertiary ml-5" />
            <input
              type="text"
              placeholder="Search repositories, technologies or issues..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-grow bg-transparent border-none focus:outline-none text-text-primary text-sm py-4 px-4 placeholder-text-tertiary"
            />
          </div>
        </div>
      </motion.div>

      {/* ─── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-brand-red/10 border border-brand-red/20 rounded-2xl p-4 flex items-start gap-3 max-w-6xl mx-auto"
        >
          <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-red">{error}</p>
        </motion.div>
      )}

      {/* ─── Main Content: Sidebar + Results ──────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* ─── Sidebar Filters ──────────────────────────────────────────── */}
        <aside className="w-full xl:w-72 flex-shrink-0 space-y-6">

          {/* Issue Status */}
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Issue Status
            </h3>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={unassignedFilter}
                  onChange={(e) => setUnassignedFilter(e.target.checked)}
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                    unassignedFilter
                      ? 'bg-brand-purple/20 border-brand-purple/50'
                      : 'bg-bg-pill border-dark-border group-hover:border-text-tertiary'
                  }`}
                >
                  {unassignedFilter && <Check className="w-3 h-3 text-brand-purple" />}
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-text-primary">Unassigned Only</span>
                <p className="text-[11px] text-text-tertiary mt-0.5">Issues seeking an owner</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group mt-4">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={noCommentsFilter}
                  onChange={(e) => setNoCommentsFilter(e.target.checked)}
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                    noCommentsFilter
                      ? 'bg-brand-purple/20 border-brand-purple/50'
                      : 'bg-bg-pill border-dark-border group-hover:border-text-tertiary'
                  }`}
                >
                  {noCommentsFilter && <Check className="w-3 h-3 text-brand-purple" />}
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-text-primary">No Comments</span>
                <p className="text-[11px] text-text-tertiary mt-0.5">Fresh untouched issues only</p>
              </div>
            </label>
          </div>

          {/* Filter by Labels */}
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Filter by Labels
            </h3>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {LABELS.map((lbl) => {
                const isActive = activeLabels.includes(lbl.name);
                const isExcluded = excludedLabels.includes(lbl.name);
                const bgColor = `#${lbl.color}`;
                return (
                  <button
                    key={lbl.name}
                    onClick={() => {
                      if (isActive) toggleExcludeLabel(lbl.name);
                      else if (isExcluded) toggleExcludeLabel(lbl.name);
                      else toggleLabel(lbl.name);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!isExcluded) toggleExcludeLabel(lbl.name);
                    }}
                    title={lbl.description || lbl.name}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full font-medium transition-all border flex items-center gap-1 ${
                      isActive
                        ? 'ring-2 ring-brand-purple/40 scale-105'
                        : isExcluded
                          ? 'ring-2 ring-brand-red/50 scale-105 opacity-70 line-through'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: bgColor,
                      color: getTextColorForBg(lbl.color),
                      borderColor: isExcluded ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {(lbl.name.toLowerCase().includes('first issue') || lbl.name.toLowerCase().includes('help wanted')) && (
                      <Sprout className="w-2.5 h-2.5" />
                    )}
                    {isExcluded ? <X className="w-2.5 h-2.5" /> : null}
                    {lbl.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-text-tertiary mt-1">
              Click to include. Right-click or click again to exclude.
            </p>

            {/* Custom Label Input */}
            <div className="pt-4 border-t border-dark-border/60 mt-4">
              <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
                Custom Label Search
              </label>
              <div className="flex gap-1.5 mb-1.5">
                <button
                  onClick={() => setCustomLabelExcludeMode(false)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border flex items-center gap-1 ${
                    !customLabelExcludeMode
                      ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                      : 'bg-bg-pill text-text-tertiary border-dark-border/60 hover:border-text-tertiary'
                  }`}
                >
                  Include
                </button>
                <button
                  onClick={() => setCustomLabelExcludeMode(true)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border flex items-center gap-1 ${
                    customLabelExcludeMode
                      ? 'bg-brand-red/10 text-brand-red border-brand-red/30'
                      : 'bg-bg-pill text-text-tertiary border-dark-border/60 hover:border-text-tertiary'
                  }`}
                >
                  <X className="w-2.5 h-2.5" /> Exclude
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. hacktoberfest..."
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                onKeyDown={handleCustomLabelAdd}
                className="w-full text-sm px-3.5 py-2 bg-bg-pill border border-dark-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-purple/40 focus:ring-1 focus:ring-brand-purple/20 transition-all"
              />
              <p className="text-[10px] text-text-tertiary mt-1">
                Press Enter to {customLabelExcludeMode ? 'exclude' : 'add'}.
              </p>
            </div>
          </div>

          {/* Trending */}
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand-green" /> Trending
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING.map((t) => {
                const isActive = activeLabels.includes(t.name);
                const isExcluded = excludedLabels.includes(t.name);
                const bgColor = `#${t.color}`;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      if (isActive) toggleExcludeLabel(t.name);
                      else if (isExcluded) toggleExcludeLabel(t.name);
                      else toggleLabel(t.name);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!isExcluded) toggleExcludeLabel(t.name);
                    }}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full font-medium transition-all border flex items-center gap-1 ${
                      isActive
                        ? 'ring-2 ring-brand-purple/40 scale-105'
                        : isExcluded
                          ? 'ring-2 ring-brand-red/50 scale-105 opacity-70 line-through'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: bgColor,
                      color: '#000',
                      borderColor: isExcluded ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {isExcluded ? <X className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-dark-card border border-dark-border p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Code className="w-3.5 h-3.5" /> Languages
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => {
                const isActive = activeLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                      isActive
                        ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                        : 'bg-bg-pill text-text-tertiary border-dark-border/60 hover:border-text-tertiary hover:text-text-primary'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ─── Results Column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Header row: title + sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
              Discovered Issues
              {!loading && totalCount > 0 && (
                <span className="text-xs py-0.5 px-2.5 rounded-full font-bold bg-bg-pill border border-dark-border text-text-tertiary">
                  {totalCount.toLocaleString()}
                </span>
              )}
            </h2>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-bg-pill border border-dark-border rounded-full px-3.5 py-1.5">
              <span className="text-xs text-text-tertiary font-semibold">Sort:</span>
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-1 text-sm font-semibold text-text-primary cursor-pointer whitespace-nowrap"
                >
                  {SORT_OPTIONS.find((o) => o.value === sortParam)?.label}
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 min-w-[160px] bg-dark-card border border-dark-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortParam(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left text-sm px-4 py-2 transition-colors ${
                          sortParam === opt.value
                            ? 'text-brand-purple bg-brand-purple/10'
                            : 'text-text-primary hover:bg-bg-pill'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="bg-dark-card border border-dark-border p-3 rounded-2xl mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary font-semibold mr-1">Active filters:</span>

                {unassignedFilter && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-brand-green/10 text-brand-green border border-brand-green/20">
                    <User className="w-3 h-3" /> Unassigned
                    <button onClick={() => setUnassignedFilter(false)} className="ml-0.5 hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {noCommentsFilter && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-brand-green/10 text-brand-green border border-brand-green/20">
                    <X className="w-3 h-3" /> No Comments
                    <button onClick={() => setNoCommentsFilter(false)} className="ml-0.5 hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {activeLabels.map((label) => (
                  <span
                    key={`lbl-${label}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-brand-purple/10 text-brand-purple border border-brand-purple/20"
                  >
                    <Tag className="w-3 h-3" /> {label}
                    <button onClick={() => toggleLabel(label)} className="ml-0.5 hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {excludedLabels.map((label) => (
                  <span
                    key={`exl-${label}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-brand-red/10 text-brand-red border border-brand-red/20 line-through"
                  >
                    <Tag className="w-3 h-3" /> {label}
                    <button onClick={() => toggleExcludeLabel(label)} className="ml-0.5 hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {activeLanguages.map((lang) => (
                  <span
                    key={`lng-${lang}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-bg-pill text-text-tertiary border border-dark-border/60"
                  >
                    <Code className="w-3 h-3" /> {lang}
                    <button onClick={() => toggleLanguage(lang)} className="ml-0.5 hover:text-text-primary transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  onClick={clearAllFilters}
                  className="text-xs text-text-tertiary hover:text-text-primary font-semibold ml-auto transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* ─── Loading State ─────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-brand-purple animate-spin" />
                <span className="text-sm text-text-tertiary font-semibold">
                  Searching global issues...
                </span>
              </div>
            </div>
          )}

          {/* ─── Empty State ────────────────────────────────────────────── */}
          {!loading && issues.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
              <div className="p-5 rounded-full bg-bg-pill border border-dark-border w-fit mx-auto mb-4">
                <Search className="h-10 w-10 text-text-tertiary" />
              </div>
              <p className="text-xl font-bold text-text-primary mb-2">
                No issues found
              </p>
              <p className="text-sm max-w-md text-center">
                Try removing some filters or making your search broader.
              </p>
            </div>
          )}

          {/* ─── Issues List ───────────────────────────────────────────── */}
          {!loading && issues.length > 0 && (
            <>
              {/* Featured Git-Issue Card — always pinned at top */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-dark-card rounded-2xl overflow-hidden relative"
                style={{
                  border: '2px solid transparent',
                  backgroundClip: 'padding-box',
                }}
              >
                {/* Gradient border via pseudo element simulation */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: '2px',
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed, #6d28d9)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    borderRadius: 'inherit',
                  }}
                />
                <div className="p-5 relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-brand-purple" />
                    <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">Featured</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    Yuvraj-Sarathe/Git-Issue
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    A powerful open-source GitHub issue explorer. Star it, contribute, and help make it better!
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/Yuvraj-Sarathe/Git-Issue"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-bg-pill border border-dark-border text-text-secondary hover:text-text-primary hover:bg-dark-card transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                      GitHub Repo
                    </a>
                    <a
                      href="https://gitissue.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-purple text-white hover:opacity-90 transition-opacity"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Live App
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Regular Issue Cards (list layout) */}
              <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                <ul className="divide-y divide-dark-border/60">
                  <AnimatePresence mode="popLayout">
                    {issues.map((item, idx) => {
                      const repoFullName = extractRepoFromUrl(item.repository_url);
                      const score = getMatchScore(item);

                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                          className="group transition-colors hover:bg-bg-pill/40"
                        >
                          <div className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col lg:flex-row gap-4">
                              {/* Main content */}
                              <div className="flex-1 min-w-0">
                                {/* Repo name */}
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary mb-2 ml-7">
                                  <Bookmark className="w-3.5 h-3.5" />
                                  <a
                                    href={`https://github.com/${repoFullName}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-brand-purple hover:underline transition-colors"
                                  >
                                    {repoFullName}
                                  </a>
                                </div>

                                {/* Title */}
                                <div className="flex items-start gap-2 mb-1.5">
                                  <CircleDot className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                                  <a
                                    href={item.html_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-base sm:text-lg font-bold text-text-primary hover:text-brand-purple break-words leading-tight transition-colors"
                                  >
                                    {item.title}
                                  </a>
                                </div>

                                {/* Labels */}
                                <div className="flex flex-wrap gap-1.5 mt-2 mb-2 ml-7">
                                  {item.labels.map((l) => {
                                    const isSpecial = l.name.toLowerCase().includes('first issue') || l.name.toLowerCase().includes('help wanted');
                                    return (
                                      <span
                                        key={l.id}
                                        className="text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border"
                                        style={{
                                          backgroundColor: `#${l.color}`,
                                          color: getTextColorForBg(l.color),
                                          borderColor: 'rgba(0,0,0,0.1)',
                                        }}
                                      >
                                        {isSpecial && <Sprout className="w-2.5 h-2.5" />}
                                        {l.name}
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* Meta: number, date, author */}
                                <div className="text-xs text-text-tertiary ml-7 flex flex-wrap items-center gap-y-1 gap-x-3 mt-3">
                                  <span className="font-semibold text-text-secondary/60">#{item.number}</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> opened{' '}
                                    {formatDate(item.created_at)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    by{' '}
                                    <a
                                      href={item.user.html_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-brand-purple hover:underline font-semibold transition-colors"
                                    >
                                      {item.user.login}
                                    </a>
                                  </span>
                                </div>
                              </div>

                              {/* Right column: assignees + comments + score + action */}
                              <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 mt-2 lg:mt-0 flex-shrink-0 pl-7 lg:pl-0 border-t lg:border-t-0 border-dark-border/60 pt-3 lg:pt-0">
                                <div className="flex items-center gap-2">
                                  {/* Assignees */}
                                  {item.assignees && item.assignees.length > 0 ? (
                                    <div className="flex -space-x-2">
                                      {item.assignees.map((assignee) => (
                                        <img
                                          key={assignee.login}
                                          src={assignee.avatar_url}
                                          alt={`@${assignee.login}`}
                                          title={`Assigned to ${assignee.login}`}
                                          className="w-6 h-6 rounded-full border-2 border-dark-card object-cover"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs px-2 py-1 bg-bg-pill text-text-tertiary rounded-lg font-semibold border border-dark-border/60">
                                      Unassigned
                                    </span>
                                  )}
                                </div>

                                {/* Comments count */}
                                {item.comments > 0 && (
                                  <div className="flex items-center gap-1 text-xs font-semibold text-text-tertiary group-hover:text-brand-purple transition-colors">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {item.comments}
                                  </div>
                                )}

                                {/* Match Score */}
                                <div
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    score >= 70
                                      ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                                      : score >= 40
                                        ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                                        : 'bg-bg-pill text-text-tertiary border-dark-border/60'
                                  }`}
                                >
                                  {score}% match
                                </div>

                                {/* Swipe to review */}
                                <button
                                  onClick={() => router.push(`/swipe?issueId=${item.id}`)}
                                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-purple text-white hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Swipe to review
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                {/* Pagination */}
                {(pagination.next || pagination.prev) && (
                  <div className="px-6 py-4 border-t border-dark-border/60 flex items-center justify-between">
                    <button
                      disabled={!pagination.prev || loadingMore}
                      onClick={() => fetchIssuesList(pagination.prev)}
                      className="group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-bg-pill border border-dark-border rounded-full text-text-tertiary hover:text-text-primary hover:bg-dark-card hover:border-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                      Previous
                    </button>

                    {loadingMore && (
                      <span className="text-sm font-semibold text-text-tertiary flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </span>
                    )}

                    <button
                      disabled={!pagination.next || loadingMore}
                      onClick={() => fetchIssuesList(pagination.next)}
                      className="group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-bg-pill border border-dark-border rounded-full text-text-tertiary hover:text-text-primary hover:bg-dark-card hover:border-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
