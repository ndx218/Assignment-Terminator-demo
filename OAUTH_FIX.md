# OAuth 設置修復指南

## 當前狀態 ✅

你的 OAuth 2.0 Client ID 配置中：

### ✅ 已正確設置：
- **已授權的重新導向 URI**：
  - `http://localhost:3000/api/auth/callback/google` ✅
  - `https://assignment-terminator-indol.vercel.app/api/auth/callback/google` ✅

### ⚠️ 需要添加：
- **已授權的 JavaScript 來源**：目前為空

## 修復步驟

### 1. 添加 Authorized JavaScript Origins

在 Google Cloud Console 的 OAuth 2.0 Client ID 設置頁面：

1. 找到「已授權的 JavaScript 來源」部分
2. 點擊「+ 新增 URI」
3. 添加以下兩個 URI：

**開發環境：**
```
http://localhost:3000
```

**生產環境：**
```
https://assignment-terminator-indol.vercel.app
```

4. 點擊「儲存」

### 2. 為什麼需要 JavaScript Origins？

NextAuth.js 在某些情況下會使用 client-side 重定向，需要這些 JavaScript origins 來：
- 允許瀏覽器發起 OAuth 請求
- 處理 OAuth callback
- 確保安全性驗證

### 3. 完整配置檢查清單

確認以下設置：

#### Authorized JavaScript Origins：
- ✅ `http://localhost:3000`
- ✅ `https://assignment-terminator-indol.vercel.app`

#### Authorized Redirect URIs：
- ✅ `http://localhost:3000/api/auth/callback/google`
- ✅ `https://assignment-terminator-indol.vercel.app/api/auth/callback/google`

### 4. 保存後的操作

1. **等待生效**：設置可能需要 5 分鐘到數小時才能生效（通常幾分鐘內）

2. **清除瀏覽器 Cookies**：
   - 開發者工具（F12）→ Application → Cookies
   - 刪除所有 `localhost:3000` 的 cookies

3. **重新啟動服務器**：
   ```bash
   npm run dev
   ```

4. **測試登入**：
   - 訪問：http://localhost:3000/login
   - 點擊 "Sign in with Google"

## 如果仍然失敗

### 檢查服務器日誌

在運行 `npm run dev` 的終端中查看：
- `[next-auth][error]`
- `[next-auth][warn]`

### 檢查瀏覽器控制台

打開開發者工具（F12）→ Console，查看錯誤訊息

### 常見錯誤

**錯誤：`error=redirect_uri_mismatch`**
- 原因：Redirect URI 不匹配
- 解決：確認 Google Console 中的 URI 與應用程序中的完全一致（包括 `http://` vs `https://`）

**錯誤：`error=access_denied`**
- 原因：用戶拒絕授權
- 解決：使用不同的 Google 帳號或重新授權

**錯誤：`error=invalid_client`**
- 原因：Client ID 或 Secret 錯誤
- 解決：檢查 `.env.local` 中的 `GOOGLE_ID` 和 `GOOGLE_SECRET`

## 驗證設置

添加 JavaScript origins 後，你的配置應該看起來像這樣：

### Authorized JavaScript Origins：
```
http://localhost:3000
https://assignment-terminator-indol.vercel.app
```

### Authorized Redirect URIs：
```
http://localhost:3000/api/auth/callback/google
https://assignment-terminator-indol.vercel.app/api/auth/callback/google
```

## 重要提示

- ⚠️ 設置更改可能需要幾分鐘才能生效
- ⚠️ 確保沒有多餘的空格或斜線
- ⚠️ `http://localhost:3000` 必須是 `http://`（不是 `https://`）
- ⚠️ 生產環境必須是 `https://`

完成這些設置後，登入功能應該可以正常工作了！
