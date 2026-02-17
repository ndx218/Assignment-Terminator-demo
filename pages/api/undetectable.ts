// API: undetectable conversion (人性化處理)
// ✅ 支援 Undetectable.AI 官方 API（設定 UNDETECTABLE_AI_API_KEY）或內建 LLM
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM, mapMode } from '@/lib/ai';
import { deductCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

type ResBody = { result?: string; humanized?: string; resultZh?: string; humanizedZh?: string; remainingCredits?: number; error?: string };

function detectLang(text: string): 'zh' | 'en' {
  return /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en';
}

/** 使用 Undetectable.AI 官方 Humanizer API */
async function humanizeViaUndetectableAI(
  content: string,
  apiKey: string,
  lang: 'zh' | 'en'
): Promise<string> {
  const submitRes = await fetch('https://humanize.undetectable.ai/submit', {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: content.slice(0, 50000),
      readability: 'University',
      purpose: 'Essay',
      strength: 'More Human',
      model: lang === 'en' ? 'v11' : 'v2', // v11 best for English, v2 supports all languages
    }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) {
    const err = submitData?.error || submitData?.message || submitRes.statusText;
    throw new Error(err === 'Insufficient credits' ? 'Undetectable.AI 餘額不足' : String(err));
  }
  const docId = submitData?.id;
  if (!docId) throw new Error('Undetectable.AI 未回傳 document id');

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const docRes = await fetch('https://humanize.undetectable.ai/document', {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId }),
    });
    const docData = await docRes.json();
    const output = docData?.output?.trim();
    if (output) return output;
  }
  throw new Error('Undetectable.AI 處理逾時');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const deduct = await deductCredits(req, res);
  if (!deduct.ok) return;

  const {
    text,
    mode = 'free',
    language,
    generateBoth = false, // ✅ 是否同时生成中英文版本
    wordCount, // ✅ 目標字數（人性化時勿縮短）
  } = (req.body ?? {}) as Record<string, any>;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '請提供要優化的文本' });
  }

  const lang: 'zh' | 'en' =
    language === 'zh' || language === 'en' ? language : detectLang(text);

  const udApiKey = process.env.UNDETECTABLE_AI_API_KEY?.trim();

  // ✅ 若已設定 Undetectable.AI API Key，優先使用官方 API
  if (udApiKey) {
    try {
      const result = await humanizeViaUndetectableAI(text.trim(), udApiKey, lang);
      let resultZh: string | undefined;
      if (generateBoth && lang === 'en' && result) {
        try {
          const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const tr = await fetch(`${base}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: result, targetLang: 'zh' }),
          });
          const trData = await tr.json();
          if (tr.ok && trData?.translated?.trim()) resultZh = trData.translated;
        } catch (_) {}
      }
      return res.status(200).json({
        result,
        humanized: result,
        resultZh: resultZh,
        humanizedZh: resultZh,
        remainingCredits: deduct.remainingCredits,
      });
    } catch (err: any) {
      console.error('[undetectable] Undetectable.AI API failed:', err?.message);
      return res.status(500).json({
        error: err?.message || (lang === 'zh' ? '人性化失敗' : 'Humanization failed'),
      });
    }
  }

  // 构建人性化处理的系统提示（內建 LLM fallback）
  const systemHumanizeZH = `你是一位專業的文本人性化處理專家。

請對提供的文本進行優化，使其更難被 AI 偵測工具識別，同時保持：
1. 內容的核心含義和論點完全一致
2. 學術語氣和專業性
3. 段落結構和邏輯順序
4. 原有的標題和格式（如果有）

優化策略：
- 使用更自然的語句表達方式
- 適當調整句式結構，增加變化
- 使用更口語化但保持學術規範的措辭
- 避免過於機械或重複的表達模式
- 保持專業術語的準確性

輸出格式：
直接輸出優化後的文本，不要添加任何額外的說明、標記或註釋。`;

  const systemHumanizeEN = `You are a professional text humanization expert.

Please optimize the provided text to make it harder for AI detection tools to identify, while maintaining:
1. The core meaning and arguments completely unchanged
2. Academic tone and professionalism
3. Paragraph structure and logical order
4. Original headings and formatting (if any)

Optimization strategies:
- Use more natural sentence expressions
- Appropriately adjust sentence structures for variety
- Use more conversational but academically appropriate phrasing
- Avoid overly mechanical or repetitive expression patterns
- Maintain accuracy of technical terms

Output format:
Directly output the optimized text without any additional explanations, markers, or annotations.`;

  const system = lang === 'zh' ? systemHumanizeZH : systemHumanizeEN;

  // ✅ 從 AI 資料庫取得近期高風險句型，提示避免
  let avoidPatterns = '';
  try {
    const rows = await prisma.aiSentence.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { text: true },
    });
    if (rows.length > 0) {
      const samples = rows.map((r) => r.text?.slice(0, 80)).filter(Boolean);
      if (samples.length > 0) {
        avoidPatterns = lang === 'zh'
          ? `\n\n【避免以下 AI 風格句型】請勿使用與以下類似的表達：\n${samples.map((s) => `- "${s}..."`).join('\n')}`
          : `\n\n【AVOID these AI-like patterns】Do not use similar phrasing:\n${samples.map((s) => `- "${s}..."`).join('\n')}`;
      }
    }
  } catch (_) {
    // AiSentence 表可能尚未 migration，忽略
  }

  // ✅ 若有目標字數，強調勿縮短（結論等段落常被縮短）
  const targetWc = wordCount ? Number(wordCount) : null;
  const lengthInstruction = targetWc
    ? (lang === 'zh'
      ? `\n\n【重要】目標約${targetWc}字，請勿縮短。若原文不足，請擴充至約${targetWc}字。`
      : `\n\n【IMPORTANT】Target ~${targetWc} words. Do NOT shorten. If input is shorter, expand to ~${targetWc} words.`)
    : '';

  // 构建用户提示
  const userPrompt = lang === 'zh'
    ? `請對以下文本進行人性化處理，使其更難被 AI 偵測，但保持內容與語意一致。${lengthInstruction}${avoidPatterns}\n\n${text}`
    : `Please humanize the following text to make it harder for AI detection while keeping the content and meaning consistent.${lengthInstruction}${avoidPatterns}\n\n${text}`;

  try {
    const llmOpts = mapMode('review', mode);

    const humanized = await callLLM(
      [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      {
        ...llmOpts,
        title: process.env.OPENROUTER_TITLE ?? 'Assignment Terminator',
        referer: process.env.OPENROUTER_REFERER ?? process.env.NEXT_PUBLIC_APP_URL,
      }
    );

    const result = humanized || (lang === 'zh' ? '⚠️ 人性化處理失敗' : '⚠️ Humanization failed');
    
    let resultZh: string | undefined;
    
    // 如果要求同时生成中文版本，且当前是英文版本，则生成中文翻译
    if (generateBoth && lang === 'en' && result) {
      try {
        const systemZh = systemHumanizeZH;
        const userPromptZh = `請對以下文本進行人性化處理，使其更難被 AI 偵測，但保持內容與語意一致：\n\n${result}`;
        
        resultZh = await callLLM(
          [
            { role: 'system', content: systemZh },
            { role: 'user', content: userPromptZh },
          ],
          {
            ...llmOpts,
            title: process.env.OPENROUTER_TITLE ?? 'Assignment Terminator',
            referer: process.env.OPENROUTER_REFERER ?? process.env.NEXT_PUBLIC_APP_URL,
          }
        ) || '';
      } catch (err) {
        console.error('[humanization zh generation failed]', err);
        // 如果中文生成失败，继续返回英文版本
      }
    }

    return res.status(200).json({
      result,
      humanized: result, // 向后兼容
      resultZh: resultZh,
      humanizedZh: resultZh,
      remainingCredits: deduct.remainingCredits,
    });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    console.error('[undetectable]', { mode, err: msg });

    // fallback
    if (msg.startsWith('OPENROUTER_HTTP_')) {
      try {
        const humanized2 = await callLLM(
          [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
          {
            model: process.env.OPENROUTER_GPT35_MODEL ?? 'openai/gpt-3.5-turbo',
            temperature: 0.7,
            timeoutMs: 45_000,
            title: 'Humanization Fallback',
            referer: process.env.NEXT_PUBLIC_APP_URL,
          }
        );
        const result2 = humanized2 || (lang === 'zh' ? '⚠️ 人性化處理失敗' : '⚠️ Humanization failed');
        return res.status(200).json({
          result: result2,
          humanized: result2,
          remainingCredits: deduct.remainingCredits,
        });
      } catch (e: any) {
        console.error('[undetectable fallback failed]', e?.message);
      }
    }

    const errorMsg = err?.message || (lang === 'zh' ? '未知錯誤' : 'Unknown error');
    return res.status(500).json({ error: errorMsg });
  }
}
