// API: undetectable conversion (人性化處理)
// ✅ 支援 Undetectable.AI 官方 API（設定 UNDETECTABLE_AI_API_KEY）或內建 LLM
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM, mapMode } from '@/lib/ai';
import { deductCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import { stripAiTemplatePhrases, protectAcademicTokens, unprotectAcademicTokens } from '@/lib/academicHumanizer';

type ResBody =
  | { result?: string; humanized?: string; resultZh?: string; humanizedZh?: string; remainingCredits?: number; error?: string; engine?: 'undetectable' | 'llm' }
  | { hasUndetectable: boolean; engines: string[] };

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
      model: lang === 'en' ? 'v11sr' : 'v2', // v11sr = best for English (slower, best humanization); v2 = all languages
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

  // ✅ GET: 回傳可用的人性化引擎
  if (req.method === 'GET') {
    const udApiKey = process.env.UNDETECTABLE_AI_API_KEY?.trim();
    return res.status(200).json({
      hasUndetectable: !!udApiKey,
      engines: udApiKey ? ['undetectable', 'llm'] : ['llm'],
    });
  }

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
    humanizeEngine = 'auto', // ✅ 'undetectable' | 'llm' | 'auto'：由前端選擇
    rehumanize = false, // ✅ 重新人性化：要求更大幅度改動，避免輸出幾乎相同
  } = (req.body ?? {}) as Record<string, any>;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '請提供要優化的文本' });
  }

  // ✅ 預處理：移除 AI 模板句（In recent times, This essay posits 等），Undetectable.AI 不依賴 prompt
  const inputText = stripAiTemplatePhrases(text.trim());

  const lang: 'zh' | 'en' =
    language === 'zh' || language === 'en' ? language : detectLang(inputText);

  const udApiKey = process.env.UNDETECTABLE_AI_API_KEY?.trim();
  const useUndetectable = humanizeEngine === 'undetectable'
    ? !!udApiKey
    : humanizeEngine === 'llm'
      ? false
      : !!udApiKey; // auto: 有 key 就用

  if (humanizeEngine === 'undetectable' && !udApiKey) {
    return res.status(400).json({ error: 'Undetectable.AI 未設定（需設定 UNDETECTABLE_AI_API_KEY）' });
  }

  // ✅ 若選擇使用 Undetectable.AI 且已設定 API Key
  if (useUndetectable && udApiKey) {
    try {
      let result = await humanizeViaUndetectableAI(inputText, udApiKey, lang);
      result = stripAiTemplatePhrases(result); // 後處理：Undetectable.AI 可能保留模板句
      let resultZh: string | undefined;
      let resultEn: string | undefined;
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
      if (generateBoth && lang === 'zh' && result) {
        try {
          const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const tr = await fetch(`${base}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: result, targetLang: 'en' }),
          });
          const trData = await tr.json();
          if (tr.ok && trData?.translated?.trim()) resultEn = trData.translated;
        } catch (_) {}
      }
      return res.status(200).json({
        result,
        humanized: result,
        resultZh: resultZh,
        humanizedZh: resultZh,
        resultEn: resultEn,
        remainingCredits: deduct.remainingCredits,
        engine: 'undetectable',
      });
    } catch (err: any) {
      const msg = String(err?.message ?? '');
      console.error('[undetectable] Undetectable.AI API failed:', msg);
      // ✅ 餘額不足時自動 fallback 到 LLM，不報錯
      if (/餘額不足|Insufficient credits/i.test(msg)) {
        console.log('[undetectable] Undetectable.AI 餘額不足，改用 LLM');
        // 繼續執行下方 LLM 流程
      } else {
        return res.status(500).json({
          error: msg || (lang === 'zh' ? '人性化失敗' : 'Humanization failed'),
        });
      }
    }
  }

  // 學術人性化 system prompt（結構保護版：保留段落、標題、連接詞、引用）
  const systemHumanizeZH = `你是學術人性化專家。

目標：產出具有「控制性統計不規則」與「智識真實性」的文本，但必須保留原文結構。

【不可改動（務必逐字保留）】
1) 章節標題與編號（例如「1. Introduction」「2. Body Paragraph 1」）不可改。
2) 章節順序不可更動。
3) 段落分隔不可更動：不可合併段落、不可拆段落。
4) 引用與佔位符必須原樣保留且位置不變：
   - 方括號：[ADD SOURCE]、[1] 等
   - 括號引用：(Author, Year) 等
   - DOI、URL、任何參考標記

【連接詞】
- 若原文有「First/Second/Furthermore/In conclusion」等連接詞，必須保留。
- 如需補充，只能少量補（每段最多 1 個），但不可刪除原有連接詞。

【禁止】
- 不可杜撰來源、數據或引用。
- 不可刪除任何引用佔位符。

【風格】
- 可加入適度限制語氣（例如「可能」「在某種程度上」），但避免過量。
- 允許適度句長變化，但不可改變原意。
- 移除 AI 模板句（如「近年來」「本文將討論」），改為直接論述。

只輸出改寫後正文，不要附加說明。`;

  const systemHumanizeEN = `You are an academic humanization specialist.

Goal: produce text with controlled statistical irregularity and intellectual authenticity, while preserving the original structure.

NON-NEGOTIABLE FORMAT RULES (must preserve verbatim):
1) Keep all section headings and numbering exactly (e.g., "1. Introduction", "2. Body Paragraph 1").
2) Keep the order of sections unchanged.
3) Keep paragraph breaks unchanged: do NOT merge or split paragraphs.
4) Preserve citations and placeholders exactly and in place:
   - Square brackets: [ADD SOURCE], [1], [Smith, 2020]
   - Parenthetical citations: (Smith, 2020)
   - DOIs, URLs, and any reference markers.

