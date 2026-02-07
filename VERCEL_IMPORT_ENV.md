# Vercel 批量導入環境變數

Vercel 支持**批量導入**環境變數，不用一個一個手動添加。

## 方法 1：在 Dashboard 導入 .env 文件

### 步驟：

1. **打開環境變數頁面**
   - Vercel Dashboard → 你的項目 → **Settings** → **Environment Variables**

2. **找到導入選項**
   - 在環境變數列表上方，找到 **"Import"** 或 **"Import .env"** 按鈕

3. **選擇文件導入**
   - 點擊 **"Import"**
   - 選擇項目根目錄下的 **`vercel-env-import.env`** 文件
   - 或直接**粘貼**下面「可粘貼內容」區塊的內容

4. **選擇環境**
   - 導入時選擇要應用的環境：**Production**、**Preview**、**Development**
   - 建議三個都勾選

5. **確認**
   - 檢查預覽中的變數是否正確
   - 點擊確認完成導入

## 方法 2：直接粘貼（Paste）

在 Environment Variables 頁面：

1. 點擊 **"Import"** 或 **"Paste"**
2. 複製 `vercel-env-import.env` 文件的**全部內容**
3. 粘貼到彈出的文本框
4. 選擇環境（Production, Preview, Development）
5. 確認導入

## 項目內文件說明

已為你生成 **`vercel-env-import.env`**，包含：

- NEXTAUTH_URL（已改為 Vercel 網址）
- NEXTAUTH_SECRET（已用隨機密鑰）
- GOOGLE_ID / GOOGLE_SECRET
- DATABASE_URL
- CLOUDINARY_*
- OPENROUTER_*
- EMAIL_*
- GITHUB_*
- ADMIN_API_KEY
- STRIPE_*（支付用）

**注意：** `vercel-env-import.env` 已加入 `.gitignore`，不會被提交到 Git，避免洩漏密鑰。

## 導入後

- 導入的變數會出現在環境變數列表中
- 只對**之後的部署**生效，需重新部署（Redeploy）一次
- 若 Vercel 網址不是 `https://assignment-terminator-indol.vercel.app`，請在 Dashboard 裡把 **NEXTAUTH_URL** 改成你實際的 Vercel 網址

## 若介面沒有 Import

若你的項目頁面沒有「Import」按鈕：

1. 確認在 **Settings → Environment Variables**
2. 查看是否有 **"Bulk add"** 或 **"Paste from .env"** 等類似選項
3. 或使用 [Vercel 文檔](https://vercel.com/changelog/bulk-upload-now-available-for-environment-variables) 對照最新介面

有導入或變數名稱不確定時，可以再問。
