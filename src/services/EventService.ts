import { EventBus } from '../core/EventBus';
import { MedXEventType, MedXEvent } from '../types/event';
import { RequestContext } from '../types/context';

export class EventService {
  static emit(type: MedXEventType, requestId: string, message: string, detail: { agentId?: string; context?: RequestContext; latencyMs?: number; error?: string } = {}) {
    const event: MedXEvent = {
      type,
      timestamp: Date.now(),
      requestId,
      payload: {
        agentId: detail.agentId,
        message,
        context: detail.context,
        latencyMs: detail.latencyMs,
        error: detail.error
      }
    };
    EventBus.publish(event);
  }
}
