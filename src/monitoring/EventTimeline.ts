import { EventBus } from '../core/EventBus';
import { MedXEvent } from '../types/event';

export class EventTimeline {
  private static events: MedXEvent[] = [];
  private static listeners: Set<(events: MedXEvent[]) => void> = new Set();
  private static isSubscribed = false;

  static startTracking() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    EventBus.subscribe(event => {
      this.events = [event, ...this.events].slice(0, 100); // Keep last 100 events
      this.notifyListeners();
    });
  }

  static getEvents(): MedXEvent[] {
    return this.events;
  }

  static subscribe(callback: (events: MedXEvent[]) => void): () => void {
    this.startTracking();
    this.listeners.add(callback);
    callback(this.events);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener(this.events));
  }

  static clear() {
    this.events = [];
    this.notifyListeners();
  }
}
export default EventTimeline;
