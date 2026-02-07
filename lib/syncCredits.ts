// 從 API 回應同步餘額到 Zustand
import { usePointStore } from '@/hooks/usePointStore';

export function syncCreditsFromResponse(data: { remainingCredits?: number } | null | undefined) {
  if (data && typeof data.remainingCredits === 'number') {
    try {
      usePointStore.getState().set(data.remainingCredits);
    } catch {}
  }
}
