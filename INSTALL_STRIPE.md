# 安裝 Stripe 套件

## 步驟

請在終端執行以下命令：

```bash
cd /Users/chakfungtam/Downloads/Assignment-Terminator-main
npm install stripe @stripe/stripe-js
```

## 如果遇到依賴衝突

使用以下命令：

```bash
npm install stripe @stripe/stripe-js --legacy-peer-deps
```

## 修復安全漏洞（可選）

安裝完成後，可以運行：

```bash
npm audit fix
```

## 驗證安裝

檢查是否安裝成功：

```bash
npm list stripe @stripe/stripe-js
```

應該會看到兩個套件都列出來了。

## 啟動服務器

安裝完成後，啟動開發服務器：

```bash
npm run dev
```

然後在瀏覽器打開：http://localhost:3000
