// /pages/api/references/rank.ts - AI 從搜尋結果中挑選最相關的參考文獻
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM, mapMode } from '@/lib/ai';

type RefInput = { id: string; title: string; authors?: string; year?: number; source?: string; summary?: string };
type Ok = { rankedIds: string[] };
type Err = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paperTitle, keyword, refs, topN = 3 } = req.body as {
      paperTitle?: string;
      keyword?: string;
      refs?: RefInput[];
      topN?: number;
    };

    if (!refs || !Array.isArray(refs) || refs.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid refs array' });
    }

    if (refs.length <= topN) {
      return res.status(200).json({ rankedIds: refs.map((r) => r.id) });
    }

    const refList = refs
      .slice(0, 15)
      .map(
        (r, i) =>
          `${i + 1}. [${r.id}] ${r.title} | ${r.authors || ''} (${r.year || ''}) | ${(r.summary || '').slice(0, 150)}...`
      )
      .join('\n');

    const prompt = `你是一位學術文獻篩選專家。請根據論文主題和搜尋關鍵詞，從以下文獻中選出最相關的 ${topN} 篇。

論文標題：${paperTitle || '未提供'}
搜尋關鍵詞：${keyword || '未提供'}

候選文獻列表：
${refList}

請只回傳 ${topN} 個文獻的 ID（方括號內的字串），每行一個，按相關度從高到低排序。不要輸出其他內容。`;

    const raw = await callLLM(
      [{ role: 'user', content: prompt }],
      {
        ...mapMode('outline', 'gpt-3.5'),
        temperature: 0.2,
        timeoutMs: 15000,
        title: 'Reference Rank',
      }
    );

    const lines = (raw || '')
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean);

    const idSet = new Set(refs.map((r) => r.id));
    const rankedIds: string[] = [];
    for (const line of lines) {
      const match = line.match(/\[([^\]]+)\]/);
      const id = match ? match[1] : line.trim();
      if (idSet.has(id) && !rankedIds.includes(id)) {
        rankedIds.push(id);
      }
    }

    // 補足未出現在 AI 回覆中的 refs
    for (const r of refs) {
      if (rankedIds.length >= topN) break;
      if (!rankedIds.includes(r.id)) rankedIds.push(r.id);
    }

    return res.status(200).json({ rankedIds: rankedIds.slice(0, topN) });
  } catch (err: any) {
    console.error('[references/rank]', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Ranking failed' });
  }
}
