/**
 * Academic Humanization Engine — 學術人性化引擎
 *
 * 核心哲學：
 * - 0% 不現實。目標是 statistical irregularity + intellectual authenticity
 * - Detector 抓的是語言分佈穩定度 → 要做的是「控制不穩定」
 * - 模仿「學術思考過程」，而非模仿人類寫作
 *
 * 學術寫作真實特徵：
 * - Hedging（限制語氣）
 * - Conceptual tension（內部批判）
 * - Argument instability（承認不完整）
 * - Sentence variance（節奏變化）
 * - Partial asymmetry（結構不完全對稱）
 */

/** AI 模板句開頭 — 需替換為直接論述（In conclusion, Firstly/Secondly 可保留） */
export const AI_TEMPLATE_PHRASES = [
  'In recent years',
  'In recent times',
  'Since the dawn of time',
  'This essay will',
  'This essay posits',
  'This paper aims to',
  'This paper posits',
  'There has been growing concern',
  'To conclude',
  'It is important to note',
  'It should be noted',
];

/** 替換對：AI 模板 → 學術替代（只替換開頭短語，保留後文） */
const AI_TEMPLATE_REPLACEMENTS: [RegExp | string, string][] = [
  [/\bIn recent years\b,?\s*/gi, 'Historically, '],
  [/\bIn recent times\b,?\s*/gi, 'Historically, '],
  [/\bIn recent decades\b,?\s*/gi, 'Across recent decades, '],
  [/\bSince the dawn of time\b,?\s*/gi, 'Historically, '],
  [/\bThis essay will (?:discuss|explore|examine|analyze) /gi, 'The following explores '],
  [/\bThis essay posits (?:that )?/gi, 'The central argument is that '],
  [/\bThis paper aims to (?:discuss|explore|examine) /gi, 'The following examines '],
  [/\bThis paper posits (?:that )?/gi, 'The central argument is that '],
  [/\bThere has been growing concern (?:about|over|that) /gi, 'The field has increasingly attended to '],
];

/**
 * 移除 AI 模板句，確保人性化前後皆有清理（Undetectable.AI 不依賴 prompt）。
 * 對 Undetectable.AI 與 LLM 皆適用。
 */
export function stripAiTemplatePhrases(text: string): string {
  if (!text || !text.trim()) return text;
  let out = text;
  for (const [pattern, replacement] of AI_TEMPLATE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/** Epistemic hedging — 每 150–200 words 插入 2–3 個 */
export const HEDGING_BANK = [
  'arguably',
  'to some extent',
  'in part',
  'appears to',
  'cannot be explained solely by',
  'may be understood as',
  'tends to reinforce',
  'does not necessarily indicate',
  'remains subject to debate',
  'is frequently assumed to',
  'is contingent upon',
  'in many respects',
  'cannot be reduced to',
];

/** Conceptual tension — 每段至少一個，打破 AI 的完美平衡 */
export const CONCEPTUAL_TENSION_PHRASES = [
  'However, this interpretation may oversimplify the issue.',
  'Such a claim risks overstating causal influence.',
  'The relationship remains conditional rather than deterministic.',
  'This assumption deserves closer scrutiny.',
  'The explanation is necessarily partial.',
  'The argument cannot be universally applied.',
  'The evidence suggests a more nuanced picture.',
  'This framing, while useful, has limitations.',
];

/** Short analytical emphasis — 6–10 字，intellectual compression */
export const SHORT_EMPHASIS_BANK = [
  'The claim is limited.',
  'The effect is uneven.',
  'Context matters.',
  'The pattern is not linear.',
  'The outcome is conditional.',
  'The conclusion is provisional.',
  'Causality is indirect.',
  'The evidence is mixed.',
];

/** Conditional framing */
export const CONDITIONAL_FRAMING = [
  'only under certain conditions',
  'within specific institutional contexts',
  'depending on historical contingencies',
  'subject to empirical validation',
];

/** Limitation recognition */
export const LIMITATION_PHRASES = [
  'empirical limitations',
  'methodological constraints',
  'structural barriers',
  'cultural variability',
];
