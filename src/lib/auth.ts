import { cookies } from 'next/headers';
import { db } from './db';
import { getAdminAuth } from './firebase/server';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseSession')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    let decodedClaims;
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && sessionCookie === 'mock_dev_session_cookie_12345') {
      decodedClaims = {
        uid: 'mock_dev_github_user_12345',
        name: 'Rishi Bhardwaj',
        email: 'rishi@example.com',
      };
    } else {
      decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    }
    
    const user = await db.user.findFirst({
      where: { githubId: decodedClaims.uid },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export async function getAdminStatus() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseSession')?.value;

  if (!sessionCookie) {
    return false;
  }

  try {
    let decodedClaims;
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && sessionCookie === 'mock_dev_session_cookie_12345') {
      decodedClaims = {
        uid: 'mock_dev_github_user_12345',
        name: 'Rishi Bhardwaj',
        email: 'rishi@example.com',
      };
    } else {
      decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    }
    return decodedClaims.email === 'pranavthawait@gmail.com' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  } catch (error) {
    return false;
  }
}
