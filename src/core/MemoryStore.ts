import { RequestContext } from '../types/context';

export class MemoryStore {
  private static contexts: Map<string, RequestContext> = new Map();
  private static cache: Map<string, any> = new Map();

  static storeContext(requestId: string, context: RequestContext) {
    this.contexts.set(requestId, context);
  }

  static getContext(requestId: string): RequestContext | undefined {
    return this.contexts.get(requestId);
  }

  static deleteContext(requestId: string) {
    this.contexts.delete(requestId);
  }

  static set(key: string, value: any) {
    this.cache.set(key, value);
  }

  static get<T>(key: string): T | undefined {
    return this.cache.get(key) as T;
  }

  static delete(key: string) {
    this.cache.delete(key);
  }

  static clear() {
    this.contexts.clear();
    this.cache.clear();
  }
}
