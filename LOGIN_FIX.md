# 登入問題修復指南

## 已修復的問題

1. **環境變數名稱不一致** - 現在同時支持 `GOOGLE_ID`/`GOOGLE_SECRET` 和 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
2. **Cookie 設置** - 在開發環境使用 HTTP cookies，生產環境使用 HTTPS
3. **統一 authOptions** - 確保所有 API 路由使用相同的認證配置

## 如果仍然遇到 Callback 錯誤

### 1. 檢查 Google OAuth 設置

確認 Google Cloud Console 中的設置：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的項目
3. 前往 "APIs & Services" → "Credentials"
4. 檢查 OAuth 2.0 Client ID 的設置：
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `https://yourdomain.com` (生產環境)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (生產環境)

### 2. 清除瀏覽器 Cookies

1. 打開瀏覽器開發者工具（F12）
2. 前往 Application → Cookies
3. 刪除所有 `localhost:3000` 的 cookies
4. 重新嘗試登入

### 3. 檢查環境變數

確認 `.env.local` 中有：
```env
GOOGLE_ID=你的Google_Client_ID
GOOGLE_SECRET=你的Google_Client_Secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=你的密鑰（應該是一個隨機字符串）
```

### 4. 重新啟動服務器

修改配置後，必須重新啟動開發服務器：
```bash
# 停止服務器 (Ctrl+C)
npm run dev
```

### 5. 檢查服務器日誌

在運行 `npm run dev` 的終端中查看錯誤訊息，尋找：
- `[next-auth][error]`
- `[next-auth][warn]`

## 常見錯誤和解決方案

### 錯誤：`error=Callback`
- **原因**: Google OAuth 回調 URL 設置不正確
- **解決**: 檢查 Google Cloud Console 中的 redirect URI 設置

### 錯誤：`error=AccessDenied`
- **原因**: 用戶拒絕了 Google 登入權限
- **解決**: 使用不同的 Google 帳號或重新授權

### 錯誤：`error=Configuration`
- **原因**: 環境變數配置錯誤
- **解決**: 檢查 `.env.local` 中的 `GOOGLE_ID` 和 `GOOGLE_SECRET`

## 測試登入

1. 訪問 `http://localhost:3000/login`
2. 點擊 "Sign in with Google"
3. 選擇 Google 帳號並授權
4. 應該會跳轉回應用程序

如果問題持續，請檢查服務器終端的錯誤日誌。
