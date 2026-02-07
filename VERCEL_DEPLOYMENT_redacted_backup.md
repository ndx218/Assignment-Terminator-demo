# Vercel 部署檢查清單

## 部署前檢查

### 1. Google OAuth 設置 ✅

確認 Google Cloud Console 中的 OAuth 2.0 Client ID 設置：

#### Authorized JavaScript Origins：
```
http://localhost:3000
https://assignment-terminator-indol.vercel.app
```

#### Authorized Redirect URIs：
```
http://localhost:3000/api/auth/callback/google
https://assignment-terminator-indol.vercel.app/api/auth/callback/google
```

### 2. Vercel 環境變數設置

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：

#### 必需變數：
```env
# NextAuth
NEXTAUTH_URL=https://assignment-terminator-indol.vercel.app
NEXTAUTH_SECRET=生成一個強隨機字符串（使用：openssl rand -base64 32）

# Google OAuth（在 Google Cloud Console 創建 OAuth 客戶端後填入）
GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Database（例如 Railway 提供的 PostgreSQL URL）
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Cloudinary（在 Cloudinary Dashboard 查看）
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe（在 Stripe Dashboard → API keys 查看，生產用 Live keys）
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_GEMINI_MODEL=google/gemini-2.5-flash

# Email（可選，Gmail 需用應用專用密碼）
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=your@gmail.com

# Admin（自訂一組隨機字符串）
ADMIN_API_KEY=your_random_admin_key
```

### 3. 生成 NEXTAUTH_SECRET

在終端執行：
```bash
openssl rand -base64 32
```

複製生成的字符串，添加到 Vercel 環境變數中。

### 4. 部署步驟

#### 方法 1：通過 Git（推薦）
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

Vercel 會自動檢測並部署。

#### 方法 2：通過 Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 5. 部署後檢查

#### 檢查清單：
- [ ] 訪問 https://assignment-terminator-indol.vercel.app 可以打開網站
- [ ] 訪問 https://assignment-terminator-indol.vercel.app/login 可以打開登入頁面
- [ ] Google 登入功能正常
- [ ] 支付頁面可以訪問：https://assignment-terminator-indol.vercel.app/recharge
- [ ] Stripe 支付功能正常（如果已設置 Webhook）

### 6. 測試功能

#### 基本功能測試：
1. **登入測試**：
   - 訪問登入頁面
   - 使用 Google 登入
   - 確認可以成功登入

2. **支付測試**：
   - 訪問充值頁面
   - 選擇套餐
   - 測試 Stripe 支付（使用測試卡號：4242 4242 4242 4242）

3. **其他功能**：
   - 測試作業產生器
   - 測試其他核心功能

### 7. 常見問題

#### 問題：部署後出現 500 錯誤
**解決**：
- 檢查 Vercel 部署日誌
- 確認所有環境變數已設置
- 確認 `NEXTAUTH_SECRET` 已設置

#### 問題：Google 登入失敗
**解決**：
- 確認 Google OAuth Redirect URI 包含 Vercel URL
- 確認 `NEXTAUTH_URL` 環境變數設置正確
- 等待幾分鐘讓 Google OAuth 設置生效

#### 問題：數據庫連接失敗
**解決**：
- 確認 `DATABASE_URL` 環境變數正確
- 確認 Railway 數據庫允許外部連接
- 檢查 Railway 數據庫狀態

### 8. 分享給其他用戶測試

部署成功後，分享以下鏈接：

**主頁**：
```
https://assignment-terminator-indol.vercel.app
```

**登入頁**：
```
https://assignment-terminator-indol.vercel.app/login
```

**充值頁**：
```
https://assignment-terminator-indol.vercel.app/recharge
```

## 重要提醒

⚠️ **生產環境注意事項**：
- 確保 `NEXTAUTH_SECRET` 是強隨機字符串
- 確保 Stripe Webhook 已設置（如果使用 Stripe）
- 確保數據庫連接穩定
- 建議設置自定義域名（可選）

## 快速部署命令

```bash
# 1. 確保所有更改已提交
git add .
git commit -m "Ready for Vercel deployment"

# 2. 推送到 GitHub（如果使用 Git 部署）
git push

# 3. 或使用 Vercel CLI
vercel --prod
```

部署完成後，告訴我結果，我可以幫你測試！
