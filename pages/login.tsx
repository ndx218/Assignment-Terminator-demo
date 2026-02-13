import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { showSuccess, showError } from '@/lib/toast';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const error = typeof router.query.error === 'string' ? router.query.error : null;
  const [configCheck, setConfigCheck] = useState<{ ok?: boolean; checks?: Record<string, boolean>; missing?: string[]; expectedCallbackUrl?: string } | null>(null);

  useEffect(() => {
    if (error === 'Callback') {
      fetch('/api/auth/check-config')
        .then((r) => r.json())
        .then(setConfigCheck)
        .catch(() => setConfigCheck(null));
    } else {
      setConfigCheck(null);
    }
  }, [error]);

  useEffect(() => {
    console.log('🔍 status:', status);
    console.log('👤 session:', session);

    const skip = localStorage.getItem('skipLogin') === 'true';
    if (skip) {
      router.replace('/');
      return;
    }

    if (status === 'authenticated' && router.pathname === '/login') {
      showSuccess('login');
      router.replace('/');
    }
  }, [session, status]);

  const handleEmailSignIn = async () => {
    setLoading(true);
    // 使用當前域名作為 callback URL，支持所有環境
    const callbackUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/`
      : '/';
    const res = await signIn('email', {
      email,
      redirect: false,
      callbackUrl,
    });
    res?.ok ? showSuccess('email') : showError('email');
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    // 使用當前域名作為 callback URL，支持所有環境
    const callbackUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/`
      : '/';
    signIn('google', {
      callbackUrl,
    });
  };

  const handleSkipLogin = () => {
    localStorage.setItem('skipLogin', 'true');
    router.replace('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ 正在驗證登入狀態...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">登入 Assignment Terminator</h1>

        {error === 'Callback' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-2">
            <p className="font-medium">Google 登入回調失敗</p>
            {configCheck && (
              <div className="bg-white/50 rounded p-2 text-xs space-y-1">
                {configCheck.ok ? (
                  <p className="text-green-700">✓ 環境變數已設定，問題可能在 Redirect URI 或資料庫</p>
                ) : (
                  <>
                    <p className="text-red-700">缺少：{configCheck.missing?.join(', ')}</p>
                    {configCheck.expectedCallbackUrl && (
                      <p>Google 需加入：<code className="block mt-1 break-all">{configCheck.expectedCallbackUrl}</code></p>
                    )}
                  </>
                )}
              </div>
            )}
            <p>請依序檢查：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Google Cloud Console → 已授權的重新導向 URI 必須包含：<br />
                <code className="text-xs bg-white px-1 rounded block mt-1">https://assignment-terminator-demo-ilsy.vercel.app/api/auth/callback/google</code>
              </li>
              <li>Vercel → Settings → Environment Variables 必須設定：NEXTAUTH_URL、NEXTAUTH_SECRET、GOOGLE_ID、GOOGLE_SECRET、DATABASE_URL</li>
              <li>資料庫需已執行 <code className="text-xs">prisma migrate deploy</code> 建立 User、Account 表</li>
            </ol>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition"
        >
          使用 Google 登入
        </button>

        <div className="text-center text-sm text-gray-400">或使用 Email</div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="輸入你的 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleEmailSignIn}
            disabled={loading || !email}
            className="w-full bg-black text-white py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50"
          >
            📩 發送登入連結
          </button>
        </div>

        <div className="text-center pt-2">
          <button onClick={handleSkipLogin} className="text-sm text-red-600 underline hover:text-black">
            ❌ 跳過登入（測試用）
          </button>
        </div>
      </div>
    </div>
  );
}
