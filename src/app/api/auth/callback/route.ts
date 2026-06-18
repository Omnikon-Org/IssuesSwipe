import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', appUrl));
  }

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  let userId = '';
  let username = '';
  let onboardingCompleted = false;

  if (isDevMode || code === 'mock_code') {
    // 1. Developer Mode Bypass: Upsert the developer mock user
    let devUser = await db.user.findUnique({
      where: { username: 'developer' },
    });

    if (!devUser) {
      devUser = await db.user.create({
        data: {
          username: 'developer',
          email: 'dev@issueswipe.io',
          name: 'Super Developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
          bio: 'Building systems, typing code, and swiping for open-source.',
          followersCount: 150,
          publicReposCount: 45,
          githubId: 'mock-github-id-12345',
          onboardingCompleted: false, // Start with false to allow testing onboarding flow
        },
      });
    }

    userId = devUser.id;
    username = devUser.username;
    onboardingCompleted = devUser.onboardingCompleted;
  } else {
    // 2. Real GitHub OAuth Exchange
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('Access token not found in GitHub response');
      }

      // Fetch GitHub User Profile
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      const githubUser = await userResponse.json();
      if (!githubUser.login) {
        throw new Error('Could not fetch profile from GitHub');
      }

      // Upsert User
      const user = await db.user.upsert({
        where: { githubId: String(githubUser.id) },
        update: {
          username: githubUser.login,
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          bio: githubUser.bio || '',
          followersCount: githubUser.followers || 0,
          publicReposCount: githubUser.public_repos || 0,
        },
        create: {
          githubId: String(githubUser.id),
          username: githubUser.login,
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          bio: githubUser.bio || '',
          followersCount: githubUser.followers || 0,
          publicReposCount: githubUser.public_repos || 0,
          onboardingCompleted: false,
        },
      });

      userId = user.id;
      username = user.username;
      onboardingCompleted = user.onboardingCompleted;
    } catch (error: any) {
      console.error('GitHub OAuth failed:', error.message);
      return NextResponse.redirect(new URL(`/?error=oauth_failed&msg=${encodeURIComponent(error.message)}`, appUrl));
    }
  }

  // Sign token and set session cookie
  const token = await signToken({ userId, username });
  const response = NextResponse.redirect(
    new URL(onboardingCompleted ? '/swipe' : '/onboarding', appUrl)
  );

  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return response;
}
