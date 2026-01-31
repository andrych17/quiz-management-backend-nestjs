/**
 * Debug Logger Utility
 *
 * Provides conditional console logging based on DEBUG_MODE environment variable.
 * When DEBUG_MODE=true, all debug logs will be printed to console.
 * When DEBUG_MODE=false or not set, debug logs are suppressed.
 */

export class DebugLogger {
  private static isDebugMode(): boolean {
    return process.env.DEBUG_MODE === 'true';
  }

  /**
   * Log debug information (only in debug mode)
   */
  static debug(context: string, message: string, data?: any) {
    if (this.isDebugMode()) {
      const timestamp = new Date().toISOString();
      console.log(`\n🔍 [DEBUG] [${timestamp}] [${context}]`);
      console.log(`   Message: ${message}`);
      if (data !== undefined) {
        console.log(`   Data:`, JSON.stringify(data, null, 2));
      }
      console.log('---');
    }
  }

  /**
   * Log API endpoint calls
   */
  static endpoint(method: string, path: string, params?: any, query?: any) {
    if (this.isDebugMode()) {
      const timestamp = new Date().toISOString();
      console.log(`\n🌐 [API ENDPOINT] [${timestamp}]`);
      console.log(`   Method: ${method}`);
      console.log(`   Path: ${path}`);
      if (params && Object.keys(params).length > 0) {
        console.log(`   Params:`, params);
      }
      if (query && Object.keys(query).length > 0) {
        console.log(`   Query:`, query);
      }
      console.log('---');
    }
  }

  /**
   * Log service method calls
   */
  static service(serviceName: string, methodName: string, params?: any) {
    if (this.isDebugMode()) {
      const timestamp = new Date().toISOString();
      console.log(`\n⚙️  [SERVICE] [${timestamp}]`);
      console.log(`   Service: ${serviceName}`);
      console.log(`   Method: ${methodName}`);
      if (params !== undefined) {
        console.log(`   Params:`, JSON.stringify(params, null, 2));
      }
      console.log('---');
    }
  }

  /**
   * Log info (always shown regardless of debug mode)
   */
  static info(context: string, message: string) {
    const timestamp = new Date().toISOString();
    console.log(`ℹ️  [INFO] [${timestamp}] [${context}] ${message}`);
  }

  /**
   * Log errors (always shown regardless of debug mode)
   */
  static error(context: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`❌ [ERROR] [${timestamp}] [${context}] ${message}`);
    if (error) {
      console.error(`   Error Details:`, error);
    }
  }

  /**
   * Log warnings (always shown regardless of debug mode)
   */
  static warn(context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️  [WARN] [${timestamp}] [${context}] ${message}`);
    if (data !== undefined) {
      console.warn(`   Data:`, data);
    }
  }

  /**
   * Log success messages (only in debug mode)
   */
  static success(context: string, message: string, data?: any) {
    if (this.isDebugMode()) {
      const timestamp = new Date().toISOString();
      console.log(`\n✅ [SUCCESS] [${timestamp}] [${context}]`);
      console.log(`   Message: ${message}`);
      if (data !== undefined) {
        console.log(`   Data:`, JSON.stringify(data, null, 2));
      }
      console.log('---');
    }
  }
}
