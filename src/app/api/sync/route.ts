import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { syncIssuesFromGitHub } from '@/lib/github';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let customFilters = {};
    try {
      customFilters = await req.json();
    } catch (e) {
      // Ignored if body is empty or invalid
    }

    const { searchText, languages: customLangs, labels: customLabels, minStars: rawMinStars, maxStars: rawMaxStars } = customFilters as any;

    // Coerce optional star bounds; ignore missing/invalid/negative values.
    const toStar = (v: any): number | undefined => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    };
    const minStars = toStar(rawMinStars);
    const maxStars = toStar(rawMaxStars);

    if (minStars !== undefined && maxStars !== undefined && minStars > maxStars) {
      return NextResponse.json(
        { success: false, message: 'Minimum stars cannot be greater than maximum stars.' },
        { status: 400 }
      );
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const languages = customLangs && customLangs.length > 0 ? customLangs : JSON.parse(dbUser.preferredLanguages || '[]');
    const topics = JSON.parse(dbUser.preferredTopics || '[]');

    const result = await syncIssuesFromGitHub(
      dbUser.githubToken || undefined,
      languages,
      topics,
      searchText,
      customLabels,
      minStars,
      maxStars
    );
    
    // Add notification on successful sync
    if (result.success && result.issuesSynced > 0 && !result.isSimulated) {
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'New Issues Found',
          message: `Found ${result.issuesSynced} new issues matching your tech stack.`,
          type: 'SUCCESS',
          linkUrl: '/swipe'
        }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
