// /pages/api/translate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM } from '@/lib/ai';

type ResBody = { translated: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResBody>
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { text, targetLang = 'zh' } = (req.body ?? {}) as Record<string, any>;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  if (targetLang !== 'zh' && targetLang !== 'en') {
    return res.status(400).json({ error: 'targetLang must be "zh" or "en"' });
  }

  try {
    const systemPrompt = targetLang === 'zh'
      ? `你是一位專業的學術翻譯專家。請將以下英文學術寫作翻譯成中文。

【極重要】輸出必須「全部為中文」。不可輸出英文原文。不可混雜英文段落。若無法翻譯，請回傳空字串。
- 學術術語可保留英文（如 App Store Optimization）並在括號內加中文註解
- 其餘內容必須為中文

保持：
1. 所有評分數字和格式不變
2. 學術術語準確
3. 結構和標題格式完全一致
4. 引用原文的引號內容不變
5. 語氣專業但鼓勵`
      : `You are a professional academic translator. Translate the following Chinese academic writing into English.

CRITICAL: Output MUST be in English. Do NOT output Chinese. If you cannot translate, return empty string.

Maintaining:
1. All score numbers and format unchanged
2. Academic terminology accuracy
3. Structure and heading format exactly the same
4. Quoted original text unchanged
5. Professional but encouraging tone`;

    let translated = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      {
        model: process.env.OPENROUTER_GPT4_MODEL ?? 'openai/gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 8000,
        timeoutMs: 60000,
        title: process.env.OPENROUTER_TITLE ?? 'Assignment Terminator',
        referer: process.env.OPENROUTER_REFERER ?? process.env.NEXT_PUBLIC_APP_URL,
      }
    );

    let result = (translated || '').trim();

    // 若翻譯為中文但結果主要為英文，重試一次（避免中文區顯示英文）
    if (targetLang === 'zh' && result) {
      const zhCharCount = (result.match(/[\u4e00-\u9fff]/g) || []).length;
      const totalCharCount = result.replace(/\s/g, '').length;
      const zhRatio = totalCharCount > 0 ? zhCharCount / totalCharCount : 0;
      if (zhRatio < 0.3) {
        // 中文字少於 30%，可能翻譯失敗，重試
        const retryPrompt = `你必須將以下英文學術文本「完整翻譯成中文」。輸出必須以中文為主，不可直接回傳英文。\n\n原文：\n${text}`;
        try {
          const retry = await callLLM(
            [
              { role: 'system', content: '你只輸出中文翻譯，不輸出任何英文。將用戶提供的英文學術文本完整翻譯成中文。' },
              { role: 'user', content: retryPrompt },
            ],
            {
              model: process.env.OPENROUTER_GPT4_MODEL ?? 'openai/gpt-4o-mini',
              temperature: 0.2,
              maxTokens: 8000,
              timeoutMs: 60000,
              title: process.env.OPENROUTER_TITLE ?? 'Assignment Terminator',
              referer: process.env.OPENROUTER_REFERER ?? process.env.NEXT_PUBLIC_APP_URL,
            }
          );
          const retryResult = (retry || '').trim();
          const retryZhCount = (retryResult.match(/[\u4e00-\u9fff]/g) || []).length;
          const retryTotal = retryResult.replace(/\s/g, '').length;
          if (retryTotal > 0 && retryZhCount / retryTotal >= 0.3) result = retryResult;
        } catch (_) {}
      }
    }

    const validZh = targetLang !== 'zh' || /[\u4e00-\u9fff]/.test(result);
    return res.status(200).json({
      translated: validZh ? (result || text) : '',
    });
  } catch (err: any) {
    console.error('[translate]', { err: err?.message });
    return res.status(500).json({ error: err?.message || '翻譯失敗' });
  }
}



