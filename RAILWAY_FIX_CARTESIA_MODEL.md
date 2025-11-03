# 🔧 Railway 環境變數修復指南

## ❌ 發現的錯誤

**`CARTESIA_TTS_MODEL_ID` 值錯誤**

- ❌ **當前值**：`tts-1` (這是 OpenAI TTS 的模型ID，不是 Cartesia 的)
- ✅ **正確值**：`sonic-3` (Cartesia TTS 模型)

## 🔧 修復步驟

### 1. 訪問 Railway 環境變數頁面

https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/service/9b21f4d0-1f19-4518-9b58-bc364622fde2/variables?environmentId=1f3f7d15-4668-4bb1-9982-56f3dfe92743

### 2. 修改 `CARTESIA_TTS_MODEL_ID`

1. 找到 `CARTESIA_TTS_MODEL_ID` 變數
2. 點擊編輯（或眼睛圖標顯示值）
3. 將值從 `tts-1` 改為 `sonic-3`
4. 保存

### 3. 驗證其他變數

確認以下變數的值都是正確的：

| 變數名 | 正確值 | 當前值（如果不同需修改） |
|--------|--------|------------------------|
| `CARTESIA_TTS_MODEL_ID` | `sonic-3` | ❌ `tts-1` → 需修改 |
| `CARTESIA_SAMPLE_RATE` | `44100` | ✅ 已正確 |
| `CARTESIA_LANGUAGE` | `zh` | ✅ 應為 `zh` |
| `CARTESIA_VOICE_ID` | `d3cb9a1f-73d1-48d4-8ee9-53183b40e284` | ✅ 格式正確 |

## ✅ 修復後

1. Railway 會自動重新部署
2. 部署完成後，聲音播放功能應該恢復正常
3. 測試：發送一條消息，確認聲音可以正常播放

## 📝 說明

- `tts-1` 是 OpenAI TTS 的模型ID
- Cartesia 使用的是 `sonic-3` 模型
- 這是導致 TTS 失敗的主要原因

