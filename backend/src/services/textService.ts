import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PostContent {
  originalText: string;
  localizedText: string;
  author?: {
    name: string;
    username: string;
    avatar?: string;
  };
  timestamp?: string;
  stats?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

const cleanTwitterText = (text: string): string => {
  return text
    // 移除 @ 開頭的用戶名
    .replace(/@\w+\s*/g, '')
    // 移除 t.co 連結
    .replace(/https:\/\/t\.co\/\w+/g, '')
    // 移除多餘的空格
    .trim();
};

export const getPostContent = async (url: string): Promise<PostContent> => {
  try {
    const { stdout } = await execAsync(`yt-dlp -j "${url}"`);
    const info = JSON.parse(stdout);
    
    // 清理原始文案
    const originalText = cleanTwitterText(info.description || '');

    // 初始化返回對象
    const result: PostContent = {
      originalText,
      localizedText: '',  // 先初始化為空
      author: {
        name: info.uploader || '',
        username: info.uploader_id || '',
        avatar: info.thumbnail || '',
      },
      timestamp: info.upload_date || '',
      stats: {
        likes: info.like_count || 0,
        retweets: info.repost_count || 0,
        replies: info.comment_count || 0,
      }
    };

    // 只有在有文案時才進行本地化
    if (originalText) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一位專業的台灣社群媒體文案編輯，擅長將文案轉換成台灣網路用語風格。你的翻譯要簡潔有力，避免冗長，並且完全符合台灣的用語習慣。"
          },
          {
            role: "user",
            content: `請將以下文案改寫成台灣網路用語風格，要求：
            1. 保持原意，不要過度發揮
            2. 使用台灣本地的網路用語，完全避免中國用語
            3. 適量使用台灣常見的表情符號，不要過度
            4. 確保語言組織通順，避免生硬的翻譯感
            5. 簡潔有力，不要冗長
            6. 不要添加任何網址或@標記
            
            原文：${originalText}`
          }
        ]
      });

      result.localizedText = completion.choices[0]?.message?.content || '';
    }

    return result;
  } catch (error) {
    console.error('取得文案失敗:', error);
    throw error;
  }
}; 