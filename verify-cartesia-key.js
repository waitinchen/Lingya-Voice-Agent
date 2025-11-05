/**
 * 驗證 Cartesia API Key 格式和有效性
 */

const newKey = "sk_car_oKdwNrwqmegsmQF3AeycKq";
const oldKey = "sk_car_swxgArAzEefrT5gm3FX1Xf";

console.log("🔍 驗證 Cartesia API Key 格式...\n");

// 1. 檢查新 Key 格式
console.log("1️⃣ 新 Key 格式檢查:");
console.log(`   新 Key: ${newKey}`);
console.log(`   長度: ${newKey.length} 字符`);
console.log(`   前綴: ${newKey.startsWith('sk_car_') ? '✅ 正確' : '❌ 錯誤'}`);
console.log();

// 2. 對比舊 Key
console.log("2️⃣ 對比舊 Key:");
console.log(`   舊 Key: ${oldKey} (${oldKey.length} 字符)`);
console.log(`   新 Key: ${newKey} (${newKey.length} 字符)`);
console.log(`   長度差異: ${newKey.length - oldKey.length} 字符`);
console.log();

// 3. 檢查新 Key
console.log("3️⃣ 新 Key 分析:");
const isValidFormat = newKey.startsWith('sk_car_') && newKey.length >= 30;
const hasValidChars = /^[a-zA-Z0-9_]+$/.test(newKey);

console.log(`   格式正確: ${isValidFormat ? '✅' : '❌'}`);
console.log(`   字符有效: ${hasValidChars ? '✅' : '❌'}`);
console.log(`   長度: ${newKey.length} 字符 ${newKey.length >= 40 ? '✅ (正常)' : newKey.length >= 30 ? '⚠️ (可能稍短)' : '❌ (太短)'}`);
console.log();

// 4. 驗證結果
if (newKey.length < 30) {
  console.log("❌ 錯誤: Key 長度太短，可能不完整");
} else if (newKey.length < 40) {
  console.log("⚠️  警告: Key 長度較短，但可能仍然有效");
  console.log("   建議：測試 Key 是否有效");
} else {
  console.log("✅ Key 長度正常");
}

if (!newKey.startsWith('sk_car_')) {
  console.log("❌ 錯誤: Key 格式不正確，應該以 'sk_car_' 開頭");
} else {
  console.log("✅ Key 格式正確");
}

console.log("\n💡 建議:");
console.log("   1. 在 Cartesia Dashboard 確認 API Key 的完整值");
console.log("   2. 確保在 Railway 中複製了完整的 Key（包括所有字符）");
console.log("   3. 檢查是否有額外的空格或換行符");
console.log("   4. 如果 Key 無效，請在 Cartesia Dashboard 重新生成");

