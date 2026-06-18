import { NextResponse } from 'next/server';

export async function GET() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (isDevMode) {
    // In developer mode, redirect directly to the callback with a mock code
    return NextResponse.redirect(new URL('/api/auth/callback?code=mock_code', appUrl));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${appUrl}/api/auth/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,public_repo`;

  return NextResponse.redirect(githubAuthUrl);
}
