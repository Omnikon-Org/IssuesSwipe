'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Users, GitPullRequest, Database, RefreshCw, BarChart3, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';

interface Metrics {
  totalUsers: number;
  totalIssues: number;
  totalRepositories: number;
  totalSwipes: number;
  skips: number;
  contributes: number;
  avgUserXp: number;
}

interface PopularTech {
  language: string;
  count: number;
}

interface MostSwiped {
  name: string;
  owner: string;
  count: number;
}

interface UserRank {
  rank: string;
  count: number;
}

interface AnalyticsData {
  metrics: Metrics;
  popularTechnologies: PopularTech[];
  mostSwipedRepos: MostSwiped[];
  userRanks: UserRank[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSyncIssues = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setSyncResult(`Success! Synced ${json.issuesSynced} issues.`);
        fetchAnalytics(); // Refresh analytics metrics
      } else {
        setSyncResult(`Failed: ${json.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-dark-border rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass h-64 rounded-2xl" />
          <div className="glass h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-brand-red mx-auto" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-sm text-gray-500">Could not retrieve administrative metrics.</p>
      </div>
    );
  }

  const { metrics, popularTechnologies, mostSwipedRepos, userRanks } = data;

  // Compute skip/contribute percentage ratios
  const totalSwipes = metrics.totalSwipes || 1;
  const skipPercent = Math.round((metrics.skips / totalSwipes) * 100);
  const contributePercent = Math.round((metrics.contributes / totalSwipes) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8 relative z-10">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center space-x-2">
            <ShieldAlert className="h-8 w-8 text-brand-red" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Platform analytics and GitHub sync triggers.</p>
        </div>

        {/* Sync Trigger button */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {syncResult && (
            <span className="text-xs text-brand-green font-semibold bg-brand-green/10 px-3 py-1.5 rounded-lg border border-brand-green/20">
              {syncResult}
            </span>
          )}
          <button
            onClick={handleSyncIssues}
            disabled={syncing}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all shadow-md disabled:opacity-55 cursor-pointer ml-auto"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing Repos...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Sync GitHub Repos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Users */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs uppercase font-semibold">Total Users</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white">{metrics.totalUsers}</p>
        </div>

        {/* Repositories */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs uppercase font-semibold">Repositories</span>
            <Database className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white">{metrics.totalRepositories}</p>
        </div>

        {/* Issues */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs uppercase font-semibold">Total Issues</span>
            <GitPullRequest className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white">{metrics.totalIssues}</p>
        </div>

        {/* Swipes */}
        <div className="glass rounded-2xl p-5 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs uppercase font-semibold">Swipes Cast</span>
            <Flame className="h-4 w-4" />
          </div>
          <p className="text-3xl font-black text-white">{metrics.totalSwipes}</p>
        </div>
      </div>

      {/* Matching analytics & skip ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Swipe ratio */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-6 md:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <BarChart3 className="h-4 w-4 text-brand-blue" />
              <span>Matching Analytics - Swipe Distribution</span>
            </h3>
            <span className="text-xs text-gray-500">Avg User XP: {metrics.avgUserXp} XP</span>
          </div>

          <div className="space-y-4">
            {/* Ratios meters */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-brand-green">CONTRIBUTE Swipes</span>
                <span className="text-white">{metrics.contributes} ({contributePercent}%)</span>
              </div>
              <div className="w-full h-3 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-green" style={{ width: `${contributePercent}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-brand-red">SKIP Swipes</span>
                <span className="text-white">{metrics.skips} ({skipPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-red" style={{ width: `${skipPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* User Ranks distribution */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">User Ranks Distribution</h3>
          {userRanks.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No users registered.</p>
          ) : (
            <div className="space-y-2">
              {userRanks.map((ur) => (
                <div key={ur.rank} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">{ur.rank}</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-dark-border border border-white/5">
                    {ur.count} {ur.count === 1 ? 'user' : 'users'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tables - tech distribution & swiped repos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Popular Tech */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Popular Technologies</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-border text-gray-500 font-semibold">
                  <th className="pb-2">Language</th>
                  <th className="pb-2 text-right">Repository Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {popularTechnologies.map((tech) => (
                  <tr key={tech.language}>
                    <td className="py-2.5 font-bold text-gray-300">{tech.language}</td>
                    <td className="py-2.5 text-right font-semibold text-white">{tech.count}</td>
                  </tr>
                ))}
                {popularTechnologies.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500 italic">No technology metrics.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Swiped Repos */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Most Swiped Repositories</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-border text-gray-500 font-semibold">
                  <th className="pb-2">Repository</th>
                  <th className="pb-2 text-right">Total Swipes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mostSwipedRepos.map((repo) => (
                  <tr key={`${repo.owner}-${repo.name}`}>
                    <td className="py-2.5">
                      <span className="font-bold text-white block">
                        {repo.owner} / {repo.name}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-extrabold text-brand-green flex items-center justify-end space-x-1">
                      <span>{repo.count} swipes</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </td>
                  </tr>
                ))}
                {mostSwipedRepos.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500 italic">No swipe activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
