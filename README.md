# HR Helper - 專業抽籤與分組工具

這是一個專為 HR 設計的輕量化自動化工具，支援名單匯入、重複偵測、隨機抽籤以及智能分組功能。

## 🌟 核心功能

- **名單管理**：支援手動貼上、CSV 檔案上傳，內建重複姓名偵測。
- **挑選模式**：匯入名單後可先在「候選池」進行勾選，確認後再正式加入。
- **隨機抽籤**：具備視覺效果的抽籤功能，支援歷史記錄追蹤。
- **自動分組**：可自定義每組人數，一鍵生成隨機分組結果。
- **報告匯出**：分組結果可匯出為結構化的 .txt 報告，並支援自選儲存路徑。

## 🚀 快速開始

### 前置需求
- Node.js (建議 v18 以上)

### 本地開發
1. **複製專案並安裝套件**：
   ```bash
   npm install
   ```

2. **設定環境變數**：
   複製 `.env.example` 為 `.env.local` 並填入必要的 API Key：
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   啟動後請訪問：`http://localhost:3000`

## 📦 部署說明

本專案已整合 **GitHub Actions**，只要將程式碼推送到 `main` 分支，系統將會自動啟動部署流程：

1. 確保 GitHub 儲存庫的 **Settings > Secrets and variables > Actions** 中設定了 `GEMINI_API_KEY`。
2. 推送至 `main`：
   ```bash
   git add .
   git commit -m "feat: update project"
   git push origin main
   ```
3. 部署成功後，網站將運行於 GitHub Pages。

## 🛠️ 技術棧
- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Utilities**: Lucide React, PapaParse, Canvas Confetti

## 📜 專案規範 (S.O.L.I.D)
本專案遵循 SOLID 設計原則開發，確保程式碼具備良好的可擴展性與維護性。所有重要功能皆附有中文註解，方便後續開發。
