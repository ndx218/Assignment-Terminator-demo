// 診斷 API：檢查登入所需環境變數（不暴露實際值）
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GOOGLE_ID: !!process.env.GOOGLE_ID,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_SECRET: !!process.env.GOOGLE_SECRET,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
  };

  const hasGoogleId = checks.GOOGLE_ID || checks.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = checks.GOOGLE_SECRET || checks.GOOGLE_CLIENT_SECRET;

  const allOk =
    checks.NEXTAUTH_URL &&
    checks.NEXTAUTH_SECRET &&
    hasGoogleId &&
    hasGoogleSecret &&
    checks.DATABASE_URL;

  return res.status(200).json({
    ok: allOk,
    checks,
    expectedCallbackUrl: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : '（需設定 NEXTAUTH_URL）',
    missing: [
      !checks.NEXTAUTH_URL && 'NEXTAUTH_URL',
      !checks.NEXTAUTH_SECRET && 'NEXTAUTH_SECRET',
      !hasGoogleId && 'GOOGLE_ID 或 GOOGLE_CLIENT_ID',
      !hasGoogleSecret && 'GOOGLE_SECRET 或 GOOGLE_CLIENT_SECRET',
      !checks.DATABASE_URL && 'DATABASE_URL',
    ].filter(Boolean),
  });
}
