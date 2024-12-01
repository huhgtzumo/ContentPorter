# X 貼文影片搬運工具 🎥

一個簡單易用的工具，幫助您下載和本地化 X (Twitter) 上的影片和文案。

## 功能特色 ✨

- 🎬 下載 X 平台影片
- 📊 支援多種影片品質選擇
- 📝 自動將文案翻譯成台灣本地用語
- 🔄 即時下載進度顯示
- 🎯 簡潔直觀的使用界面

## 技術架構 🛠

### 前端
- ⚛️ React + TypeScript
- 🎨 Material-UI
- 🔌 WebSocket 即時通訊
- 📡 Vite 開發伺服器

### 後端
- 🚀 Node.js + Express
- 🔒 環境變數配置
- 📦 yt-dlp 影片下載
- 🤖 OpenAI API 文案本地化
- 🔄 WebSocket 進度推送

## 安裝步驟 📥

1. **安裝依賴**
```bash
# 安裝 yt-dlp
brew install yt-dlp

# 安裝前端依賴
cd frontend
npm install

# 安裝後端依賴
cd backend
npm install
```

2. **環境設定**
```bash
# 複製並設定環境變數
cp backend/.env.example backend/.env
# 編輯 .env 文件，設定必要的環境變數
```

3. **啟動服務**
```bash
# 啟動後端
cd backend
npm run dev

# 啟動前端 (新開終端機)
cd frontend
npm run dev
```

## 使用方法 📖

1. 🔗 複製 X 貼文連結
2. 📋 貼上連結到輸入框
3. 🔍 點擊「取得影片資訊」
4. 📊 選擇想要的影片品質
5. ⬇️ 點擊「下載影片」
6. 📝 查看並複製本地化文案

## 注意事項 ⚠️

- 🔒 請確保有足夠的硬碟空間
- 🌐 需要穩定的網路連接
- 🔑 需要設定 OpenAI API 金鑰
- 📱 建議使用桌面瀏覽器

## 授權 📄

MIT License

## 貢獻 🤝

歡迎提出 Issue 和 Pull Request！

---
Made with ❤️ in Taiwan 