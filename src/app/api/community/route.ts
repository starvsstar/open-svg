import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 添加类型定义
interface CommunityResponse {
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    svg_content: string;
    created_at: Date;
    is_public: boolean;
    is_official: boolean;
    view_count: number;
    like_count: number;
    share_count: number;
    creator_name: string;
    creator_avatar: string | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: 获取社区 SVG 列表
 *     tags: [社区]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *         default: 1
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular, trending, random]
 *         description: 排序方式
 *         default: latest
 *       - in: query
 *         name: official
 *         schema:
 *           type: boolean
 *         description: 是否只显示官方SVG
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功返回SVG列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: 服务器错误
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'latest';
    const isOfficial = searchParams.get('official') === 'true';
    const search = searchParams.get('search');
    const limit = 12;
    const skip = (page - 1) * limit;

    // 构建基础查询条件
    const where: any = {
      is_public: true,
    };

    // 处理官方SVG筛选
    if (isOfficial) {
      where.is_official = true;
    }

    // 添加搜索条件
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 构建排序条件 - 修复：将排序条件定义移到这里
    let orderBy: any;
    switch (sort) {
      case 'latest':
        orderBy = { created_at: 'desc' };
        break;
      case 'popular':
        orderBy = { view_count: 'desc' };
        break;
      case 'trending':
        orderBy = { like_count: 'desc' };
        break;
      case 'random':
        orderBy = { created_at: 'desc' }; // 随机排序的默认排序
        break;
      default:
        orderBy = { created_at: 'desc' };
    }

    // 获取总数
    const total = await db.svgs.count({ where });

    // 获取数据
    const items = await db.svgs.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        share_count: true,
        users: {
          select: {
            name: true,
            avatar_url: true,
          }
        }
      }
    });

    // 如果是随机排序，手动打乱数组
    const finalItems = sort === 'random'
      ? items.sort(() => Math.random() - 0.5)
      : items;

    // 处理返回数据
    const processedItems = finalItems.map(item => ({
      ...item,
      creator_name: item.users?.name ?? 'Anonymous',
      creator_avatar: item.users?.avatar_url ?? null,
    }));

    // 返回响应
    return NextResponse.json({
      items: processedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error in GET /api/community:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 