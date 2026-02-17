// API: 儲存／取得 AI 偵測到的高風險句子，用於改進人性化
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type ResBody = { saved?: boolean; sentences?: { text: string; aiPercent?: number }[]; error?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    const { text, aiPercent, source = 'llm' } = (req.body ?? {}) as Record<string, any>;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing text' });
    }
    try {
      await prisma.aiSentence.create({
        data: {
          text: text.trim().slice(0, 2000),
          aiPercent: typeof aiPercent === 'number' ? aiPercent : null,
          source: String(source || 'llm'),
        },
      });
      return res.status(200).json({ saved: true });
    } catch (e: any) {
      console.error('[ai-sentences] save failed', e?.message);
      return res.status(500).json({ error: e?.message || '儲存失敗' });
    }
  }

  if (req.method === 'GET') {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || 20), 10) || 20, 50);
      const rows = await prisma.aiSentence.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { text: true, aiPercent: true },
      });
      return res.status(200).json({
        sentences: rows.map((r) => ({ text: r.text, aiPercent: r.aiPercent ?? undefined })),
      });
    } catch (e: any) {
      console.error('[ai-sentences] fetch failed', e?.message);
      return res.status(500).json({ error: e?.message || '取得失敗' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
