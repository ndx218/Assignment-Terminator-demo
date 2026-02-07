// 暫時性 API：每次調用 +50 點，可無限使用（用於測試）
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const BONUS_POINTS = 50;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST' });
  }

  const session = await getAuthSession(req, res);
  if (!session?.user?.id) {
    return res.status(401).json({ error: '請先登入' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: BONUS_POINTS } },
      select: { credits: true },
    });

    return res.status(200).json({
      success: true,
      added: BONUS_POINTS,
      credits: updated.credits ?? 0,
    });
  } catch (err: any) {
    console.error('[add-50-points]', err);
    return res.status(500).json({ error: err?.message || '添加失敗' });
  }
}
