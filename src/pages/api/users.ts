import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - 用户管理
 *     summary: 获取用户列表
 *     description: 返回所有用户的列表
 *     responses:
 *       200:
 *         description: 成功返回用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 用户ID
 *                   name:
 *                     type: string
 *                     description: 用户名称
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // 您的处理逻辑
    res.status(200).json([
      { id: 1, name: '用户1' },
      { id: 2, name: '用户2' }
    ]);
  }
} 