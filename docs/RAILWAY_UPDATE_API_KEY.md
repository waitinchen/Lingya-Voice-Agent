# 🔑 更新 Railway Cartesia API Key 指南

## 新 API Key

**用戶提供的 Key：**
```
sk_car_oKdwNrwqmegsmQF3AeycKq
```

**Railway 中顯示的 Key：**
```
sk_car_oKdwNrwqmegsmQF3Aeyckq
```

**⚠️ 重要：** Railway 中的 Key 最後是 `eyckq`（小寫 k），而用戶提供的 Key 是 `eycKq`（大寫 K）。

**請確認：**
1. 在 Cartesia Dashboard 中，這個 Key 的完整值是什麼？
2. 如果 Dashboard 中是大寫 `K`（`eycKq`），請更新 Railway 中的值
3. 如果 Dashboard 中是小寫 `k`（`eyckq`），則當前設置正確

**驗證結果：**
- ✅ 格式正確（以 `sk_car_` 開頭）
- ✅ 字符有效
- ⚠️ 長度：29 字符（可能稍短，但可能仍然有效）

## 更新步驟

### 1. 登錄 Railway Dashboard
訪問：https://railway.com/project/8f93ae2d-2c2e-462d-8ad3-2a5819938e6f/service/9b21f4d0-1f19-4518-9b58-bc364622fde2/variables

### 2. 找到 CARTESIA_API_KEY 變數
在 "9 Service Variables" 列表中，找到 `CARTESIA_API_KEY`

### 3. 更新值
1. 點擊 `CARTESIA_API_KEY` 行
2. 將值更新為：`sk_car_oKdwNrwqmegsmQF3AeycKq`
3. 確認沒有多餘的空格或換行符
4. 保存

### 4. 等待重新部署
Railway 會自動檢測環境變數變更並重新部署（通常 1-3 分鐘）

### 5. 驗證
部署完成後：
1. 刷新應用頁面
2. 發送一條測試消息
3. 檢查語音是否正常生成

## 驗證 Key 是否有效

如果更新後仍然有問題，可以運行本地測試：

```bash
# 在本地 .env 文件中設置新 Key
CARTESIA_API_KEY=sk_car_oKdwNrwqmegsmQF3AeycKq

# 運行測試
node test-cartesia-api.js
```

如果測試成功，說明 Key 有效，問題可能在 Railway 配置上。
如果測試失敗，請檢查：
- Key 是否完整複製
- Key 是否在 Cartesia Dashboard 中有效
- 網絡連接是否正常

