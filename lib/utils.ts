/**
 * tailwind / className 合併小工具
 *
 * 例：cn('btn', isActive && 'active', isDisabled && 'opacity-50')
 */
export function cn(...classes: Array<string | boolean | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 當 LLM 回傳整篇文章（含多段標題）時，僅擷取指定 sectionId 的段落內容。
 * 用於修訂稿、人性化等應只回傳單段卻回傳全文的情況。
 */
export function extractSingleSection(
  content: string,
  sectionId: number,
  outlinePoints: { id: number }[]
): string {
  if (!content || !content.trim()) return content;
  const nextId = outlinePoints.map((p) => p.id).sort((a, b) => a - b).find((id) => id > sectionId);
  const sectionStartPattern = new RegExp(`(?:^|\\n)\\s*${sectionId}\\.\\s*[^\\n]*`, 'i');
  const sectionEndPattern = nextId ? new RegExp(`\\n\\s*${nextId}\\.\\s*`, 'i') : null;

  const startMatch = content.match(sectionStartPattern);
  if (!startMatch) return content;

  const contentStart = (startMatch.index ?? 0) + startMatch[0].length;
  let endIndex = content.length;
  if (sectionEndPattern) {
    const fromStart = content.substring(contentStart);
    const endMatch = fromStart.match(sectionEndPattern);
    if (endMatch && endMatch.index != null) endIndex = contentStart + endMatch.index;
  }
  return content.substring(contentStart, endIndex).trim();
}
