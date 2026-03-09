declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      NEXTAUTH_URL_INTERNAL?: string;
      AUTH_TRUST_HOST?: string;
      GITHUB_ID?: string;
      GITHUB_SECRET?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      LLM_API_KEY?: string;
      LLM_BASE_URL?: string;
      LLM_MODEL?: string;
      LLM_TEMPERATURE?: string;
      OPENAI_API_KEY?: string;
      REDIS_URL?: string;
      ADMIN_PASSWORD?: string;
      COOKIE_DOMAIN?: string;
      ALLOWED_ORIGINS?: string;
      IMAGE_DOMAINS?: string;
      NEXT_PUBLIC_SITE_URL?: string;
    }
  }
}

export {}; 
