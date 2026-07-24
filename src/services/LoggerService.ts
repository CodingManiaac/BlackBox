export class LoggerService {
  static info(message: string, context?: string) {
    const ctxString = context ? `[${context}] ` : '';
    console.log(`\x1b[36m[INFO]\x1b[0m ${ctxString}${message}`);
  }

  static success(message: string, context?: string) {
    const ctxString = context ? `[${context}] ` : '';
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${ctxString}${message}`);
  }

  static warn(message: string, context?: string) {
    const ctxString = context ? `[${context}] ` : '';
    console.log(`\x1b[33m[WARN]\x1b[0m ${ctxString}${message}`);
  }

  static error(message: string, context?: string) {
    const ctxString = context ? `[${context}] ` : '';
    console.log(`\x1b[31m[ERROR]\x1b[0m ${ctxString}${message}`);
  }
}
