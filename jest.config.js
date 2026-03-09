/**
 * Jest配置文件
 * 用于SVG编辑器的单元测试和集成测试
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // 设置测试环境
  testEnvironment: 'jsdom',
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },
  
  // 模块转换忽略
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@svgdotjs|lucide-react))'
  ],
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 收集覆盖率的文件
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/pages/api/**/*',
    '!src/types/**/*'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 模拟模块
  moduleNameMapping: {
    // 模拟CSS模块
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // 模拟静态资源
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 清除模拟
  clearMocks: true,
  
  // 恢复模拟
  restoreMocks: true,
  
  // 详细输出
  verbose: true,
  
  // 错误时停止
  bail: false,
  
  // 最大并发数
  maxConcurrency: 5,
  
  // 监视模式下忽略的模式
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/'
  ],
  
  // 自定义解析器
  resolver: undefined,
  
  // 测试结果处理器
  testResultsProcessor: undefined,
  
  // 快照序列化器
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);