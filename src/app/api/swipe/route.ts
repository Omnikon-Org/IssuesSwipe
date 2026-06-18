import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addXp } from '@/lib/xp';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issueId, direction } = await request.json();

    if (!issueId || !['SKIP', 'CONTRIBUTE', 'SAVE'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let updatedUser = user;

    if (direction === 'SKIP') {
      // 1. SKIP action: Log swipe
      await db.swipe.create({
        data: {
          userId: user.id,
          issueId,
          direction: 'SKIP',
        },
      });
    } else if (direction === 'CONTRIBUTE') {
      // 2. CONTRIBUTE action: Log swipe, save bookmark, and initialize contribution
      await db.$transaction(async (tx) => {
        await tx.swipe.create({
          data: {
            userId: user.id,
            issueId,
            direction: 'CONTRIBUTE',
          },
        });

        // Upsert into saved issues
        await tx.savedIssue.upsert({
          where: { userId_issueId: { userId: user.id, issueId } },
          update: {},
          create: { userId: user.id, issueId },
        });

        // Initialize contribution state
        await tx.contribution.upsert({
          where: { userId_issueId: { userId: user.id, issueId } },
          update: {},
          create: {
            userId: user.id,
            issueId,
            status: 'OPENED',
          },
        });
      });

      // Award XP for opening/initiating a contribution (+25 XP)
      const res = await addXp(user.id, 'OPEN_ISSUE');
      if (res) updatedUser = res;
    } else if (direction === 'SAVE') {
      // 3. SAVE action: Save bookmark only
      await db.savedIssue.upsert({
        where: { userId_issueId: { userId: user.id, issueId } },
        update: {},
        create: { userId: user.id, issueId },
      });

      // Award XP for saving (+10 XP)
      const res = await addXp(user.id, 'SAVE_ISSUE');
      if (res) updatedUser = res;
    }

    return NextResponse.json({
      success: true,
      user: {
        xp: updatedUser.xp,
        rank: updatedUser.rank,
        streak: updatedUser.streak,
      },
    });
  } catch (error: any) {
    // Check for unique constraint violation (duplicate swipe)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already swiped on this issue' }, { status: 409 });
    }
    return NextResponse.json(
      { error: `Swipe registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}
