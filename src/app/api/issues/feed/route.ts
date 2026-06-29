import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateMatchScore } from '@/lib/matching';
import type { Issue, Repository } from '@prisma/client';

type IssueWithRepo = Issue & { repository: Repository };

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filterLang = searchParams.get('language');
  const filterDiff = searchParams.get('difficulty');
  const filterMaxStars = searchParams.get('stars');
  const filterTags = searchParams.get('tags'); // comma-separated list of topics/tags

  try {
    const maxStars = filterMaxStars ? parseInt(filterMaxStars) : null;
    const requestedTags = filterTags ? filterTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    // 1. Fetch issues the user hasn't swiped on yet
    const rawIssues: IssueWithRepo[] = await db.issue.findMany({
      where: {
        swipes: {
          none: {
            userId: user.id,
          },
        },
        // Apply optional database filters
        ...(filterDiff ? { difficulty: filterDiff } : {}),
        ...(maxStars !== null
          ? {
              repository: {
                stars: {
                  lte: maxStars,
                },
              },
            }
          : {}),
      },
      include: {
        repository: true,
      },
    });

    // 2. Compute scores and map structures
    let scoredIssues = rawIssues.map((issue: IssueWithRepo) => {
      const matchScore = calculateMatchScore(user, issue);
      return {
        ...issue,
        labels: JSON.parse(issue.labels || '[]'),
        matchScore,
      };
    });

    // 3. Apply optional programming language filter
    if (filterLang) {
      scoredIssues = scoredIssues.filter(
        (issue) =>
          issue.repository.language?.toLowerCase() === filterLang.toLowerCase()
      );
    }

    // 4. Apply optional topic/tag filter on issue labels
    if (requestedTags.length > 0) {
      scoredIssues = scoredIssues.filter((issue) => {
        let issueLabels: string[] = [];
        try {
          issueLabels = typeof issue.labels === 'string' ? JSON.parse(issue.labels) : issue.labels || [];
        } catch (e) {
          // ignore parsing error
        }
        const lowerIssueLabels = issueLabels.map(l => l.toLowerCase());
        // Match if ANY requested tags are present in the issue labels
        return requestedTags.some(tag => lowerIssueLabels.includes(tag));
      });
    }

    // 5. Sort by matchScore descending (highest match first)
    scoredIssues.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json(scoredIssues);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch issue feed: ${message}` },
      { status: 500 }
    );
  }
}