TRANSITIONS:
- If the input contains connectors like "First,", "Second,", "Furthermore,", "In conclusion,", keep them.
- You may add at most 1 connector per paragraph if necessary for logic, but do not delete existing ones.

FORBIDDEN:
- Do not invent sources, statistics, or citations.
- Do not remove any citation placeholders.

STYLE:
- Use measured academic hedging when appropriate (e.g., "may", "appears to", "is contingent upon") without overusing it.
- Moderate sentence-length variation is allowed, but meaning must remain intact.
- Remove AI template phrases ("In recent years", "This essay will discuss") and replace with direct claims.

Output ONLY the rewritten text. No commentary.`;

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

  const rehumanizeHint = rehumanize
    ? (lang === 'zh'
      ? '\n\n【重要】這是重新人性化，必須對文本做「明顯改動」：改寫句式、調整結構、增加 hedging，不可僅改動少數詞彙。輸出必須與原文有明顯差異。'
      : '\n\n【CRITICAL】This is RE-HUMANIZATION. You MUST make SUBSTANTIAL changes: rewrite sentences, alter structure, add hedging. Do NOT return nearly identical text. Output must be visibly different from the input.')
    : '';

  // ✅ 保護標題、引用、佔位符，避免 LLM 改動
  const protectedInput = protectAcademicTokens(inputText);
  const protectHint = lang === 'zh'
    ? '\n\n【重要】⟦⟦...⟧⟧ 內文字不可修改、不可移動，必須逐字保留。'
    : '\n\nCRITICAL: Do not modify or move any text inside ⟦⟦ ... ⟧⟧. Keep it verbatim.';

  // 构建用户提示
  const userPrompt = lang === 'zh'
    ? `請依學術人性化規則改寫以下文本。保留結構、連接詞與引用。${lengthInstruction}${avoidPatterns}${rehumanizeHint}${protectHint}\n\n【原文】\n${protectedInput}`
    : `Rewrite the following text under the rules above. Preserve structure, connectors, and citations.${lengthInstruction}${avoidPatterns}${rehumanizeHint}${protectHint}\n\n【Original】\n${protectedInput}`;

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

    let result = unprotectAcademicTokens(humanized || '');
    result = stripAiTemplatePhrases(result) || (lang === 'zh' ? '⚠️ 人性化處理失敗' : '⚠️ Humanization failed');
    
    let resultZh: string | undefined;
    let resultEn: string | undefined;
    
    // 英文人性化 → 翻譯成中文
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
      } catch (err) {
        console.error('[humanization zh translate failed]', err);
      }
    }
    
    // 中文人性化 → 翻譯成英文
    if (generateBoth && lang === 'zh' && result) {
      try {
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const tr = await fetch(`${base}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: result, targetLang: 'en' }),
        });
        const trData = await tr.json();
        if (tr.ok && trData?.translated?.trim()) resultEn = trData.translated;
      } catch (err) {
        console.error('[humanization en translate failed]', err);
      }
    }

    return res.status(200).json({
      result,
      humanized: result,
      resultZh: resultZh,
      humanizedZh: resultZh,
      resultEn: resultEn,
      remainingCredits: deduct.remainingCredits,
      engine: 'llm',
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
        let result2 = unprotectAcademicTokens(humanized2 || '');
        result2 = stripAiTemplatePhrases(result2) || (lang === 'zh' ? '⚠️ 人性化處理失敗' : '⚠️ Humanization failed');
        return res.status(200).json({
          result: result2,
          humanized: result2,
          remainingCredits: deduct.remainingCredits,
          engine: 'llm',
        });
      } catch (e: any) {
        console.error('[undetectable fallback failed]', e?.message);
      }
    }

    const errorMsg = err?.message || (lang === 'zh' ? '未知錯誤' : 'Unknown error');
    return res.status(500).json({ error: errorMsg });
  }
}
