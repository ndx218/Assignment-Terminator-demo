# 改名後需要做的事（esay-work → Assignment-Terminator-demo）

## 1. 更新本地 Git remote（必須）

你的 GitHub repo 已改名為 **Assignment-Terminator-demo**，本地要改指向新網址：

```bash
cd /Users/chakfungtam/Downloads/Assignment-Terminator-main

# 查看目前的 remote
git remote -v

# 改成新 repo 網址
git remote set-url origin https://github.com/ndx218/Assignment-Terminator-demo.git

# 確認
git remote -v
```

之後 push/pull 就會用新 repo。

---

## 2. Vercel 要不要改？

### 情況 A：Vercel 本來就連到這個 GitHub repo

- GitHub 會把舊網址 `ndx218/esay-work` **自動轉向**到 `ndx218/Assignment-Terminator-demo`，所以 Vercel 多半會繼續能拉程式碼。
- 若之後 Vercel 顯示「連線錯誤」或無法 deploy，到 Vercel 專案 **Settings → Git** 重新連接，選 **ndx218/Assignment-Terminator-demo**。

### 情況 B：你要「新建」一個 Vercel 專案（從頭建）

照下面「3. 在 Vercel 新建專案」做。

### 情況 C：Vercel 網址有變

- 若 Vercel 給的網址變成例如：`assignment-terminator-demo-xxx.vercel.app`
- 到 Vercel 專案 **Settings → Environment Variables**，把 **NEXTAUTH_URL** 改成這個新網址（例如 `https://assignment-terminator-demo-xxx.vercel.app`），再 **Redeploy**。

---

## 3. 在 Vercel 新建專案（從頭建）

### Step 1：Import 專案

1. 打開 https://vercel.com/new
2. 選 **Import Git Repository**
3. 選 **ndx218/Assignment-Terminator-demo**（改名後的 repo）
4. 點 **Import**

### Step 2：設定專案

- **Project Name**：可填 `assignment-terminator-demo` 或你喜歡的名稱（會影響 `.vercel.app` 網址）
- **Framework Preset**：Next.js（通常會自動偵測）
- **Root Directory**：`./`（預設即可）

### Step 3：Environment Variables（重要）

在 **Environment Variables** 區塊：

1. 點 **Import .env** 或 **Paste**，貼上下面整段（或從專案裡的 `vercel-env-import.env` 複製）：

```
NEXTAUTH_URL=https://assignment-terminator-indol.vercel.app
NEXTAUTH_SECRET=Vbzag0aZOrqYGuuLRYbWD5axQSl6WZTxSfbeCvRUyK8=
GOOGLE_ID=441492919535-3pkbafkcqvmqri4m7oobovkb6et4ejlh.apps.googleusercontent.com
GOOGLE_SECRET=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
OPENROUTER_GEMINI_MODEL=google/gemini-2.5-flash
DATABASE_URL=postgresql://postgres:DUQUVYNWacQbcBOEDNNdnvjGkCKOPFmx@crossover.proxy.rlwy.net:53535/railway?sslmode=require
CLOUDINARY_API_KEY=247198953975234
CLOUDINARY_API_SECRET=UA_e4-m_j2eSRsTsD_pyj0jvj5E
CLOUDINARY_CLOUD_NAME=dwap3wdfe
ADMIN_API_KEY=jsdhbvs8y8kjhkuukhhguit78t766e53ase73y8wh4hr2f898sd8d89c89
EMAIL_SERVER_PASSWORD=axfv uumr asrm ejkl
EMAIL_FROM=ndx218@gmail.com
EMAIL_SERVER_USER=ndx218@gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_HOST=smtp.gmail.com
GMAIL_APP_PASSWORD=odcqyqezolmrjgd
GITHUB_SECRET=545c79451ef2035dc778cc212552f1d5ebc6721e
GITHUB_ID=Ov23liR6HQTHa5nzVyxj
OPENROUTER_API_KEY=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
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RX8o3GI8j5EOlmOjKh7BaVPxggrBOCcJdNZj2PJRFLu5f0q4q9O3s4n0O4abZZ8TcclWVok0hGIWEa1lsmX8l1L00xDCRhoZW
```

2. **NEXTAUTH_URL** 先不用改；部署完成後 Vercel 會給你一個網址（例如 `assignment-terminator-demo.vercel.app`），再到 **Settings → Environment Variables** 把 **NEXTAUTH_URL** 改成那個網址，然後 **Redeploy**。

### Step 4：避免 Build 失敗（Install Command）

1. 在 Import 頁面下方展開 **Build and Output Settings**
2. **Install Command** 設為：`npm install --legacy-peer-deps`
3. 其餘用預設即可

### Step 5：Deploy

點 **Deploy**，等建置完成。

### Step 6：改 NEXTAUTH_URL 並 Redeploy

1. 部署完成後，記下 Vercel 給的網址（例如 `https://assignment-terminator-demo-xxx.vercel.app`）
2. **Settings → Environment Variables** → 編輯 **NEXTAUTH_URL** → 改成上面網址
3. **Deployments** → 最新一次 → **Redeploy**

### Step 7：Google OAuth（登入用）

到 Google Cloud Console 的 OAuth 2.0 Client：

- **Authorized JavaScript origins** 加：`https://你的vercel網址.vercel.app`
- **Authorized redirect URIs** 加：`https://你的vercel網址.vercel.app/api/auth/callback/google`

---

## 4. 檢查清單（改名 + Vercel）

- [ ] 本地已執行 `git remote set-url origin https://github.com/ndx218/Assignment-Terminator-demo.git`
- [ ] 若新建 Vercel 專案：已 Import **Assignment-Terminator-demo**、貼好環境變數、設好 Install Command
- [ ] 部署完成後已把 **NEXTAUTH_URL** 改成實際 Vercel 網址並 Redeploy
- [ ] Google OAuth 已加入新 Vercel 網址

這樣改名後該改的都有做，Vercel 專案也會照新 repo 正常建置與運行。
