import { MemoryStore } from '../core/MemoryStore';
import { RequestContext } from '../types/context';

export class RequestInspector {
  static inspect(requestId: string): RequestContext | undefined {
    return MemoryStore.getContext(requestId);
  }
}
export default RequestInspector;
