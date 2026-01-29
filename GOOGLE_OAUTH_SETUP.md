# Google OAuth 設置指南

## 當前問題

你在 Google Cloud Console 中看到權限錯誤，這可能影響 OAuth 設置。以下是解決步驟：

## 解決方案

### 選項 1：請求權限（推薦用於團隊項目）

如果你需要訪問 Google Auth Platform 設置頁面：

1. 在 GCP Console 中點擊「要求權限」按鈕
2. 選擇「支援使用者」角色（如果適用）
3. 等待管理員批准

### 選項 2：使用現有的 OAuth 憑證（推薦用於個人項目）

如果你已經有 OAuth 2.0 Client ID 和 Secret，可以直接使用，無需訪問這些設置頁面。

## 檢查 OAuth 設置

### 1. 確認 OAuth 2.0 Client ID 設置

即使無法訪問某些 GCP 頁面，你仍然可以檢查 OAuth 設置：

1. 前往：https://console.cloud.google.com/apis/credentials
2. 選擇項目：`airy-galaxy-475306-s9`（或你的項目）
3. 找到你的 OAuth 2.0 Client ID
4. 點擊編輯

### 2. 確認 Redirect URI 設置

在 OAuth 2.0 Client ID 設置中，確認「已授權的重新導向 URI」包含：

**開發環境：**
```
http://localhost:3000/api/auth/callback/google
```

**生產環境（如果已部署）：**
```
https://yourdomain.com/api/auth/callback/google
```

### 3. 確認 Authorized JavaScript origins

**開發環境：**
```
http://localhost:3000
```

**生產環境：**
```
https://yourdomain.com
```

## 驗證環境變數

確認 `.env.local` 中有正確的憑證：

```env
GOOGLE_ID=你的Client_ID（以.apps.googleusercontent.com結尾）
GOOGLE_SECRET=你的Client_Secret（以GOCSPX-開頭）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=一個隨機字符串（用於加密session）
```

## 測試登入

1. 重新啟動開發服務器：
   ```bash
   npm run dev
   ```

2. 訪問：http://localhost:3000/login

3. 點擊 "Sign in with Google"

4. 如果出現錯誤，檢查：
   - 瀏覽器控制台的錯誤訊息
   - 服務器終端的日誌

## 常見錯誤

### 錯誤：`error=Callback`
- **原因**: Redirect URI 不匹配
- **解決**: 確認 Google Cloud Console 中的 Redirect URI 與應用程序中的完全一致

### 錯誤：`error=AccessDenied`
- **原因**: 用戶拒絕授權
- **解決**: 使用不同的 Google 帳號或重新授權

### 錯誤：`error=Configuration`
- **原因**: GOOGLE_ID 或 GOOGLE_SECRET 錯誤
- **解決**: 檢查 `.env.local` 中的值是否正確

## 如果無法訪問 GCP Console

如果你無法訪問某些 GCP 頁面但已有 OAuth 憑證：

1. **直接使用現有憑證** - 只要 Redirect URI 設置正確，登入功能應該可以正常工作
2. **檢查應用程序日誌** - 查看服務器終端的錯誤訊息
3. **測試登入流程** - 嘗試實際登入，看是否成功

## 重要提示

- GCP Console 的權限錯誤**不一定**會影響 OAuth 登入功能
- 只要 OAuth 2.0 Client ID 和 Secret 正確，且 Redirect URI 設置正確，登入應該可以工作
- 如果登入仍然失敗，問題更可能在於 Redirect URI 設置，而不是 GCP 權限

## 下一步

1. 確認你的 OAuth 2.0 Client ID 設置中的 Redirect URI
2. 重新啟動服務器
3. 清除瀏覽器 cookies
4. 嘗試登入

如果問題持續，請提供：
- 瀏覽器控制台的錯誤訊息
- 服務器終端的錯誤日誌
