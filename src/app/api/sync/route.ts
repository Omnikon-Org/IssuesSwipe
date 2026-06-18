import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { syncIssuesFromGitHub } from '@/lib/github';

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncIssuesFromGitHub();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
