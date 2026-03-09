import { db } from '@/lib/db';
import { PromptHistory } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export const promptModel = {
  // 创建prompt历史记录
  async createHistory(data: Omit<PromptHistory, 'id' | 'created_at'>): Promise<PromptHistory> {
    const id = uuidv4();
    const sql = `
      INSERT INTO prompt_history (
        id, user_id, content, svg_id, status, error_message
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(sql, [
      id,
      data.user_id,
      data.content,
      data.svg_id,
      data.status,
      data.error_message
    ]);

    return this.findHistoryById(id);
  },

  // 查找prompt历史记录
  async findHistoryById(id: string): Promise<PromptHistory | null> {
    const sql = 'SELECT * FROM prompt_history WHERE id = ?';
    const histories = await db.query<PromptHistory[]>(sql, [id]);
    return histories[0] || null;
  },

  // 获取用户的prompt历史记录
  async getUserHistory(userId: string, page = 1, limit = 10): Promise<{ items: PromptHistory[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [items, [{ total }]] = await Promise.all([
      db.query<PromptHistory[]>(
        'SELECT * FROM prompt_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      ),
      db.query<[{ total: number }]>(
        'SELECT COUNT(*) as total FROM prompt_history WHERE user_id = ?',
        [userId]
      )
    ]);

    return { items, total };
  }
}; 