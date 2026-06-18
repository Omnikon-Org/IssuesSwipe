import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addXp } from '@/lib/xp';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const language = searchParams.get('language') || '';

  try {
    const savedMatches = await db.savedIssue.findMany({
      where: {
        userId: user.id,
        issue: {
          OR: [
            { title: { contains: search } },
            { repository: { name: { contains: search } } },
            { repository: { owner: { contains: search } } },
          ],
          ...(language
            ? { repository: { language: { equals: language } } }
            : {}),
        },
      },
      include: {
        issue: {
          include: {
            repository: true,
            contributions: {
              where: { userId: user.id },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Clean up structure for response
    const formattedMatches = savedMatches.map((match) => {
      const contribution = match.issue.contributions[0] || null;
      return {
        savedId: match.id,
        savedAt: match.createdAt,
        issue: {
          id: match.issue.id,
          title: match.issue.title,
          description: match.issue.description,
          url: match.issue.url,
          number: match.issue.number,
          difficulty: match.issue.difficulty,
          estimatedTime: match.issue.estimatedTime,
          labels: JSON.parse(match.issue.labels || '[]'),
          repository: match.issue.repository,
          contributionStatus: contribution ? contribution.status : 'NONE',
          prUrl: contribution ? contribution.prUrl : null,
        },
      };
    });

    return NextResponse.json(formattedMatches);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to fetch saved matches: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issueId } = await request.json();

    if (!issueId) {
      return NextResponse.json({ error: 'Issue ID required' }, { status: 400 });
    }

    // Remove from saved issue
    await db.savedIssue.deleteMany({
      where: {
        userId: user.id,
        issueId,
      },
    });

    return NextResponse.json({ success: true, message: 'Match removed.' });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to delete match: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { issueId, status, prUrl } = await request.json();

    if (!issueId || !['SUBMITTED', 'MERGED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let updatedUser = user;

    await db.$transaction(async (tx) => {
      // 1. Update contribution
      await tx.contribution.updateMany({
        where: {
          userId: user.id,
          issueId,
        },
        data: {
          status,
          ...(prUrl ? { prUrl } : {}),
        },
      });
    });

    // 2. Award XP corresponding to the workflow advancement
    if (status === 'SUBMITTED') {
      const res = await addXp(user.id, 'SUBMIT_PR');
      if (res) updatedUser = res;
    } else if (status === 'MERGED') {
      const res = await addXp(user.id, 'MERGE_PR');
      if (res) updatedUser = res;
    }

    return NextResponse.json({
      success: true,
      status,
      user: {
        xp: updatedUser.xp,
        rank: updatedUser.rank,
        streak: updatedUser.streak,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to update contribution status: ${error.message}` },
      { status: 500 }
    );
  }
}
