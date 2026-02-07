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
- Value: `https://assignment-terminator-indol.vercel.app`
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

**3. GOOGLE_ID**
- Key: `GOOGLE_ID`
- Value: `441492919535-3pkbafkcqvmqri4m7oobovkb6et4ejlh.apps.googleusercontent.com`
- Environment: 選擇 **Production, Preview, Development**（全部）

**4. GOOGLE_SECRET**
- Key: `GOOGLE_SECRET`
- Value: `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`
- Environment: 選擇 **Production, Preview, Development**（全部）

**5. DATABASE_URL**
- Key: `DATABASE_URL`
- Value: `postgresql://postgres:DUQUVYNWacQbcBOEDNNdnvjGkCKOPFmx@crossover.proxy.rlwy.net:53535/railway?sslmode=require`
- Environment: 選擇 **Production, Preview, Development**（全部）

**6. STRIPE_SECRET_KEY**
- Key: `STRIPE_SECRET_KEY`
- Value: `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`
- Environment: 選擇 **Production, Preview, Development**（全部）

**7. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- Key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Value: `pk_live_51RX8o3GI8j5EOlmOjKh7BaVPxggrBOCcJdNZj2PJRFLu5f0q4q9O3s4n0O4abZZ8TcclWVok0hGIWEa1lsmX8l1L00xDCRhoZW`
- Environment: 選擇 **Production, Preview, Development**（全部）

**8. CLOUDINARY_CLOUD_NAME**
- Key: `CLOUDINARY_CLOUD_NAME`
- Value: `dwap3wdfe`
- Environment: 選擇 **Production, Preview, Development**（全部）

**9. CLOUDINARY_API_KEY**
- Key: `CLOUDINARY_API_KEY`
- Value: `247198953975234`
- Environment: 選擇 **Production, Preview, Development**（全部）

**10. CLOUDINARY_API_SECRET**
- Key: `CLOUDINARY_API_SECRET`
- Value: `UA_e4-m_j2eSRsTsD_pyj0jvj5E`
- Environment: 選擇 **Production, Preview, Development**（全部）

**11. OPENROUTER_API_KEY**
- Key: `OPENROUTER_API_KEY`
- Value: `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`
- Environment: 選擇 **Production, Preview, Development**（全部）

**12. OPENROUTER_GEMINI_MODEL**
- Key: `OPENROUTER_GEMINI_MODEL`
- Value: `google/gemini-2.5-flash`
- Environment: 選擇 **Production, Preview, Development**（全部）

**13. ADMIN_API_KEY**
- Key: `ADMIN_API_KEY`
- Value: `jsdhbvs8y8kjhkuukhhguit78t766e53ase73y8wh4hr2f898sd8d89c89`
- Environment: 選擇 **Production, Preview, Development**（全部）

### 4. 可選變數（Email 相關）

如果需要 Email 功能，可以添加：

**EMAIL_SERVER_HOST**
- Key: `EMAIL_SERVER_HOST`
- Value: `smtp.gmail.com`
- Environment: 選擇 **Production, Preview, Development**（全部）

**EMAIL_SERVER_PORT**
- Key: `EMAIL_SERVER_PORT`
- Value: `587`
- Environment: 選擇 **Production, Preview, Development**（全部）

**EMAIL_SERVER_USER**
- Key: `EMAIL_SERVER_USER`
- Value: `ndx218@gmail.com`
- Environment: 選擇 **Production, Preview, Development**（全部）

**EMAIL_SERVER_PASSWORD**
- Key: `EMAIL_SERVER_PASSWORD`
- Value: `axfv uumr asrm ejkl`
- Environment: 選擇 **Production, Preview, Development**（全部）

**EMAIL_FROM**
- Key: `EMAIL_FROM`
- Value: `ndx218@gmail.com`
- Environment: 選擇 **Production, Preview, Development**（全部）

## 重要提示

### ⚠️ Environment 選擇
對於每個變數，建議選擇：
- ✅ **Production** - 生產環境
- ✅ **Preview** - 預覽環境（PR 部署）
- ✅ **Development** - 開發環境

這樣所有環境都能正常工作。

### ⚠️ 設置後需要重新部署

添加環境變數後：
1. 前往 **Deployments** 標籤
2. 找到最新的部署
3. 點擊 **"..."** 菜單
4. 選擇 **"Redeploy"**（重新部署）

或者等待下一次 Git push 自動觸發部署。

## 快速檢查清單

- [ ] 已登入 Vercel Dashboard
- [ ] 已進入項目 Settings → Environment Variables
- [ ] 已添加所有必需變數
- [ ] 每個變數都選擇了正確的 Environment（Production, Preview, Development）
- [ ] 已生成並設置 NEXTAUTH_SECRET
- [ ] 已重新部署項目

## 驗證設置

設置完成後，檢查：

1. **變數數量**：應該有至少 13 個變數
2. **NEXTAUTH_URL**：必須是 `https://assignment-terminator-indol.vercel.app`
3. **NEXTAUTH_SECRET**：必須已設置且不是空值

## 如果找不到項目

如果找不到項目，可能的原因：
1. 項目名稱不同（檢查是否有 `esay-work` 或其他名稱）
2. 項目在不同的 Vercel 帳號下
3. 項目還沒有連接到 Vercel

解決方法：
- 檢查 Vercel Dashboard 中的所有項目
- 或使用 Vercel CLI 連接：
  ```bash
  vercel link
  ```

設置完成後告訴我，我可以幫你測試部署！
