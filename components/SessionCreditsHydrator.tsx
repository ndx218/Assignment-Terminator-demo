'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSetCredits, usePointStore } from '@/hooks/usePointStore';

/** 將 session.user.credits 同步到 Zustand，並處理登出/換帳號 */
export default function SessionCreditsHydrator() {
  // ⚠️ 所有 hooks 必须在组件顶层调用（React hooks 规则）
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const setCredits = useSetCredits();
  const lastUserIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  // 设置 mounted 状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // 手动触发 hydration（因为启用了 skipHydration）
  useEffect(() => {
    if (mounted && !hydratedRef.current && typeof window !== 'undefined') {
      try {
        usePointStore.persist?.rehydrate?.();
        hydratedRef.current = true;
      } catch (error) {
        console.error('Failed to rehydrate store:', error);
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!setCredits || typeof setCredits !== 'function') return;

    try {
      if (status === 'authenticated') {
        const userId = String(session?.user?.id ?? '');
        const raw = (session as any)?.user?.credits;

        if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
          usePointStore.persist?.clearStorage?.();
        }
        lastUserIdRef.current = userId;

        if (typeof raw === 'number' && Number.isFinite(raw)) {
          setCredits(raw);
        }

        // 頁面載入時從 API 取得最新點數，避免顯示 0
        fetch('/api/credits')
          .then((r) => r.json())
          .then((data) => {
            if (typeof data?.credits === 'number') {
              setCredits(data.credits);
            }
          })
          .catch(() => {});
        return;
      }

      if (status === 'unauthenticated') {
        setCredits(0);
        usePointStore.persist?.clearStorage?.();
        lastUserIdRef.current = null;
      }
    } catch (error) {
      console.error('SessionCreditsHydrator error:', error);
    }
  }, [status, session?.user?.id, session?.user?.credits, setCredits, mounted]);

  // 如果还没挂载，返回 null（避免 SSR 错误）
  if (!mounted) return null;

  return null;
}
