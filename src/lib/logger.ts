type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    
    // 确保 data 是一个对象
    const safeData = data ?? {};
    
    // 创建安全的日志对象
    const logData = {
      timestamp,
      level,
      message,
      data: safeData
    };

    // 使用安全的数据记录日志
    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, safeData);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, safeData);
        break;
      case 'debug':
        console.debug(`[${timestamp}] DEBUG:`, message, safeData);
        break;
      default:
        console.log(`[${timestamp}] INFO:`, message, safeData);
    }
  }
}; 