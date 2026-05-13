# 專案筆記與協作規則

## 使用者背景

- 使用者叫 Hank。
- Hank 擅長 C code、Python、通訊原理。
- Hank 對網頁前端、後端不熟；解釋時請用大白話，不要一開始就丟太多前後端術語。

## 專案一句話說明

這是一個用 Next.js 做的「顧客資料卡」小型網頁工具。它讓使用者在瀏覽器裡填寫顧客基本資料、膚況/興趣、目前使用產品、購買紀錄與美容顧問備註，並且可以列印。

## 技術棧

- 框架：Next.js，使用 App Router，也就是 `app/` 目錄結構。
- UI：React client component，主要邏輯在瀏覽器端執行。
- 語言：TypeScript。
- 樣式：一般 CSS，集中在 `app/globals.css`。
- 套件管理：npm，依賴版本記在 `package.json` 和 `package-lock.json`。
- 沒有看到後端 API、資料庫、登入系統或伺服器端資料保存。

## 常用指令

- 開發模式：`npm run dev`
- 正式建置：`npm run build`
- 啟動正式版：`npm run start`
- TypeScript 檢查：`npm run typecheck`

## 主要檔案

- `app/page.tsx`
  - 首頁，也是顧客資料卡填寫頁。
  - 使用 `"use client"`，代表這頁主要跑在使用者瀏覽器裡。
  - 管理表單狀態、購買紀錄列、儲存、清空、列印、開啟顧客列表等互動。

- `app/customers/page.tsx`
  - 已儲存顧客列表頁。
  - 可以搜尋姓名、手機、電話、Email。
  - 點選顧客後會回到首頁並載入該顧客資料。

- `app/customerStore.ts`
  - 顧客資料的資料層。
  - 負責讀寫瀏覽器 `localStorage`。
  - 有舊資料格式轉移邏輯：會把 `customer-card-form-v1` 搬到新的 `customer-card-customers-v2`。
  - 顧客判斷主要靠姓名和手機；儲存時會新增或更新顧客。

- `app/layout.tsx`
  - Next.js 根 layout。
  - 設定 metadata，並引入全域 CSS。

- `app/globals.css`
  - 全站樣式。
  - 把畫面設計成紙本表單風格，有列印樣式 `@media print`。
  - 手機寬度下有 responsive 排版。

- `customer-card.html`
  - 一個獨立 HTML 版本，看起來像 Next.js 版之前或備份用的單檔版本。
  - 它不是目前 Next.js app 的主要入口。

## 資料保存方式

這個專案目前不是把資料存到資料庫，而是存在瀏覽器自己的 `localStorage` 裡。

大白話說：資料是存在「這台電腦、這個瀏覽器」裡。換電腦、換瀏覽器、清除瀏覽器資料，都可能看不到原本儲存的顧客資料。

目前使用到的 localStorage key：

- `customer-card-form-v1`：舊版單筆表單資料。
- `customer-card-customers-v2`：新版多顧客資料。
- `customer-card-selected-customer`：目前選到哪一位顧客。

## 頁面流程

1. 首頁 `/` 顯示顧客資料卡。
2. 填姓名和手機後，按儲存會寫入 `localStorage`。
3. `/customers` 顯示已儲存顧客清單。
4. 在清單點某位顧客，會回到 `/?customerId=...` 並載入資料。
5. `/?new=1` 會開一張新的空白資料卡。

## 目前觀察到的注意事項

- 多個 `.tsx` 和 `.html` 檔案裡的中文畫面文字目前看起來有亂碼，像是「顧客資料卡」被顯示成亂碼。這可能是之前檔案編碼或轉碼出問題。
- `AGENTS.md` 原本也有亂碼版的使用者說明，已整理成正常中文。
- 修改畫面文字前，最好先確認原本想表達的繁體中文內容，避免把亂碼直接當成正確字串。
- 因為資料存在瀏覽器端，若未來 Hank 想要「多台電腦共用資料」或「資料不要因清瀏覽器而消失」，就需要加後端或資料庫。

## 開發提醒

- 這是前端為主的專案；現在沒有真正的後端。
- 改表單欄位時，要同步注意：
  - `app/page.tsx` 的初始欄位。
  - `app/customerStore.ts` 的資料正規化邏輯。
  - `localStorage` 舊資料是否需要相容。
- 改版面時，主要看 `app/globals.css`。
- 改完程式後建議跑 `npm run typecheck`，若有改到實際畫面，再用瀏覽器檢查 `/` 和 `/customers`。
