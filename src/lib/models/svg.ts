import { db } from '@/lib/db';
import { SVG } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export const svgModel = {
  // 创建SVG
  async create(data: Omit<SVG, 'id' | 'created_at' | 'updated_at'>): Promise<SVG> {
    const id = uuidv4();
    const sql = `
      INSERT INTO svgs (
        id, user_id, title, description, svg_content, 
        prompt_id, is_public, view_count, like_count, 
        share_count, favorite_count, forward_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(sql, [
      id,
      data.user_id,
      data.title,
      data.description,
      data.svg_content,
      data.prompt_id,
      data.is_public,
      0, 0, 0, 0, 0 // 初始化计数
    ]);

    return this.findById(id);
  },

  // 查找SVG
  async findById(id: string): Promise<SVG | null> {
    const sql = 'SELECT * FROM svgs WHERE id = ?';
    const svgs = await db.query<SVG[]>(sql, [id]);
    return svgs[0] || null;
  },

  // 获取用户的SVG列表
  async findByUserId(userId: string, page = 1, limit = 10): Promise<{ items: SVG[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [items, [{ total }]] = await Promise.all([
      db.query<SVG[]>(
        'SELECT * FROM svgs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      ),
      db.query<[{ total: number }]>(
        'SELECT COUNT(*) as total FROM svgs WHERE user_id = ?',
        [userId]
      )
    ]);

    return { items, total };
  },

  // 获取公共SVG列表
  async findPublic(page = 1, limit = 10): Promise<{ items: SVG[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [items, [{ total }]] = await Promise.all([
      db.query<SVG[]>(
        'SELECT * FROM svgs WHERE is_public = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      ),
      db.query<[{ total: number }]>(
        'SELECT COUNT(*) as total FROM svgs WHERE is_public = TRUE'
      )
    ]);

    return { items, total };
  },

  // 更新SVG
  async update(id: string, data: Partial<SVG>): Promise<SVG> {
    const fields = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const sql = `UPDATE svgs SET ${fields} WHERE id = ?`;
    await db.query(sql, [...Object.values(data), id]);
    
    return this.findById(id);
  },

  // 增加查看次数
  async incrementViewCount(id: string): Promise<void> {
    await db.query(
      'UPDATE svgs SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
  }
}; 