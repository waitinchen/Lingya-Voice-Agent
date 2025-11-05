# 🖼️ 頭像設置指南

## 當前狀態

頭像已配置為使用圖片：`/images/huangrong-avatar.jpg`

## 設置步驟

### 1. 準備圖片文件

- 文件名：`huangrong-avatar.jpg`（必須是這個名字）
- 格式：JPG、PNG 或 WebP
- 建議尺寸：200x200 像素或更大（正方形最佳）
- 圖片會自動裁剪為圓形顯示

### 2. 上傳圖片

將圖片文件放到：`public/images/huangrong-avatar.jpg`

### 3. 驗證

1. 確保文件路徑正確：`public/images/huangrong-avatar.jpg`
2. 刷新頁面
3. 頭像應該顯示為圖片

## 如果圖片無法顯示

### 檢查清單

1. ✅ 文件是否存在？
   - 檢查 `public/images/huangrong-avatar.jpg` 是否存在

2. ✅ 文件名是否正確？
   - 必須是 `huangrong-avatar.jpg`（大小寫敏感）

3. ✅ 服務器是否重啟？
   - 在 Railway 上，文件上傳後需要重新部署

4. ✅ 瀏覽器緩存？
   - 嘗試強制刷新（Ctrl+F5 或 Cmd+Shift+R）

### 備用方案

如果圖片無法載入，系統會自動顯示 🌸 emoji 作為備用頭像。

## Railway 部署注意事項

在 Railway 上，圖片文件需要：
1. 提交到 Git 倉庫
2. 或者使用 Railway 的文件上傳功能
3. 或者使用外部圖片 URL（如 CDN）

### 使用外部圖片 URL

如果想使用外部圖片，可以修改 CSS：

```css
background-image: url('https://your-image-url.com/huangrong.jpg');
```

## 當前配置

- 圖片路徑：`/images/huangrong-avatar.jpg`
- 備用顯示：🌸 emoji
- 自動檢測：如果圖片載入失敗，自動顯示備用頭像

