import { db } from '@/lib/db';
import { User } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export const userModel = {
  // 创建用户
  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = uuidv4();
    const sql = `
      INSERT INTO users (id, email, name, password_hash, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(sql, [
      id,
      data.email,
      data.name,
      data.password_hash,
      data.avatar_url,
      data.status
    ]);

    return this.findById(id);
  },

  // 通过ID查找用户
  async findById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await db.query<User[]>(sql, [id]);
    return users[0] || null;
  },

  // 通过邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await db.query<User[]>(sql, [email]);
    return users[0] || null;
  },

  // 更新用户信息
  async update(id: string, data: Partial<User>): Promise<User> {
    const fields = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const sql = `UPDATE users SET ${fields} WHERE id = ?`;
    await db.query(sql, [...Object.values(data), id]);
    
    return this.findById(id);
  }
}; 