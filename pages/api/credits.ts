import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/authOptions';
import { prisma } from '@/lib/prisma';

/** 取得當前用戶點數，用於頁面載入時同步 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: '未登入' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    const credits = user?.credits ?? 0;
    return res.status(200).json({ credits });
  } catch (e) {
    console.error('[credits]', e);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
}
