// API: undetectable conversion (人性化處理)
// ✅ 支援 Undetectable.AI 官方 API（設定 UNDETECTABLE_AI_API_KEY）或內建 LLM
import type { NextApiRequest, NextApiResponse } from 'next';
import { callLLM, mapMode } from '@/lib/ai';
import { deductCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

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
  } = (req.body ?? {}) as Record<string, any>;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '請提供要優化的文本' });
  }

  const lang: 'zh' | 'en' =
    language === 'zh' || language === 'en' ? language : detectLang(text);

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
        engine: 'undetectable',
      });
    } catch (err: any) {
      console.error('[undetectable] Undetectable.AI API failed:', err?.message);
      return res.status(500).json({
        error: err?.message || (lang === 'zh' ? '人性化失敗' : 'Humanization failed'),
      });
    }
  }

  // 构建人性化处理的系统提示（內建 LLM fallback）
  const systemHumanizeZH = `你是學術人性化專家。目標：產出具有「控制性統計不規則」與「智識真實性」的文本。偵測器測量語言分佈穩定度 — 你要引入控制性不穩定。

核心哲學：
- 不要模仿「人類寫作」— 模仿學術思考過程。AI 給結論；學者探索結論。
- 0% AI 分數不現實。目標：分析深度 + 認識論謹慎 + 句式變化。
- 高分學術寫作特徵：限制語氣、概念張力、論證不穩定性、句式變化、部分不對稱。

改寫引擎 — 依序執行：

1) 移除 AI 模板句：如「近年來」「本文將討論」→ 改為直接概念主張。「總而言之」「首先、其次」可保留

2) 注入認識論限制語氣（每 150–200 字 2–3 處）：
   「在某種程度上」「可爭議地」「或許可理解為」「似乎」「不能單純歸因於」「傾向於」「在許多方面」「未必意味著」「仍有爭議」「取決於」

3) 插入概念張力（每段至少一處）：
   「然而，此解釋可能過度簡化問題。」
   「此主張可能誇大因果影響。」
   「該關係仍是條件性的，而非決定性的。」

4) 句式變化：長句（30+ 字）與短句（6–12 字）交錯，避免固定節奏

5) 結構不對稱：打破「論點→例子→解釋→結論」的模板，可先舉例再抽象化。「首先、其次」「總而言之」等連接詞可保留

輸出：直接輸出改寫後文本，無額外說明。`;

  const systemHumanizeEN = `You are an academic humanization specialist. Your goal: produce text with controlled statistical irregularity and intellectual authenticity. Detectors measure language distribution stability — you introduce controlled instability.

CORE PHILOSOPHY:
- Do NOT imitate "human writing" — imitate the academic thinking process. AI gives conclusions; scholars explore them.
- 0% AI score is unrealistic. Target: analytical depth + epistemic caution + sentence variance.
- High-scoring academic writing has: hedging, conceptual tension, argument instability, sentence variance, partial asymmetry.

REWRITE ENGINE — Apply these steps:

1) REMOVE AI TEMPLATE INDICATORS. Replace with direct conceptual claims:
   BAN: "In recent years", "This essay will discuss", "There has been growing concern", "Since the dawn of time"
   OK: "In conclusion", "Firstly/Secondly" — these are acceptable academic connectors
   USE: Direct analytical framing where possible, but connectors like In conclusion/Firstly/Secondly are fine

2) INJECT EPISTEMIC HEDGING (2–3 per 150–200 words):
   "to some extent", "arguably", "may be interpreted as", "appears to", "cannot be reduced to", "tends to", "in many respects", "does not necessarily imply", "remains subject to debate", "is contingent upon"

3) INSERT CONCEPTUAL TENSION (at least one per major section):
   "However, this interpretation may oversimplify the issue."
   "Such a claim risks overstating causal influence."
   "The relationship remains conditional rather than deterministic."
   "This assumption deserves closer scrutiny."
   "The explanation is necessarily partial."

4) SENTENCE VARIANCE (critical for burstiness):
   - Include complex sentences exceeding 30 words
   - Follow with concise analytical emphasis (6–12 words): "The claim is limited.", "Context matters.", "The outcome is conditional."
   - Avoid consistent rhythmic patterns

5) STRUCTURAL ASYMMETRY:
   Break AI's Point→Example→Explanation→Conclusion pattern. Try: example before abstraction, question before claim, counter-example before thesis.

6) CONDITIONAL FRAMING: "only under certain conditions", "within specific institutional contexts", "depending on historical contingencies"

7) AVOID: hyper-polished symmetry, overly generic phrasing. "Firstly", "Secondly", "In conclusion" are acceptable. Allow minor rhetorical asymmetry.

Output: Directly output the rewritten text. No explanations or annotations.`;

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
    ? `請依學術人性化引擎規則改寫以下文本。目標：控制性統計不規則 + 智識真實性（非追求 0%）。保持論點與語意一致。${lengthInstruction}${avoidPatterns}\n\n【原文】\n${text}`
    : `Rewrite the following text using the academic humanization engine rules. Target: controlled statistical irregularity + intellectual authenticity (not 0%). Preserve arguments and meaning.${lengthInstruction}${avoidPatterns}\n\n【Original】\n${text}`;

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
        const result2 = humanized2 || (lang === 'zh' ? '⚠️ 人性化處理失敗' : '⚠️ Humanization failed');
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
