import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from 'crypto';

// 创建 SVG 相关的数据库操作函数
export const svgOperations = {
  async create({ title, svg_content, user_id, is_public, category }) {
    try {
      // 1. 创建 SVG
      const svg = await db.svgs.create({
        data: {
          id: crypto.randomUUID(),
          title,
          svg_content,
          is_public: is_public ?? false,
          created_at: new Date(),
          updated_at: new Date(),
          users: {
            connect: {
              id: user_id
            }
          },
          view_count: 0,
          like_count: 0,
          share_count: 0,
          favorite_count: 0,
          forward_count: 0,
          is_official: false
        }
      });

      // 2. 如果提供了分类，创建标签关联
      if (category) {
        // 先查找或创建标签
        const tag = await db.tags.upsert({
          where: { name: category },
          create: { 
            id: crypto.randomUUID(),
            name: category
          },
          update: {}
        });

        // 创建关联
        await db.svg_tags.create({
          data: {
            svg_id: svg.id,
            tag_id: tag.id
          }
        });
      }

      // 3. 创建版本记录
      await db.svg_versions.create({
        data: {
          id: crypto.randomUUID(),
          svg_id: svg.id,
          svg_content,
          version_number: 1,
          created_by: user_id,
          created_at: new Date()
        }
      });

      return svg;
    } catch (error) {
      logger.log('error', 'Failed in svgOperations.create', {
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'create',
        title,
        user_id,
        category
      });
      throw error;
    }
  },

  async delete(id: string, user_id: string) {
    const svg = await db.svgs.findUnique({
      where: { id },
      select: { user_id: true }
    });

    if (!svg) {
      throw new Error("SVG not found");
    }

    if (svg.user_id !== user_id) {
      throw new Error("Unauthorized");
    }

    return await db.$transaction(async (tx) => {
      await tx.svgVersion.deleteMany({ where: { svg_id: id } });
      return await tx.svg.delete({ where: { id } });
    }, {
      timeout: 10000 // 10 秒超时
    });
  },

  async getUserSvgs(user_id: string) {
    return await db.svgs.findMany({
      where: { user_id },
      include: {
        user: {
          select: {
            name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' }
    });
  }
};