# SFX 音效文件目錄

此目錄用於存放情緒標籤系統使用的短音效文件。

## 需要的音效文件

根據 `config/emotion-presets.json` 配置，以下音效會被使用：

1. `breath-soft-120.wav` - 輕柔呼吸聲（120ms）
   - 用於 `whisper` 標籤

2. `breath-mid-200.wav` - 中等呼吸聲（200ms）
   - 用於 `breathy` 標籤

3. `giggle-80.wav` - 輕笑聲（80ms）
   - 用於 `excited` 標籤

## 注意事項

- 目前音效功能為預留，實際合成時會先使用文字提示（textCues）
- 未來可以實作音效插入功能
- 音效文件應為 WAV 格式，短小精緻（< 500ms）

## 範例來源

可以從以下來源獲取或製作音效：
- Freesound.org
- 自行錄製
- AI 生成

目前可以暫時為空，系統會正常工作（只是不插入音效）。

