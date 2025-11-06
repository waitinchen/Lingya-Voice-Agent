/**
 * 使用 ffmpeg 进行音频格式转换和合并
 * 提供更精确的音频处理能力
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 检查 ffmpeg 是否可用
 */
async function checkFFmpegAvailable() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * 使用 ffmpeg 合并音频文件
 * @param {Array<Object>} audioChunks - 音频 chunks
 * @param {string} audioChunks[].audio - Base64 编码的音频数据或文件路径
 * @param {string} audioChunks[].format - 音频格式
 * @param {Object} options - 选项
 * @returns {Promise<Buffer>} 合并后的音频 Buffer
 */
export async function mergeAudioWithFFmpeg(audioChunks, options = {}) {
  const {
    outputFormat = 'webm',
    sampleRate = 16000,
    channels = 1,
  } = options;

  // 检查 ffmpeg 是否可用
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.warn('⚠️ ffmpeg 不可用，使用简单合并方法');
    // 降级到简单合并
    const { mergeAudioChunks } = await import('./audio-processor.js');
    return mergeAudioChunks(audioChunks);
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFiles = [];
  const cleanupFiles = [];

  try {
    // 1. 将所有 chunks 保存为临时文件
    for (let i = 0; i < audioChunks.length; i++) {
      const chunk = audioChunks[i];
      const tempFile = path.join(tempDir, `chunk-${Date.now()}-${i}.${chunk.format || 'webm'}`);
      
      if (typeof chunk.audio === 'string') {
        // Base64 数据
        const buffer = Buffer.from(chunk.audio, 'base64');
        fs.writeFileSync(tempFile, buffer);
      } else if (Buffer.isBuffer(chunk.audio)) {
        // Buffer 数据
        fs.writeFileSync(tempFile, chunk.audio);
      } else {
        throw new Error(`不支持的音频数据格式: ${typeof chunk.audio}`);
      }
      
      tempFiles.push(tempFile);
      cleanupFiles.push(tempFile);
    }

    // 2. 创建 concat 文件列表
    const concatFile = path.join(tempDir, `concat-${Date.now()}.txt`);
    const concatContent = tempFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatFile, concatContent);
    cleanupFiles.push(concatFile);

    // 3. 使用 ffmpeg 合并
    const outputFile = path.join(tempDir, `merged-${Date.now()}.${outputFormat}`);
    cleanupFiles.push(outputFile);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-ar', sampleRate.toString(),
        '-ac', channels.toString(),
        '-y', // 覆盖输出文件
        outputFile,
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg 合并失败 (code: ${code}): ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`ffmpeg 启动失败: ${error.message}`));
      });
    });

    // 4. 读取合并后的文件
    const mergedBuffer = fs.readFileSync(outputFile);

    return mergedBuffer;
  } finally {
    // 5. 清理临时文件
    for (const file of cleanupFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`⚠️ 清理临时文件失败: ${file}`, error.message);
      }
    }
  }
}

/**
 * 转换音频格式
 * @param {Buffer|string} inputAudio - 输入音频（Buffer 或文件路径）
 * @param {string} inputFormat - 输入格式
 * @param {string} outputFormat - 输出格式
 * @param {Object} options - 选项
 * @returns {Promise<Buffer>} 转换后的音频 Buffer
 */
export async function convertAudioFormat(inputAudio, inputFormat, outputFormat, options = {}) {
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    throw new Error('ffmpeg 不可用，无法转换音频格式');
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const inputFile = typeof inputAudio === 'string' 
    ? inputAudio 
    : path.join(tempDir, `input-${Date.now()}.${inputFormat}`);
  const outputFile = path.join(tempDir, `output-${Date.now()}.${outputFormat}`);

  const cleanupFiles = [];

  try {
    // 如果是 Buffer，先保存为文件
    if (Buffer.isBuffer(inputAudio)) {
      fs.writeFileSync(inputFile, inputAudio);
      cleanupFiles.push(inputFile);
    }
    cleanupFiles.push(outputFile);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputFile,
        '-y',
        outputFile,
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg 转换失败 (code: ${code}): ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`ffmpeg 启动失败: ${error.message}`));
      });
    });

    // 读取转换后的文件
    const outputBuffer = fs.readFileSync(outputFile);
    return outputBuffer;
  } finally {
    // 清理临时文件
    for (const file of cleanupFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`⚠️ 清理临时文件失败: ${file}`, error.message);
      }
    }
  }
}

