import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing database records
  await prisma.contribution.deleteMany({});
  await prisma.xPTransaction.deleteMany({});
  await prisma.savedIssue.deleteMany({});
  await prisma.swipe.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.repository.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rank.deleteMany({});

  console.log('Cleaned old records.');

  // 2. Seed Ranks
  const ranks = [
    { name: 'New Contributor', minXP: 0, maxXP: 100, description: 'Welcome to the open-source jungle! Start exploring and saving issues.' },
    { name: 'Issue Hunter', minXP: 101, maxXP: 500, description: 'You have a keen eye for good first issues and help-wanted tags.' },
    { name: 'PR Warrior', minXP: 501, maxXP: 1500, description: 'You actively submit pull requests and push code changes.' },
    { name: 'Merge Machine', minXP: 1501, maxXP: 5000, description: 'Your contributions are getting merged regularly. Maintainers love you!' },
    { name: 'Open Source Legend', minXP: 5001, maxXP: 999999, description: 'You are an absolute legend. The backbone of the open-source community.' },
  ];

  for (const r of ranks) {
    await prisma.rank.create({ data: r });
  }
  console.log('Seeded ranks.');

  // 3. Seed Repositories
  const repos = [
    {
      githubId: 'nextjs-repo-id',
      name: 'next.js',
      owner: 'vercel',
      description: 'The React Framework for the Web. Built for scale, security, and developer experience.',
      url: 'https://github.com/vercel/next.js',
      stars: 125000,
      language: 'TypeScript',
    },
    {
      githubId: 'tailwindcss-repo-id',
      name: 'tailwindcss',
      owner: 'tailwindlabs',
      description: 'A utility-first CSS framework for rapid UI development. Beautiful, flexible, and fast.',
      url: 'https://github.com/tailwindlabs/tailwindcss',
      stars: 84000,
      language: 'TypeScript',
    },
    {
      githubId: 'prisma-repo-id',
      name: 'prisma',
      owner: 'prisma',
      description: 'Next-generation ORM for Node.js and TypeScript. Declare your models, query type-safely.',
      url: 'https://github.com/prisma/prisma',
      stars: 38000,
      language: 'TypeScript',
    },
    {
      githubId: 'framer-motion-repo-id',
      name: 'motion',
      owner: 'framer',
      description: 'A production-ready motion library for React on the web. Smooth physics, gestures, and layouts.',
      url: 'https://github.com/framer/motion',
      stars: 24000,
      language: 'TypeScript',
    },
    {
      githubId: 'python-fastapi-repo-id',
      name: 'fastapi',
      owner: 'tiangolo',
      description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production.',
      url: 'https://github.com/tiangolo/fastapi',
      stars: 72000,
      language: 'Python',
    },
    {
      githubId: 'go-gin-repo-id',
      name: 'gin',
      owner: 'gin-gonic',
      description: 'Gin is a HTTP web framework written in Go (Golang). It features a Martini-like API with much better performance.',
      url: 'https://github.com/gin-gonic/gin',
      stars: 76000,
      language: 'Go',
    },
  ];

  const createdRepos: Record<string, any> = {};
  for (const repo of repos) {
    const r = await prisma.repository.create({ data: repo });
    createdRepos[repo.name] = r;
  }
  console.log('Seeded repositories.');

  // 4. Seed Issues
  const issues = [
    {
      githubId: 'issue-next-1',
      title: 'docs: Clarify App Router layouts caching behavior',
      description: 'The documentation currently lacks a detailed explanation of how nested layout routing handles component state caching during rapid navigation. We should add a new section in the caching page and update code examples.',
      url: 'https://github.com/vercel/next.js/issues/1',
      number: 101,
      state: 'open',
      repositoryId: createdRepos['next.js'].id,
      labels: JSON.stringify(['documentation', 'good first issue', 'app-router']),
      difficulty: 'Beginner',
      estimatedTime: '1-2 hours',
    },
    {
      githubId: 'issue-next-2',
      title: 'feat: Add support for custom loaders in next/image for local assets',
      description: 'Allow developers to override the default local asset image loader directly on the client configuration. This is helpful for projects executing specialized WebP/AVIF transforms via custom pipelines.',
      url: 'https://github.com/vercel/next.js/issues/2',
      number: 102,
      state: 'open',
      repositoryId: createdRepos['next.js'].id,
      labels: JSON.stringify(['feature', 'help wanted', 'typescript', 'frontend']),
      difficulty: 'Advanced',
      estimatedTime: '8-12 hours',
    },
    {
      githubId: 'issue-tailwind-1',
      title: 'bug: CSS variable grid values not compiling correctly in v4.0 alpha',
      description: 'When grid column templates are declared using nested CSS variables (e.g. `grid-cols-[var(--my-cols)]`), the parser fails to expand them in the compiled CSS bundle, resulting in empty layouts. Need to fix the utility resolver regex.',
      url: 'https://github.com/tailwindlabs/tailwindcss/issues/1',
      number: 201,
      state: 'open',
      repositoryId: createdRepos['tailwindcss'].id,
      labels: JSON.stringify(['bug', 'help wanted', 'css', 'frontend']),
      difficulty: 'Intermediate',
      estimatedTime: '3-5 hours',
    },
    {
      githubId: 'issue-prisma-1',
      title: 'docs: Add interactive diagram for Prisma Client engine lifecycles',
      description: 'The documentation for query engines is text-heavy. We need a clear, visual flowchart showing how query plans transition from JS API calls through the Wasm/Binary engine down to PostgreSQL.',
      url: 'https://github.com/prisma/prisma/issues/1',
      number: 301,
      state: 'open',
      repositoryId: createdRepos['prisma'].id,
      labels: JSON.stringify(['documentation', 'good first issue']),
      difficulty: 'Beginner',
      estimatedTime: '2-3 hours',
    },
    {
      githubId: 'issue-prisma-2',
      title: 'perf: Optimize memory overhead in Prisma Client under batch writes',
      description: 'Executing massive transactional inserts (e.g. `createMany` with 50,000+ entries) causes a memory spike in the client bridge due to eager serialization. We need to implement streaming or chunked serialization.',
      url: 'https://github.com/prisma/prisma/issues/2',
      number: 302,
      state: 'open',
      repositoryId: createdRepos['prisma'].id,
      labels: JSON.stringify(['performance', 'backend', 'typescript']),
      difficulty: 'Advanced',
      estimatedTime: '10-15 hours',
    },
    {
      githubId: 'issue-motion-1',
      title: 'bug: Layout animations trigger layout shifts in Safari mobile',
      description: 'Framer Motion layout transitions using `layoutId` cause minor stuttering and horizontal shifts on iOS Safari when the page has vertical scroll. This is likely related to mobile viewport height transitions. Need research and layout lock mitigation.',
      url: 'https://github.com/framer/motion/issues/1',
      number: 401,
      state: 'open',
      repositoryId: createdRepos['motion'].id,
      labels: JSON.stringify(['bug', 'good first issue', 'animation', 'frontend']),
      difficulty: 'Intermediate',
      estimatedTime: '4-6 hours',
    },
    {
      githubId: 'issue-fastapi-1',
      title: 'feat: Add automated OpenAPI documentation filtering by security scope',
      description: 'Currently, FastAPI lists all defined endpoints in the Swagger UI. We should add a configuration argument to dynamically hide endpoints based on the token scopes of the active user session.',
      url: 'https://github.com/tiangolo/fastapi/issues/1',
      number: 501,
      state: 'open',
      repositoryId: createdRepos['fastapi'].id,
      labels: JSON.stringify(['feature', 'security', 'python', 'backend']),
      difficulty: 'Intermediate',
      estimatedTime: '4-8 hours',
    },
    {
      githubId: 'issue-go-gin-1',
      title: 'bug: Memory leaks when handling high-concurrency SSE connections',
      description: 'When the Gin router handles Server-Sent Events (SSE) stream channels, client closures do not always trigger contextual cleanup, leaving active goroutines idle in memory. Fix requires standardizing context cancels inside writer buffers.',
      url: 'https://github.com/gin-gonic/gin/issues/1',
      number: 601,
      state: 'open',
      repositoryId: createdRepos['gin'].id,
      labels: JSON.stringify(['bug', 'performance', 'go', 'backend']),
      difficulty: 'Advanced',
      estimatedTime: '6-10 hours',
    },
  ];

  for (const issue of issues) {
    await prisma.issue.create({ data: issue });
  }
  console.log('Seeded issues.');

  // 5. Seed Users
  // Standard test developer user
  const user = await prisma.user.create({
    data: {
      username: 'developer',
      email: 'dev@issueswipe.io',
      name: 'Super Developer',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4', // Octocat avatar
      bio: 'Building systems, typing code, and swiping for pull requests.',
      followersCount: 150,
      publicReposCount: 45,
      githubId: 'mock-github-id-12345',
      onboardingCompleted: true,
      languages: JSON.stringify(['TypeScript', 'JavaScript', 'Python', 'Go']),
      experienceLevel: 'Intermediate',
      interests: JSON.stringify(['Frontend', 'Backend', 'AI']),
      xp: 250,
      streak: 5,
      rank: 'Issue Hunter',
    },
  });

  // Seed XP transactions for history
  await prisma.xPTransaction.createMany({
    data: [
      { userId: user.id, amount: 10, action: 'SAVE_ISSUE', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 25, action: 'OPEN_ISSUE', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 10, action: 'SAVE_ISSUE', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 100, action: 'SUBMIT_PR', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 105, action: 'SAVE_ISSUE', createdAt: new Date() }, // Add remaining to hit 250 XP
    ],
  });

  // Seed some swipes for the developer
  // Let's swipe SKIP on 'issue-prisma-2' and CONTRIBUTE on 'issue-next-1'
  const next1 = await prisma.issue.findUnique({ where: { githubId: 'issue-next-1' } });
  const prisma2 = await prisma.issue.findUnique({ where: { githubId: 'issue-prisma-2' } });

  if (next1 && prisma2) {
    await prisma.swipe.create({
      data: {
        userId: user.id,
        issueId: next1.id,
        direction: 'CONTRIBUTE',
      },
    });

    await prisma.savedIssue.create({
      data: {
        userId: user.id,
        issueId: next1.id,
      },
    });

    await prisma.swipe.create({
      data: {
        userId: user.id,
        issueId: prisma2.id,
        direction: 'SKIP',
      },
    });
  }

  // Seed some other active users for leaderboard/analytics
  await prisma.user.create({
    data: {
      username: 'linus_torvalds',
      name: 'Linus Torvalds',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1024?v=4',
      bio: 'I do talk code.',
      followersCount: 180000,
      publicReposCount: 12,
      githubId: 'mock-linus-id',
      onboardingCompleted: true,
      languages: JSON.stringify(['C', 'Go', 'Python']),
      experienceLevel: 'Advanced',
      interests: JSON.stringify(['Backend', 'DevOps', 'Security']),
      xp: 7500,
      streak: 42,
      rank: 'Open Source Legend',
    },
  });

  await prisma.user.create({
    data: {
      username: 'dan_abramov',
      name: 'Dan Abramov',
      avatarUrl: 'https://avatars.githubusercontent.com/u/810438?v=4',
      bio: 'React team alumnus. Co-author of Redux and Create React App.',
      followersCount: 95000,
      publicReposCount: 88,
      githubId: 'mock-dan-id',
      onboardingCompleted: true,
      languages: JSON.stringify(['JavaScript', 'TypeScript']),
      experienceLevel: 'Advanced',
      interests: JSON.stringify(['Frontend']),
      xp: 3200,
      streak: 15,
      rank: 'Merge Machine',
    },
  });

  await prisma.user.create({
    data: {
      username: 'newbie_coder',
      name: 'Alice Johnson',
      avatarUrl: 'https://avatars.githubusercontent.com/u/200000?v=4',
      bio: 'Computer Science student looking for my first contribution.',
      followersCount: 5,
      publicReposCount: 2,
      githubId: 'mock-alice-id',
      onboardingCompleted: true,
      languages: JSON.stringify(['JavaScript', 'Python']),
      experienceLevel: 'Beginner',
      interests: JSON.stringify(['Frontend', 'Mobile']),
      xp: 45,
      streak: 1,
      rank: 'New Contributor',
    },
  });

  console.log('Seeded users and swipes.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
