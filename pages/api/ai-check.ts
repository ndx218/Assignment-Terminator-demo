// API: AI detection check - 使用 GPTZero 專業檢測
// Returns 0-100 (0 = human-like, 100 = AI-like)
// 需設定環境變數 GPTZERO_API_KEY，取得 API Key: https://app.gptzero.me/api
import type { NextApiRequest, NextApiResponse } from 'next';
import { deductCredits } from '@/lib/credits';
import { callLLM } from '@/lib/ai';

type ResBody = {
  aiPercent?: number;
  humanPercent?: number;
  source?: 'gptzero' | 'llm';
  documentClassification?: string;
  error?: string;
  remainingCredits?: number;
};

/** 從 GPTZero API 回應解析 AI 百分比 */
function parseGptZeroAiPercent(data: any): number | null {
  if (!data || typeof data !== 'object') return null;
  // class_probabilities: { AI?: number, ai?: number, human?: number, mixed?: number }
  const probs = data.class_probabilities ?? data.classProbabilities ?? {};
  const aiProb = probs.AI ?? probs.ai ?? probs.AI_ONLY;
  if (typeof aiProb === 'number') return Math.round(aiProb * 100);
  // overall_score / overall_burstiness (0-1)
  const score = data.overall_score ?? data.overallScore ?? data.completely_generated_probability;
  if (typeof score === 'number') return Math.round(score * 100);
  // document_classification 映射
  const classification = (data.document_classification ?? data.documentClassification ?? '').toUpperCase();
  if (classification === 'AI_ONLY' || classification === 'AI') return 95;
  if (classification === 'HUMAN_ONLY' || classification === 'HUMAN') return 5;
  if (classification === 'MIXED') return 50;
  return null;
}

/** 呼叫 GPTZero API */
async function callGptZero(document: string): Promise<{ aiPercent: number; classification?: string }> {
  const apiKey = process.env.GPTZERO_API_KEY?.trim();
  if (!apiKey) throw new Error('GPTZERO_API_KEY 未設定，請至 https://app.gptzero.me/api 取得 API Key');

  const res = await fetch('https://api.gptzero.me/v2/predict/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      document: document.slice(0, 150000), // GPTZero 有字數限制
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? data?.detail ?? `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  const aiPercent = parseGptZeroAiPercent(data);
  const classification = data.document_classification ?? data.documentClassification;

  if (aiPercent === null) {
    throw new Error('無法解析 GPTZero 回應格式');
  }

  return { aiPercent: Math.min(100, Math.max(0, aiPercent)), classification };
}

/** LLM 備援：當無 GPTZero 時使用 */
async function callLlmFallback(text: string, isZh: boolean): Promise<number> {
  const systemPrompt = isZh
    ? `你是一個 AI 文本檢測評估專家。請分析給定的文本，評估其被 GPTZero 等工具判定為 AI 生成的可能性。
輸出格式：僅回覆一個 0-100 的整數。0=幾乎確定為人類撰寫，100=幾乎確定為 AI 生成。`
    : `You are an AI text detection evaluator. Estimate the likelihood GPTZero would flag this as AI-generated (0-100). Reply with ONLY the number.`;

  const result = await callLLM(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: (isZh ? '評估以下文本：\n\n' : 'Estimate:\n\n') + text.slice(0, 4000) },
    ],
    {
      model: process.env.OPENROUTER_GPT4O_MINI_MODEL ?? 'openai/gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 20,
      timeoutMs: 15_000,
      title: 'AI Check',
      referer: process.env.NEXT_PUBLIC_APP_URL,
    }
  );

  const match = result?.match(/\b(\d{1,3})\b/);
  const n = match ? parseInt(match[1], 10) : null;
  return n != null ? Math.min(100, Math.max(0, n)) : 50;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const deduct = await deductCredits(req, res, 0);
  if (!deduct.ok) return;

  const { text } = (req.body ?? {}) as { text?: string };

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '請提供要檢測的文本' });
  }

  const trimmed = text.trim();
  if (trimmed.length < 50) {
    return res.status(400).json({ error: '文本過短，至少需要 50 字元' });
  }

  const isZh = /[\u4e00-\u9fff]/.test(trimmed);

  try {
    // 1. 優先使用 GPTZero 專業檢測
    if (process.env.GPTZERO_API_KEY?.trim()) {
      const { aiPercent, classification } = await callGptZero(trimmed);
      return res.status(200).json({
        aiPercent,
        humanPercent: 100 - aiPercent,
        source: 'gptzero',
        documentClassification: classification,
        remainingCredits: deduct.remainingCredits,
      });
    }

    // 2. 無 GPTZero 時使用 LLM 備援
    const aiPercent = await callLlmFallback(trimmed, isZh);
    return res.status(200).json({
      aiPercent,
      humanPercent: 100 - aiPercent,
      source: 'llm',
      remainingCredits: deduct.remainingCredits,
    });
  } catch (err: any) {
    console.error('[ai-check]', err?.message || err);
    return res.status(500).json({
      error: err?.message || (isZh ? '檢測失敗，請稍後再試' : 'Detection failed'),
    });
  }
}
