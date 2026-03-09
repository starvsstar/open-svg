// 数据库类型定义
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  avatar_url: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface SVG {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  svg_content: string;
  prompt_id: string | null;
  is_public: boolean;
  view_count: number;
  like_count: number;
  share_count: number;
  favorite_count: number;
  forward_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PromptHistory {
  id: string;
  user_id: string;
  content: string;
  svg_id: string | null;
  status: 'success' | 'failed';
  error_message: string | null;
  created_at: Date;
}

// ... 其他接口定义 