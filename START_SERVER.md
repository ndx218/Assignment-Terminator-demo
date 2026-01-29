# 如何啟動開發服務器

如果遇到權限錯誤（EPERM），請按照以下步驟操作：

## 方法 1：在終端手動啟動（推薦）

1. 打開終端（Terminal）
2. 進入項目目錄：
   ```bash
   cd /Users/chakfungtam/Downloads/Assignment-Terminator-main
   ```
3. 啟動服務器：
   ```bash
   npm run dev
   ```

服務器會自動選擇可用端口（通常是 3000）。

## 方法 2：如果端口被佔用

如果 3000 端口被佔用，可以指定其他端口：

```bash
npx next dev -p 3001
```

或

```bash
npx next dev -p 3003
```

## 方法 3：檢查並殺死佔用端口的進程

如果某個端口被佔用，可以找到並關閉它：

```bash
# 查找佔用 3000 端口的進程
lsof -ti:3000

# 如果找到進程 ID，殺死它
kill -9 <進程ID>
```

## 訪問網站

啟動成功後，在瀏覽器打開：
- http://localhost:3000
- 或你指定的端口號

## 常見問題

### 錯誤：EPERM (operation not permitted)
- 這可能是 macOS 安全設置問題
- 嘗試在終端手動運行，而不是通過 IDE
- 檢查系統偏好設置 → 安全與隱私 → 防火牆

### 錯誤：端口已被使用
- 使用不同的端口號
- 或關閉佔用端口的其他應用

### 錯誤：找不到 node_modules
- 運行：`npm install`
- 如果網絡有問題，使用：`npm install --legacy-peer-deps`
