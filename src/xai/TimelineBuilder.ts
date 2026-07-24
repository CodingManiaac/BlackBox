import { RequestContext } from '../types/context';

export class TimelineBuilder {
  static build(context: RequestContext): string[] {
    return context.executionTimeline.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `${time} - ${entry.stepName} [${entry.status}] ${entry.message}`;
    });
  }
}
export default TimelineBuilder;
