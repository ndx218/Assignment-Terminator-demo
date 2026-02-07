// lib/credits.ts - 積分扣款輔助
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { USE_COST } from '@/lib/points';

export type DeductResult = { ok: true; userId: string; remainingCredits: number } | { ok: false; status: number; body: object };

/**
 * 檢查登入並扣款，每次使用扣 1 分。
 * 若成功返回 { ok: true, userId, remainingCredits }
 * 若失敗直接 res.status().json() 並返回 { ok: false, status, body }
 */
export async function deductCredits(
  req: NextApiRequest,
  res: NextApiResponse,
  amount: number = USE_COST
): Promise<DeductResult> {
  const session = await getAuthSession(req, res);
  if (!session?.user?.id) {
    res.status(401).json({ error: '請先登入後再使用' });
    return { ok: false, status: 401, body: { error: '請先登入後再使用' } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  if (!user) {
    res.status(404).json({ error: '使用者不存在' });
    return { ok: false, status: 404, body: { error: '使用者不存在' } };
  }

  const current = user.credits ?? 0;
  if (current < amount) {
    res.status(402).json({
      error: `點數不足：需 ${amount} 點，剩餘 ${current} 點`,
      needCredits: amount,
      remainingCredits: current,
    });
    return { ok: false, status: 402, body: { error: '點數不足' } };
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { credits: { decrement: amount } },
    select: { credits: true },
  });

  const remainingCredits = updated.credits ?? 0;

  // 記錄交易
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount: -amount,
      type: 'USAGE',
      description: `功能使用 - 扣 ${amount} 點`,
      performedBy: session.user.id,
    },
  });

  return { ok: true, userId: session.user.id, remainingCredits };
}
