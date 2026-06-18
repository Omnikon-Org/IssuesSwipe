import { db } from './db';

const XP_MAP = {
  SAVE_ISSUE: 10,
  OPEN_ISSUE: 25,
  SUBMIT_PR: 100,
  MERGE_PR: 250,
};

const RANKS = [
  { name: 'New Contributor', minXp: 0, maxXp: 100 },
  { name: 'Issue Hunter', minXp: 101, maxXp: 500 },
  { name: 'PR Warrior', minXp: 501, maxXp: 1500 },
  { name: 'Merge Machine', minXp: 1501, maxXp: 5000 },
  { name: 'Open Source Legend', minXp: 5001, maxXp: Infinity },
];

export function getRankFromXp(xp: number): string {
  const rank = RANKS.find(r => xp >= r.minXp && xp <= r.maxXp);
  return rank ? rank.name : 'New Contributor';
}

export function getRankProgress(xp: number) {
  const currentRankIndex = RANKS.findIndex(r => xp >= r.minXp && xp <= r.maxXp);
  if (currentRankIndex === -1) return { current: 0, next: 100, percent: 0 };
  
  const current = RANKS[currentRankIndex];
  if (current.maxXp === Infinity) {
    return { current: current.minXp, next: current.minXp, percent: 100 };
  }
  
  const range = current.maxXp - current.minXp;
  const relativeXp = xp - current.minXp;
  return {
    current: xp,
    next: current.maxXp + 1,
    percent: Math.min(100, Math.round((relativeXp / range) * 100)),
  };
}

export async function addXp(
  userId: string,
  action: 'SAVE_ISSUE' | 'OPEN_ISSUE' | 'SUBMIT_PR' | 'MERGE_PR'
) {
  const amount = XP_MAP[action] || 0;
  if (amount === 0) return null;

  return db.$transaction(async (tx) => {
    // 1. Get the user
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    // 2. Create the XP Transaction
    await tx.xPTransaction.create({
      data: {
        userId,
        amount,
        action,
      },
    });

    // 3. Calculate new XP and Rank
    const newXp = user.xp + amount;
    const newRank = getRankFromXp(newXp);

    // 4. Calculate Streak
    let newStreak = user.streak;
    const lastTx = await tx.xPTransaction.findFirst({
      where: {
        userId,
        NOT: {
          // exclude the transaction we just created
          createdAt: {
            gte: new Date(Date.now() - 5000), // within last 5 seconds
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastTx) {
      const lastDate = new Date(lastTx.createdAt);
      const today = new Date();
      
      // Calculate date difference in days
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active yesterday, increment streak
        newStreak += 1;
      } else if (diffDays > 1) {
        // Broke streak, reset to 1
        newStreak = 1;
      }
      // If diffDays === 0 (already did something today), streak remains the same
    } else {
      // First action ever
      newStreak = 1;
    }

    // 5. Update user profile
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        rank: newRank,
        streak: newStreak,
      },
    });

    return updatedUser;
  });
}
