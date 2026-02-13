# Vercel 環境變數設置指南

## 不需要創建新項目！

你可以在現有項目中設置環境變數。以下是詳細步驟：

## 設置步驟

### 1. 登入 Vercel Dashboard

1. 前往：https://vercel.com/dashboard
2. 登入你的帳號
3. 找到項目：`esay-work` 或 `assignment-terminator`

### 2. 進入項目設置

1. 點擊你的項目
2. 點擊頂部導航欄的 **"Settings"**（設置）
3. 在左側菜單中點擊 **"Environment Variables"**（環境變數）

### 3. 添加環境變數

點擊 **"Add New"** 按鈕，然後逐個添加以下變數：

#### 必需變數（按順序添加）：

**1. NEXTAUTH_URL**
- Key: `NEXTAUTH_URL`
- Value: `https://your-app.vercel.app`（改成你的 Vercel 網址）
- Environment: 選擇 **Production, Preview, Development**（全部）

**2. NEXTAUTH_SECRET**
- Key: `NEXTAUTH_SECRET`
- Value: 生成一個隨機字符串（見下方）
- Environment: 選擇 **Production, Preview, Development**（全部）

**生成 NEXTAUTH_SECRET：**
在終端執行：
```bash
openssl rand -base64 32
```
複製生成的字符串作為 Value。

**3. GOOGLE_ID** / **4. GOOGLE_SECRET**
- 從 Google Cloud Console OAuth 取得

**5. DATABASE_URL**
- PostgreSQL 連線字串（從 Railway 或其他服務取得）

**6. STRIPE_SECRET_KEY** / **7. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- 從 Stripe Dashboard 取得

**8-10. CLOUDINARY_***
- 從 Cloudinary Dashboard 取得

**11. OPENROUTER_API_KEY**
- 從 OpenRouter 取得

**12. OPENROUTER_GEMINI_MODEL**
- Value: `google/gemini-2.5-flash`

**13. ADMIN_API_KEY**
- 自訂管理員金鑰

### 4. 可選變數（Email 相關）

如需 Email 功能，添加 EMAIL_SERVER_* 等變數（從 Gmail 或 SMTP 取得）。

## 重要提示

⚠️ **切勿將真實金鑰 commit 到 Git！** 請只在 Vercel Dashboard 設定。

添加環境變數後，前往 **Deployments** → 最新部署 → **Redeploy**。
