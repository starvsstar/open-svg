const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SVG Admin API',
      version: '1.0.0',
      description: 'SVG 管理后台 API 文档',
    },
    servers: [
      {
        url: '/api',
        description: 'API服务器',
      },
    ],
    components: {
      schemas: {
        SVG: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            is_public: { type: 'boolean', description: '是否公开' },
            is_official: { type: 'boolean', description: '是否官方' },
            user_id: { type: 'string', description: '创建者ID' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' },
            updated_at: { type: 'string', format: 'date-time', description: '更新时间' }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '消息ID' },
            content: { type: 'string', description: '消息内容' },
            role: { 
              type: 'string', 
              enum: ['user', 'assistant'],
              description: '消息发送者角色' 
            },
            timestamp: { 
              type: 'string', 
              format: 'date-time',
              description: '消息时间戳' 
            }
          }
        },
        CommunityItem: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            description: { type: 'string', nullable: true, description: 'SVG 描述' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' },
            is_public: { type: 'boolean', description: '是否公开' },
            is_official: { type: 'boolean', description: '是否官方' },
            view_count: { type: 'integer', description: '查看次数' },
            like_count: { type: 'integer', description: '点赞数' },
            share_count: { type: 'integer', description: '分享次数' },
            creator_name: { type: 'string', description: '创建者名称' },
            creator_avatar: { type: 'string', nullable: true, description: '创建者头像' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CommunityItem' }
            },
            total: { type: 'integer', description: '总记录数' },
            page: { type: 'integer', description: '当前页码' },
            totalPages: { type: 'integer', description: '总页数' }
          }
        },
        RecentEdit: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            updated_at: { type: 'string', format: 'date-time', description: '更新时间' },
            svg_content: { type: 'string', description: 'SVG 内容' }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            dailyTrend: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date', description: '日期' },
                  svgs: { type: 'integer', description: 'SVG 数量' }
                }
              }
            },
            monthlyTrend: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: '月份 (YYYY-MM)' },
                  svgs: { type: 'integer', description: 'SVG 数量' }
                }
              }
            },
            stats: {
              type: 'object',
              properties: {
                total: { type: 'integer', description: '总 SVG 数' },
                public: { type: 'integer', description: '公开 SVG 数' },
                personal: { type: 'integer', description: '私人 SVG 数' },
                shares: { type: 'integer', description: '分享数' },
                downloads: { type: 'integer', description: '下载数' }
              }
            }
          }
        },
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '反馈ID' },
            type: { 
              type: 'string', 
              enum: ['suggestion', 'bug', 'other'],
              description: '反馈类型' 
            },
            title: { type: 'string', description: '反馈标题' },
            description: { type: 'string', description: '反馈描述' },
            email: { type: 'string', format: 'email', description: '联系邮箱' },
            status: { 
              type: 'string',
              enum: ['pending', 'in_progress', 'resolved', 'rejected'],
              description: '处理状态'
            },
            created_at: { 
              type: 'string', 
              format: 'date-time', 
              description: '创建时间' 
            },
            user_id: { 
              type: 'string', 
              nullable: true, 
              description: '用户ID' 
            },
            user: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '用户名' },
                email: { type: 'string', format: 'email', description: '用户邮箱' }
              }
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: '消息角色'
            },
            content: {
              type: 'string',
              description: '消息内容'
            }
          }
        },
        GenerateRequest: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message'
              },
              description: '对话消息列表'
            },
            prompts: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '提示词列表'
            },
            sessionId: {
              type: 'string',
              description: '会话ID',
              default: 'default'
            }
          }
        },
        GenerateStats: {
          type: 'object',
          properties: {
            wordCount: {
              type: 'integer',
              description: '生成文本的字数'
            },
            tokenCount: {
              type: 'integer',
              description: '生成文本的token数'
            },
            model: {
              type: 'string',
              description: '使用的模型'
            },
            time: {
              type: 'integer',
              description: '生成耗时(毫秒)'
            }
          }
        },
        MySvgItem: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            description: { type: 'string', nullable: true, description: 'SVG 描述' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' },
            is_public: { type: 'boolean', description: '是否公开' },
            is_official: { type: 'boolean', description: '是否官方' },
            view_count: { type: 'integer', description: '查看次数' },
            like_count: { type: 'integer', description: '点赞数' },
            creator_name: { type: 'string', description: '创建者名称' },
            creator_avatar: { type: 'string', nullable: true, description: '创建者头像' }
          }
        },
        MySvgsResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/MySvgItem' }
            },
            total: { type: 'integer', description: '总记录数' }
          }
        },
        PromptTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '提示词模板ID' },
            title: { type: 'string', description: '标题' },
            content: { type: 'string', description: '提示词内容' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' },
            updated_at: { type: 'string', format: 'date-time', description: '更新时间' },
            is_public: { type: 'boolean', description: '是否公开' },
            like_count: { type: 'integer', description: '点赞数' },
            use_count: { type: 'integer', description: '使用次数' },
            created_by: { type: 'string', description: '创建者ID' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱'
            },
            username: {
              type: 'string',
              description: '用户名',
              minLength: 3,
              maxLength: 20
            },
            password: {
              type: 'string',
              description: '密码',
              minLength: 6,
              format: 'password'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '用户ID' },
            email: { type: 'string', format: 'email', description: '邮箱' },
            name: { type: 'string', description: '用户名' },
            status: { 
              type: 'string',
              enum: ['active', 'inactive', 'banned'],
              description: '用户状态'
            },
            created_at: { 
              type: 'string', 
              format: 'date-time', 
              description: '创建时间' 
            },
            updated_at: { 
              type: 'string', 
              format: 'date-time', 
              description: '更新时间' 
            }
          }
        },
        SVGExportRequest: {
          type: 'object',
          required: ['svg'],
          properties: {
            svg: {
              type: 'string',
              description: 'SVG 内容'
            }
          }
        },
        SVGExportResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'string',
              description: 'Base64 编码的 SVG 数据 URL'
            }
          }
        },
        SVGListResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SVG'
              }
            },
            total: {
              type: 'integer',
              description: '总记录数'
            },
            page: {
              type: 'integer',
              description: '当前页码'
            },
            totalPages: {
              type: 'integer',
              description: '总页数'
            }
          }
        },
        OfficialSVG: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            svg_content: { type: 'string', description: 'SVG 内容' }
          }
        },
        CreateSVGRequest: {
          type: 'object',
          required: ['title', 'svg_content'],
          properties: {
            title: { type: 'string', description: 'SVG 标题' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            is_public: { type: 'boolean', description: '是否公开' },
            category: { type: 'string', description: '分类' }
          }
        },
        UpdateSVGRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'SVG 标题' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            is_public: { type: 'boolean', description: '是否公开' },
            category: { type: 'string', description: '分类' }
          }
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '模板ID' },
            title: { type: 'string', description: '模板标题' },
            description: { type: 'string', nullable: true, description: '模板描述' },
            svg_content: { type: 'string', description: '模板SVG内容' },
            category: { type: 'string', description: '模板分类' },
            created_at: { 
              type: 'string', 
              format: 'date-time', 
              description: '创建时间' 
            },
            updated_at: { 
              type: 'string', 
              format: 'date-time', 
              description: '更新时间' 
            }
          }
        },
        TemplateResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '模板ID' },
            title: { type: 'string', description: '模板标题' },
            svg_content: { type: 'string', description: '模板SVG内容' }
          }
        },
        TemplateListResponse: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/Template' }
            },
            total: { type: 'integer', description: '总记录数' }
          }
        },
        SVGDetailResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'SVG ID' },
            title: { type: 'string', description: 'SVG 标题' },
            description: { type: 'string', nullable: true, description: 'SVG 描述' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            is_public: { type: 'boolean', description: '是否公开' },
            user_id: { type: 'string', description: '创建者ID' }
          }
        },
        SVGUpdateRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'SVG 标题' },
            svg_content: { type: 'string', description: 'SVG 内容' },
            is_public: { type: 'boolean', description: '是否公开' },
            category: { type: 'string', description: '分类' }
          }
        },
        SVGSuccessResponse: {
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              example: true,
              description: '操作是否成功'
            },
            data: {
              $ref: '#/components/schemas/SVG',
              description: 'SVG数据'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '错误信息'
            }
          }
        }
      },
      securitySchemes: {
        sessionAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '需要管理员权限'
        }
      },
      responses: {
        UnauthorizedError: {
          description: '未授权',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ForbiddenError: {
          description: '无权限',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFoundError: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ServerError: {
          description: '服务器错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    security: [{ sessionAuth: [] }]
  },
  apis: ['./src/app/api/**/*.ts'],
};

const specs = swaggerJsdoc(options);
module.exports = specs; 