# 多環境 OAuth 設置指南（Railway + Vercel）

## 問題說明

如果你在多個平台部署應用（Railway、Vercel），每個環境都需要在 Google OAuth 設置中添加對應的 URL。

## 需要添加的 URL

### 1. Google Cloud Console 設置

在 OAuth 2.0 Client ID 設置中添加所有部署環境的 URL：

#### Authorized JavaScript Origins（已授權的 JavaScript 來源）：

```
http://localhost:3000
https://assignment-terminator-indol.vercel.app
https://你的railway域名.railway.app  （如果有）
https://你的自定義域名.com  （如果有）
```

#### Authorized Redirect URIs（已授權的重新導向 URI）：

```
http://localhost:3000/api/auth/callback/google
https://assignment-terminator-indol.vercel.app/api/auth/callback/google
https://你的railway域名.railway.app/api/auth/callback/google  （如果有）
https://你的自定義域名.com/api/auth/callback/google  （如果有）
```

### 2. 環境變數設置

#### 本地開發（.env.local）：
```env
NEXTAUTH_URL=http://localhost:3000
GOOGLE_ID=你的Client_ID
GOOGLE_SECRET=你的Client_Secret
```

#### Vercel 環境變數：
在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
```env
NEXTAUTH_URL=https://assignment-terminator-indol.vercel.app
GOOGLE_ID=你的Client_ID
GOOGLE_SECRET=你的Client_Secret
NEXTAUTH_SECRET=一個強隨機字符串
```

#### Railway 環境變數（如果部署在 Railway）：
在 Railway Dashboard → Variables 中添加：
```env
NEXTAUTH_URL=https://你的railway域名.railway.app
GOOGLE_ID=你的Client_ID
GOOGLE_SECRET=你的Client_Secret
NEXTAUTH_SECRET=一個強隨機字符串（與 Vercel 不同）
```

## 重要提示

### ⚠️ NEXTAUTH_SECRET 必須不同
每個部署環境應該使用**不同的** `NEXTAUTH_SECRET`：
- 本地開發：一個值
- Vercel：另一個值
- Railway：又一個值

生成隨機密鑰：
```bash
openssl rand -base64 32
```

### ⚠️ NEXTAUTH_URL 必須正確
- **本地開發**：`http://localhost:3000`
- **Vercel**：`https://assignment-terminator-indol.vercel.app`
- **Railway**：`https://你的域名.railway.app`

## 檢查你的部署環境

### 1. 檢查 Vercel 部署
訪問：https://vercel.com/dashboard
- 找到你的項目
- 查看部署的 URL
- 確認環境變數設置

### 2. 檢查 Railway 部署（如果有）
訪問：https://railway.app/dashboard
- 找到你的項目
- 查看服務的 URL
- 確認環境變數設置

## 修復步驟

### 步驟 1：添加所有 URL 到 Google OAuth

1. 前往：https://console.cloud.google.com/apis/credentials
2. 選擇你的 OAuth 2.0 Client ID
3. 編輯設置
4. 添加所有環境的 JavaScript Origins 和 Redirect URIs
5. 保存

### 步驟 2：設置環境變數

#### Vercel：
1. 前往 Vercel Dashboard → 你的項目 → Settings → Environment Variables
2. 添加/更新：
   - `NEXTAUTH_URL` = `https://assignment-terminator-indol.vercel.app`
   - `GOOGLE_ID` = 你的 Client ID
   - `GOOGLE_SECRET` = 你的 Client Secret
   - `NEXTAUTH_SECRET` = 生成的新密鑰

#### Railway（如果使用）：
1. 前往 Railway Dashboard → 你的項目 → Variables
2. 添加/更新相同的環境變數，但使用 Railway 的 URL

### 步驟 3：重新部署

修改環境變數後，需要重新部署：

**Vercel：**
```bash
git push  # 自動觸發部署
# 或
vercel --prod
```

**Railway：**
- Railway 會自動檢測環境變數變更並重新部署

## 測試每個環境

### 本地開發：
1. 訪問：http://localhost:3000/login
2. 測試 Google 登入

### Vercel：
1. 訪問：https://assignment-terminator-indol.vercel.app/login
2. 測試 Google 登入

### Railway（如果有）：
1. 訪問：https://你的域名.railway.app/login
2. 測試 Google 登入

## 常見問題

### Q: 為什麼需要添加所有 URL？
A: Google OAuth 會驗證請求來源，只有已授權的 URL 才能使用 OAuth 客戶端。

### Q: 可以在不同環境使用相同的 NEXTAUTH_SECRET 嗎？
A: 不建議。每個環境應該使用不同的密鑰以增強安全性。

### Q: 如何知道我的 Railway URL？
A: 在 Railway Dashboard → 你的服務 → Settings → Domains 中查看。

### Q: 設置後多久生效？
A: Google OAuth 設置通常幾分鐘內生效，但可能需要最多數小時。

## 檢查清單

- [ ] 所有環境的 URL 已添加到 Google OAuth JavaScript Origins
- [ ] 所有環境的 callback URL 已添加到 Google OAuth Redirect URIs
- [ ] Vercel 環境變數已設置（包括 NEXTAUTH_URL）
- [ ] Railway 環境變數已設置（如果使用 Railway）
- [ ] 每個環境使用不同的 NEXTAUTH_SECRET
- [ ] 已重新部署所有環境
- [ ] 已測試每個環境的登入功能

完成這些步驟後，所有環境的 OAuth 登入都應該可以正常工作了！
