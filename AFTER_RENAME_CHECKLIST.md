# 改名後需要做的事（esay-work → Assignment-Terminator-demo）

## 1. 更新本地 Git remote（必須）

```bash
git remote set-url origin https://github.com/ndx218/Assignment-Terminator-demo.git
```

## 2. Vercel 要不要改？

- GitHub 會把舊網址自動轉向，Vercel 多半會繼續能拉程式碼
- 若 Vercel 網址有變，到 **Settings → Environment Variables** 把 **NEXTAUTH_URL** 改成新網址，再 **Redeploy**

## 3. 在 Vercel 新建專案

1. 前往 https://vercel.com/new
2. Import **ndx218/Assignment-Terminator-demo**
3. 在 **Environment Variables** 貼上你的 .env 內容（勿在此文件內貼真實金鑰！請使用本機 .env）
4. **Install Command** 設為：`npm install --legacy-peer-deps`
5. Deploy 完成後，把 **NEXTAUTH_URL** 改成實際 Vercel 網址

## 4. Google OAuth

到 Google Cloud Console 的 OAuth 2.0 Client：
- **Authorized JavaScript origins** 加：`https://你的vercel網址.vercel.app`
- **Authorized redirect URIs** 加：`https://你的vercel網址.vercel.app/api/auth/callback/google`
