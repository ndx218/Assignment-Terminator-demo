# Stripe 付款問題排查指南

## 如果看到 "付款失敗" 錯誤

### 1. 檢查瀏覽器控制台
1. 打開瀏覽器開發者工具（F12 或 Cmd+Option+I）
2. 切換到 "Console" 標籤
3. 查看是否有紅色錯誤訊息
4. 複製錯誤訊息

### 2. 檢查服務器日誌
在運行 `npm run dev` 的終端中查看錯誤訊息，尋找：
- `[Stripe Error]`
- `[Stripe Error Details]`

### 3. 常見問題和解決方案

#### 問題 1: "Stripe is not configured"
**原因**: Stripe 套件未安裝或 API keys 未設置

**解決方案**:
```bash
npm install stripe @stripe/stripe-js --legacy-peer-deps
```

確認 `.env.local` 中有：
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 問題 2: "STRIPE_SECRET_KEY environment variable is not set"
**原因**: 環境變數未正確加載

**解決方案**:
1. 確認 `.env.local` 文件存在於項目根目錄
2. 確認變數名稱正確（沒有多餘空格）
3. 重啟開發服務器：
   ```bash
   # 停止服務器 (Ctrl+C)
   npm run dev
   ```

#### 問題 3: "Invalid API Key"
**原因**: API key 格式錯誤或無效

**解決方案**:
1. 確認使用的是 Live keys（以 `sk_live_` 和 `pk_live_` 開頭）
2. 從 Stripe Dashboard 複製最新的 keys
3. 確認沒有多餘的空格或換行

#### 問題 4: API 版本錯誤
**原因**: Stripe API 版本不匹配

**解決方案**:
檢查 `pages/api/payments/create-stripe-session.ts` 中的 API 版本是否正確。

#### 問題 5: CORS 或網絡問題
**原因**: 瀏覽器阻止請求或網絡連接問題

**解決方案**:
1. 確認使用 `http://localhost:3000`（不是 `https://`）
2. 檢查 VPN 設置（如果使用 VPN）
3. 嘗試關閉 VPN 後重試

### 4. 測試 Stripe 連接

創建一個測試端點來驗證 Stripe 配置：

```bash
# 在終端執行
curl http://localhost:3000/api/payments/test-stripe
```

### 5. 檢查 Stripe Dashboard

1. 登入 [Stripe Dashboard](https://dashboard.stripe.com)
2. 前往 Developers → Logs
3. 查看是否有 API 請求記錄
4. 檢查是否有錯誤訊息

### 6. 驗證環境變數

創建一個測試 API 端點來檢查環境變數：

```typescript
// pages/api/test-stripe-config.ts
export default function handler(req, res) {
  res.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
  });
}
```

訪問 `http://localhost:3000/api/test-stripe-config` 查看配置狀態。

## 獲取幫助

如果以上方法都無法解決問題，請提供：
1. 瀏覽器控制台的完整錯誤訊息
2. 服務器終端的錯誤日誌
3. 錯誤發生時的具體操作步驟
