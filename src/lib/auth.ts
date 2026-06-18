import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-issueswipe-development-key-12345'
);

export async function signToken(payload: { userId: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; username: string };
  } catch (err) {
    return null;
  }
}

export async function getSessionUser() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // If in dev mode, auto-login the developer user
  if (isDevMode) {
    let devUser = await db.user.findUnique({
      where: { username: 'developer' },
    });

    if (!devUser) {
      // Create developer user if missing
      devUser = await db.user.create({
        data: {
          username: 'developer',
          email: 'dev@issueswipe.io',
          name: 'Super Developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
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
    }

    return devUser;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}
