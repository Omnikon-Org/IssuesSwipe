# 🔥 IssueSwipe

> **Tinder for Open Source Contributions** — Discover your next pull request in seconds.

IssueSwipe is a gamified open-source discovery platform built with Next.js 16, Prisma ORM, and Framer Motion. Swipe right to contribute, left to skip, or bookmark issues for later — all while earning XP, maintaining streaks, and climbing developer ranks.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🃏 **Swipe Feed** | Tinder-style drag-to-swipe card interface powered by Framer Motion |
| 🧠 **Smart Matching** | Scoring engine matches issues to your languages, interests & skill level |
| 🏆 **Gamification** | XP system, 5 developer ranks, daily streak tracking |
| 🔖 **Saved Matches** | Bookmark issues and track your contribution workflow (Opened → PR → Merged) |
| 🔄 **GitHub Sync** | Live GraphQL API sync for `good first issue` and `help wanted` labels |
| 👤 **GitHub OAuth** | Secure login with JWT session management |
| 📊 **Admin Dashboard** | Platform analytics: swipe ratios, popular tech, most-swiped repos |
| 🌙 **Dev Mode** | Full local development with mock auth — no GitHub OAuth app required |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/issueswipe.git
cd issueswipe
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values. For local development, you can leave `NEXT_PUBLIC_DEV_MODE="true"` and skip the GitHub OAuth setup entirely.

### 3. Set Up the Database

```bash
# Push schema to SQLite
npx prisma db push

# Seed with sample repositories, issues, and users
npx prisma db seed
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be automatically logged in as the mock developer account.

---

## 🗂️ Project Structure

```
issueswipe/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Sample data seeder
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API Route Handlers
│   │   │   ├── auth/        # GitHub OAuth + session endpoints
│   │   │   ├── issues/      # Feed API with match scoring
│   │   │   ├── matches/     # Saved issues CRUD
│   │   │   ├── profile/     # User profile + onboarding
│   │   │   ├── swipe/       # Swipe registration + XP
│   │   │   ├── sync/        # GitHub GraphQL sync trigger
│   │   │   └── admin/       # Analytics dashboard API
│   │   ├── swipe/           # Swipe feed page
│   │   ├── onboarding/      # User preference setup
│   │   ├── matches/         # Saved matches page
│   │   ├── profile/         # User profile page
│   │   └── admin/           # Admin dashboard page
│   ├── components/
│   │   ├── LandingPage.tsx
│   │   ├── Navbar.tsx
│   │   ├── SwipeFeed.tsx
│   │   ├── OnboardingForm.tsx
│   │   ├── SavedMatches.tsx
│   │   ├── UserProfile.tsx
│   │   └── AdminDashboard.tsx
│   └── lib/
│       ├── auth.ts          # JWT session management
│       ├── db.ts            # Prisma client singleton
│       ├── github.ts        # GitHub GraphQL sync
│       ├── matching.ts      # Issue match scoring algorithm
│       └── xp.ts            # XP & rank computation
```

---

## 🧠 Match Scoring Algorithm

Issues are scored 0–100 based on:

| Factor | Max Points |
|---|---|
| Language match (repo language == user language) | 30 |
| Interest match (labels/title keywords vs user interests) | 25 |
| Difficulty/experience alignment | 20 |
| `good first issue` / `help wanted` labels | 15 |
| Repository star count (popularity bonus) | 10 |

---

## 🏅 XP & Rank System

| Action | XP Gained |
|---|---|
| Save an issue | +10 XP |
| Swipe right (Contribute) | +25 XP |
| Submit a PR | +100 XP |
| Get a PR Merged | +250 XP |

| Rank | XP Required |
|---|---|
| New Contributor | 0 – 100 |
| Issue Hunter | 101 – 500 |
| PR Warrior | 501 – 1,500 |
| Merge Machine | 1,501 – 5,000 |
| Open Source Legend | 5,001+ |

---

## 🔑 Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite connection string (default: `file:./dev.db`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | For live issue sync (optional, falls back to simulation) |
| `JWT_SECRET` | Secret key for signing session JWTs |
| `NEXT_PUBLIC_DEV_MODE` | Set `"true"` to skip OAuth and use a mock dev account |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript 5
- **Database**: SQLite via [Prisma 7](https://prisma.io) + `better-sqlite3`
- **Animations**: [Framer Motion 12](https://framer.com/motion)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (custom dark theme)
- **Icons**: [Lucide React](https://lucide.dev)
- **Auth**: GitHub OAuth 2.0 + JWT (via `jose`)

---

## 📄 License

MIT © IssueSwipe Team
