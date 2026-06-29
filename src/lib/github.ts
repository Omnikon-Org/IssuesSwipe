import { db } from './db';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

export interface GitHubIssueSyncResult {
  success: boolean;
  issuesSynced: number;
  message: string;
  isSimulated?: boolean;
}

interface GitHubSearchNode {
  id: string;
  title: string;
  url: string;
  number: number;
  body: string | null;
  createdAt: string;
  labels?: { nodes?: { name: string }[] };
  repository?: {
    id: string;
    name: string;
    url: string;
    description: string | null;
    stargazerCount: number;
    owner: { login: string };
    primaryLanguage?: { name: string };
    object?: { text: string } | null;
  };
}

interface GitHubGraphQLResponse {
  data?: {
    search?: {
      edges?: {
        node: GitHubSearchNode;
      }[];
    };
  };
  errors?: { message: string }[];
}

const GITHUB_SEARCH_QUERY = `
  query($queryString: String!) {
    search(query: $queryString, type: ISSUE, first: 30) {
      issueCount
      edges {
        node {
          ... on Issue {
            id
            title
            url
            number
            body
            createdAt
            labels(first: 5) {
              nodes {
                name
              }
            }
            repository {
              id
              name
              url
              description
              stargazerCount
              owner {
                login
              }
              primaryLanguage {
                name
              }
              object(expression: "HEAD:README.md") {
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Builds a GitHub `stars:` range qualifier from optional bounds.
// Returns '' when no usable range is supplied so callers can detect "no filter".
function buildStarQualifier(minStars?: number, maxStars?: number): string {
  const hasMin = typeof minStars === 'number' && !Number.isNaN(minStars);
  const hasMax = typeof maxStars === 'number' && !Number.isNaN(maxStars);
  if (hasMin && hasMax) return `stars:${minStars}..${maxStars}`;
  if (hasMin) return `stars:>=${minStars}`;
  if (hasMax) return `stars:<=${maxStars}`;
  return '';
}

// Upserts a single repository + issue pair into the DB.
// `node` is a search/issues item or a /repos/.../issues item (same shape),
// `repoNode` is the GitHub repository object. Returns true if persisted.
async function persistIssue(node: any, repoNode: any): Promise<boolean> {
  if (!repoNode) return false;

  const labels: string[] = node.labels?.map((l: { name: string }) => l.name) || [];

  // 1. Create or Update Repository
  const repo = await db.repository.upsert({
    where: { githubId: repoNode.id.toString() },
    update: {
      name: repoNode.name,
      fullName: repoNode.full_name,
      languages: JSON.stringify([repoNode.language || 'TypeScript']),
      topics: JSON.stringify(repoNode.topics || []),
      owner: repoNode.owner.login,
      description: repoNode.description,
      url: repoNode.html_url,
      stars: repoNode.stargazers_count,
      language: repoNode.language || 'TypeScript',
    },
    create: {
      githubId: repoNode.id.toString(),
      name: repoNode.name,
      fullName: repoNode.full_name,
      languages: JSON.stringify([repoNode.language || 'TypeScript']),
      topics: JSON.stringify(repoNode.topics || []),
      owner: repoNode.owner.login,
      description: repoNode.description,
      url: repoNode.html_url,
      stars: repoNode.stargazers_count,
      language: repoNode.language || 'TypeScript',
    },
  });

  // 2. Map labels to difficulty
  const isGoodFirst = labels.some((l: string) => l.toLowerCase().includes('good first issue'));
  const difficulty = isGoodFirst ? 'Beginner' : Math.random() > 0.5 ? 'Intermediate' : 'Advanced';

  // 3. Create or Update Issue
  await db.issue.upsert({
    where: { repositoryId_githubNumber: { repositoryId: repo.id, githubNumber: node.number } },
    update: {
      title: node.title,
      description: node.body || '',
      url: node.html_url,
      githubNumber: node.number,
      labels: JSON.stringify(labels),
      difficulty,
    },
    create: {
      githubId: node.id.toString(),
      title: node.title,
      description: node.body || '',
      url: node.html_url,
      githubNumber: node.number,
      repositoryId: repo.id,
      labels: JSON.stringify(labels),
      difficulty,
    },
  });

  return true;
}

export async function syncIssuesFromGitHub(
  accessToken?: string,
  preferredLanguages: string[] = [],
  preferredTopics: string[] = [],
  searchText?: string,
  customLabels: string[] = [],
  minStars?: number,
  maxStars?: number
): Promise<GitHubIssueSyncResult> {
  const token = accessToken || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

  if (!token || token === 'mock_client_secret' || token === 'your_token') {
    console.log('GitHub Token missing or placeholder. Simulating sync with sample data...');
    return simulateSync();
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'IssueSwipe-Sync-Service',
    };
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `token ${token}`;
    }

    const executeRestSearch = async (queryParts: string[]) => {
      const q = encodeURIComponent(queryParts.join(' '));
      // Pick a random page between 1 and 5 to always get fresh issues
      const page = Math.floor(Math.random() * 5) + 1;
      const url = `https://api.github.com/search/issues?q=${q}&per_page=30&page=${page}&sort=updated`;
      console.log(`[Sync] GitHub REST search query: ${queryParts.join(' ')} (Page ${page})`);
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`GitHub Search returned ${response.status}:`, await response.text());
        throw new Error(`GitHub REST API returned status ${response.status}`);
      }
      const data = await response.json();
      return (data.items || []).filter((item: any) => !item.pull_request);
    };

    // Build the set of labels to filter issues by (shared across both paths).
    const issueLabels = customLabels.length > 0 ? customLabels : ['good first issue'];

    // The star range turns on the repo-search-first strategy. GitHub's
    // search/issues endpoint can't filter by repo stars, so when a range is
    // requested we first find repos in range, then pull their issues.
    const starQualifier = buildStarQualifier(minStars, maxStars);
    const starFilterRequested = starQualifier !== '';

    // (node, repoNode) pairs ready to persist, gathered by whichever path runs.
    const pairs: { node: any; repoNode: any }[] = [];

    if (starFilterRequested) {
      // --- Repo-search-first path (dynamic star range) ---
      const repoQueryParts = [starQualifier];
      preferredLanguages.forEach(l => repoQueryParts.push(`language:${l}`));
      
      // If we have custom topics/tags, filter by them
      preferredTopics.forEach(t => repoQueryParts.push(`topic:${t}`));

      const repoQ = encodeURIComponent(repoQueryParts.join(' '));
      const repoUrl = `https://api.github.com/search/repositories?q=${repoQ}&per_page=15&sort=updated`;
      console.log(`[Sync] GitHub repo search query: ${repoQueryParts.join(' ')}`);

      const repoRes = await fetch(repoUrl, { headers });
      if (!repoRes.ok) {
        throw new Error(`GitHub repository search returned status ${repoRes.status}`);
      }
      const repoData = await repoRes.json();
      const repos = (repoData.items || []) as any[];

      // For each in-range repo, fetch its open issues matching the labels.
      for (const repoNode of repos) {
        const labelParam = encodeURIComponent(issueLabels.join(','));
        const issuesUrl = `https://api.github.com/repos/${repoNode.full_name}/issues?state=open&labels=${labelParam}&per_page=10`;
        try {
          const issuesRes = await fetch(issuesUrl, { headers });
          if (!issuesRes.ok) {
            console.warn(`Failed to fetch issues for ${repoNode.full_name} - Status: ${issuesRes.status}`);
            continue;
          }
          const repoIssues = (await issuesRes.json()) as any[];
          repoIssues
            .filter(issue => !issue.pull_request)
            .forEach(node => pairs.push({ node, repoNode }));
        } catch (e) {
          console.warn(`Error fetching issues for ${repoNode.full_name}`);
        }
      }
    } else {
      // --- Default issue-search path (unchanged behaviour) ---
      let issues: any[] = [];
      const baseQuery = ['type:issue', 'state:open'];
      if (searchText) baseQuery.push(searchText);
      issueLabels.forEach(label => baseQuery.push(`label:"${label}"`));

      // 1. Try strict match (Languages + Topics)
      let queryParts = [...baseQuery];
      if (preferredLanguages.length > 0) {
        preferredLanguages.forEach(l => queryParts.push(`language:${l}`));
      }
      if (preferredTopics.length > 0) {
        preferredTopics.forEach(t => queryParts.push(t));
      }
      issues = await executeRestSearch(queryParts);

      // 2. Fallback: Only Languages
      if (issues.length === 0 && preferredTopics.length > 0) {
        console.log('[Sync] Strict match returned 0, trying only languages...');
        queryParts = [...baseQuery];
        if (preferredLanguages.length > 0) {
          preferredLanguages.forEach(l => queryParts.push(`language:${l}`));
        }
        issues = await executeRestSearch(queryParts);
      }

      // 3. Fallback: Broadest possible search
      if (issues.length === 0 && preferredLanguages.length > 0) {
        console.log('[Sync] Language match returned 0, trying broad search...');
        issues = await executeRestSearch([...baseQuery]);
      }

      // Fetch Unique Repositories Sequentially to avoid Abuse/Secondary rate limits
      const uniqueRepoUrls = [...new Set(issues.map(i => i.repository_url))];
      const repoDataMap = new Map();

      for (const repoUrl of uniqueRepoUrls) {
        if (typeof repoUrl !== 'string') continue;
        try {
          const repoRes = await fetch(repoUrl, { headers });
          if (repoRes.ok) {
            repoDataMap.set(repoUrl, await repoRes.json());
          } else {
            console.warn(`Failed to fetch repo ${repoUrl} - Status: ${repoRes.status}`);
          }
        } catch (e) {
          console.warn(`Error fetching repo ${repoUrl}`);
        }
      }

      issues.forEach(node => {
        const repoNode = repoDataMap.get(node.repository_url);
        if (repoNode) pairs.push({ node, repoNode });
      });
    }

    let syncCount = 0;
    for (const { node, repoNode } of pairs) {
      if (await persistIssue(node, repoNode)) syncCount++;
    }

    if (syncCount === 0) {
      // When the user explicitly set a star range, respect it: return an honest
      // empty result so the UI can prompt them to change their criteria.
      // Never silently fall back to simulated data here.
      if (starFilterRequested) {
        return {
          success: true,
          issuesSynced: 0,
          message: 'No issues found for the selected star range. Try widening your criteria.',
        };
      }
      console.log('GitHub API returned 0 issues, simulating to ensure user has content...');
      return simulateSync('GitHub returned 0 matches, added simulated issues instead.');
    }

    return {
      success: true,
      issuesSynced: syncCount,
      message: `Successfully synced ${syncCount} issues from GitHub REST search.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('GitHub API sync failed, falling back to simulation:', message);
    return simulateSync(`Sync failed: ${message}. Simulating instead.`);
  }
}

async function simulateSync(note?: string): Promise<GitHubIssueSyncResult> {
  // Wait a small delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock repositories to create if DB is empty or to add variety
  const mockRepoData = [
    { owner: 'facebook', name: 'react', desc: 'The library for web and native user interfaces.', lang: 'JavaScript', stars: 225000, url: 'https://github.com/facebook/react' },
    { owner: 'microsoft', name: 'TypeScript', desc: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.', lang: 'TypeScript', stars: 100000, url: 'https://github.com/microsoft/TypeScript' },
    { owner: 'denoland', name: 'deno', desc: 'A modern runtime for JavaScript and TypeScript.', lang: 'Rust', stars: 94000, url: 'https://github.com/denoland/deno' },
    { owner: 'sveltejs', name: 'svelte', desc: 'Cybernetically enhanced web apps.', lang: 'JavaScript', stars: 78000, url: 'https://github.com/sveltejs/svelte' },
    { owner: 'remix-run', name: 'remix', desc: 'Build better websites with Remix.', lang: 'TypeScript', stars: 29000, url: 'https://github.com/remix-run/remix' },
    { owner: 'astro-community', name: 'astro', desc: 'Build faster websites with Astro.', lang: 'TypeScript', stars: 45000, url: 'https://github.com/withastro/astro' },
    { owner: 'vuejs', name: 'vue', desc: 'An approachable, performant and versatile framework for building web user interfaces.', lang: 'TypeScript', stars: 207000, url: 'https://github.com/vuejs/core' },
    { owner: 'golang', name: 'go', desc: 'The Go programming language.', lang: 'Go', stars: 123000, url: 'https://github.com/golang/go' },
    { owner: 'rust-lang', name: 'rust', desc: 'Empowering everyone to build reliable and efficient software.', lang: 'Rust', stars: 96000, url: 'https://github.com/rust-lang/rust' },
    { owner: 'django', name: 'django', desc: 'The Web framework for perfectionists with deadlines.', lang: 'Python', stars: 79000, url: 'https://github.com/django/django' },
  ];

  const mockIssueTitles = [
    'fix: Resolve server actions race condition in edge environments',
    'chore: Clean up duplicate styling classes in buttons grid layout',
    'docs: Add example for complex database transitions with prisma seed',
    'perf: Leverage cache directives inside client components rendering',
    'bug: Multi-touch zoom crashes gesture handlers in mobile viewports',
    'feat: Add dark mode toggle to settings page',
    'fix: Memory leak in useEffect cleanup for WebSocket connections',
    'docs: Improve getting started guide for new contributors',
    'chore: Update dependencies to latest stable versions',
    'feat: Add search functionality to issue list page',
    'fix: Incorrect date formatting in activity feed',
    'perf: Reduce bundle size by tree-shaking unused icons',
    'bug: Form validation not triggering on mobile Safari',
    'feat: Implement keyboard shortcuts for common actions',
    'docs: Add API reference documentation for REST endpoints',
  ];

  // Pick 3 random repos to create/update
  const shuffled = [...mockRepoData].sort(() => Math.random() - 0.5);
  const selectedRepos = shuffled.slice(0, 3);
  let syncCount = 0;

  for (const repoData of selectedRepos) {
    const ghId = `sim-repo-${repoData.owner}-${repoData.name}-${Date.now()}`;
    
    const repo = await db.repository.upsert({
      where: { githubId: `sim-${repoData.owner}-${repoData.name}` },
      update: {
        stars: repoData.stars + Math.floor(Math.random() * 1000),
      },
      create: {
        githubId: `sim-${repoData.owner}-${repoData.name}`,
        name: repoData.name,
        fullName: `${repoData.owner}/${repoData.name}`,
        languages: JSON.stringify([repoData.lang]),
        topics: JSON.stringify(['hacktoberfest', repoData.lang.toLowerCase(), 'good-first-issue', 'open-source']),
        owner: repoData.owner,
        description: repoData.desc,
        readmeText: `# ${repoData.name}\n\n${repoData.desc}\n\n## Getting Started\n\nCheck out the documentation to get started with ${repoData.name}.\n\n## Contributing\n\nWe welcome contributions! Please read our contributing guide.`,
        url: repoData.url,
        stars: repoData.stars,
        language: repoData.lang,
      },
    });

    // Create 2 random issues per repo
    const issueSlice = [...mockIssueTitles].sort(() => Math.random() - 0.5).slice(0, 2);
    for (const title of issueSlice) {
      const issueNum = (Date.now() % 900000) + 100000 + Math.floor(Math.random() * 1000);
      const randomId = `sim-issue-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const isDocOrBug = title.startsWith('docs') || title.startsWith('fix');
      const difficulty = isDocOrBug ? 'Beginner' : Math.random() > 0.5 ? 'Intermediate' : 'Advanced';

      try {
        await db.issue.upsert({
          where: { repositoryId_githubNumber: { repositoryId: repo.id, githubNumber: issueNum } },
          update: {
            title: title,
            description: `This issue needs help in ${repoData.owner}/${repoData.name}. Great opportunity for open source contribution.`,
            url: `${repoData.url}/issues`,
            labels: JSON.stringify(isDocOrBug ? ['good first issue', 'documentation'] : ['good first issue', 'help wanted']),
            difficulty,
          },
          create: {
            githubId: randomId,
            title: title,
            description: `This issue needs help in ${repoData.owner}/${repoData.name}. Great opportunity for open source contribution.`,
            url: `${repoData.url}/issues`,
            githubNumber: issueNum,
            repositoryId: repo.id,
            labels: JSON.stringify(isDocOrBug ? ['good first issue', 'documentation'] : ['good first issue', 'help wanted']),
            difficulty,
          },
        });
        syncCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  return {
    success: true,
    issuesSynced: syncCount,
    message: `Simulation Success. Synced ${syncCount} new issues. ${note || ''}`,
    isSimulated: true,
  };
}

export async function checkUserPRStatus(username: string, repoFullName: string, token?: string) {
  const query = `is:pr author:${username} repo:${repoFullName}`;
  const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
  
  if (token && token !== 'mock_client_secret' && token !== 'your_token') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}`, { headers });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      // Sort by updated_at desc (if multiple)
      const pr = data.items[0];
      
      if (pr.state === 'closed' && pr.pull_request?.merged_at) {
        return { status: 'pr_merged', url: pr.html_url };
      }
      if (pr.state === 'open') {
        return { status: 'pr_opened', url: pr.html_url };
      }
    }
  } catch(e) {
    console.error('Failed to check PR status for', username, repoFullName, e);
  }
  return null;
}
