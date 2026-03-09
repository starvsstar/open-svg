import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/my-svgs:
 *   get:
 *     summary: 获取我的SVG列表
 *     tags: [我的SVG]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, published, private]
 *         description: 筛选条件
 *         default: all
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, name, created]
 *         description: 排序方式
 *         default: recent
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，从1开始
 *         default: 1
 *       - in: query
         name: pageSize
         schema:
           type: integer
         description: 每页条数
         default: 16
       - in: query
         name: search
         schema:
           type: string
         description: 搜索关键词，支持按标题搜索
 *     responses:
 *       200:
 *         description: 成功返回SVG列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MySvgsResponse'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const sort = searchParams.get('sort') || 'recent';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '16');

    // 验证分页参数
    const validatedPage = page > 0 ? page : 1;
    const validatedPageSize = pageSize > 0 ? pageSize : 16;
    
    // 计算跳过的记录数
    const skip = (validatedPage - 1) * validatedPageSize;

    // 构建查询条件
    const where = {
      user_id: session.user.id,
      ...(filter === 'published' && { is_public: true }),
      ...(filter === 'private' && { is_public: false }),
      // 如果需要处理 'shared' 过滤器，需要添加相应的条件
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as const
        }
      })
    };

    // 构建排序条件
    const orderBy = {
      ...(sort === 'recent' && { created_at: 'desc' }),
      ...(sort === 'name' && { title: 'asc' }),
      ...(sort === 'created' && { created_at: 'asc' }),
    };

    // 获取分页数据
    const items = await prisma.svgs.findMany({
      where,
      orderBy,
      skip,
      take: validatedPageSize,
      select: {
        id: true,
        title: true,
        description: true,
        svg_content: true,
        created_at: true,
        is_public: true,
        is_official: true,
        view_count: true,
        like_count: true,
        users: {
          select: {
            name: true,
            avatar_url: true,
          }
        }
      }
    });

    // 获取总记录数
    const total = await prisma.svgs.count({ where });
    
    // 计算总页数
    const totalPages = Math.ceil(total / validatedPageSize);

    // 格式化响应数据
    const formattedItems = items.map(item => ({
      ...item,
      creator_name: item.users?.name || '',
      creator_avatar: item.users?.avatar_url || null,
      users: undefined // 移除嵌套的 users 对象
    }));

    return NextResponse.json(
      {
        items: formattedItems,
        pagination: {
          total,
          page: validatedPage,
          pageSize: validatedPageSize,
          totalPages
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120',
        }
      }
    );

  } catch (error) {
    console.error('Error in my-svgs route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}