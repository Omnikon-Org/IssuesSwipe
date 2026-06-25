import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return NextResponse.redirect(`${appUrl}/api/auth/callback?code=mock_code`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${appUrl}/api/auth/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,public_repo`;

  return NextResponse.redirect(githubAuthUrl);
}
