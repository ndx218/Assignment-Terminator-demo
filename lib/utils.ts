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
  const ids = outlinePoints.map((p) => p.id).sort((a, b) => a - b);
  const nextId = ids.find((id) => id > sectionId);
  const isLastSection = !nextId && ids.length > 0 && sectionId === ids[ids.length - 1];

  const sectionStartPattern = new RegExp(`(?:^|\\n)\\s*${sectionId}\\.\\s*[^\\n]*`, 'i');
  const sectionEndPattern = nextId ? new RegExp(`\\n\\s*${nextId}\\.\\s*`, 'i') : null;

  let startMatch = content.match(sectionStartPattern);
  let contentStart = 0;
  let endIndex = content.length;

  if (startMatch) {
    contentStart = (startMatch.index ?? 0) + startMatch[0].length;
  } else if (isLastSection) {
    // 結論段：若無 "5. Conclusion" 標題，嘗試以結論開頭語擷取
    const conclusionStart = content.match(/\n\n\s*(In conclusion|To summarize|Therefore|總而言之|綜上所述|因此)[\s,]/i);
    if (conclusionStart && conclusionStart.index != null) {
      contentStart = conclusionStart.index + 2; // 跳過 \n\n，保留 "In conclusion, ..." 整段
    } else {
      const prevId = sectionId - 1;
      const prevPattern = new RegExp(`(?:^|\\n)\\s*${prevId}\\.\\s*[^\\n]*`, 'i');
      const prevMatch = content.match(prevPattern);
      if (prevMatch) {
        const prevEnd = (prevMatch.index ?? 0) + prevMatch[0].length;
        const afterPrev = content.substring(prevEnd);
        const nextSectionMatch = afterPrev.match(/\n\n\s*\S/);
        if (nextSectionMatch && nextSectionMatch.index != null) {
          contentStart = prevEnd + nextSectionMatch.index + 2;
        }
      }
    }
  } else {
    return content;
  }

  if (sectionEndPattern) {
    const fromStart = content.substring(contentStart);
    const endMatch = fromStart.match(sectionEndPattern);
    if (endMatch && endMatch.index != null) endIndex = contentStart + endMatch.index;
  }
  return content.substring(contentStart, endIndex).trim();
}
