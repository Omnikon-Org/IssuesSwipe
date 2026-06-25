import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user with recent swipes and contributions
    const fullProfile = await db.user.findUnique({
      where: { id: user.id },
      include: {
        swipes: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        savedMatches: {
          include: {
            issue: {
              include: {
                repository: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!fullProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build mock transactions dynamically for the UI
    const xpTransactions: any[] = [];

    // Swipes
    for (const swipe of fullProfile.swipes) {
      if (swipe.direction === 'right') {
        xpTransactions.push({
          id: `swipe-${swipe.id}`,
          amount: 25,
          action: 'OPEN_ISSUE',
          createdAt: swipe.createdAt.toISOString(),
        });
      }
    }

    // Saved Matches
    for (const match of fullProfile.savedMatches) {
      if (match.status === 'pr_merged') {
        xpTransactions.push({
          id: `merge-${match.id}`,
          amount: 250,
          action: 'MERGE_PR',
          createdAt: match.updatedAt.toISOString(),
        });
      }
      if (match.status === 'pr_opened' || match.status === 'pr_merged') {
        xpTransactions.push({
          id: `pr-${match.id}`,
          amount: 100,
          action: 'SUBMIT_PR',
          createdAt: match.createdAt.toISOString(),
        });
      }
      const hasRightSwipe = fullProfile.swipes.some((s) => s.issueId === match.issueId && s.direction === 'right');
      if (!hasRightSwipe) {
        xpTransactions.push({
          id: `save-${match.id}`,
          amount: 10,
          action: 'SAVE_ISSUE',
          createdAt: match.createdAt.toISOString(),
        });
      }
    }

    // Sort transactions by date descending
    xpTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const responseData = {
      ...fullProfile,
      xpTransactions: xpTransactions.slice(0, 10),
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to load user profile: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { languages, experienceLevel, interests } = await request.json();

    if (!Array.isArray(languages) || !experienceLevel || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        preferredLanguages: JSON.stringify(languages),
        experienceLevel,
        preferredTopics: JSON.stringify(interests),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to update profile: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
