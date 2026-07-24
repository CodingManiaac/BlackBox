import { MedXEvent, EventCallback } from '../types/event';

export class EventBus {
  private static subscribers: Set<EventCallback> = new Set();

  static subscribe(callback: EventCallback): () => void {
    this.subscribers.add(callback);
    // Return unsubscribe callback function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  static publish(event: MedXEvent) {
    this.subscribers.forEach(sub => {
      try {
        sub(event);
      } catch (err) {
        console.error('Error in EventBus subscriber callback:', err);
      }
    });
  }

  static clearSubscribers() {
    this.subscribers.clear();
  }
}
export default EventBus;
