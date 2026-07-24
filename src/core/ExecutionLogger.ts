import { EventBus } from './EventBus';
import { LoggerService } from '../services/LoggerService';

export class ExecutionLogger {
  private static unsubscribeFn: (() => void) | null = null;

  static startListening() {
    if (this.unsubscribeFn) return;
    this.unsubscribeFn = EventBus.subscribe(event => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      const agentPrefix = event.payload.agentId ? `[Agent: ${event.payload.agentId}] ` : '';
      const formattedMsg = `[${time}] ${agentPrefix}${event.payload.message}`;

      switch (event.type) {
        case 'AGENT_FAILED':
          LoggerService.error(formattedMsg, 'MedXEngine');
          break;
        case 'WARNING_RAISED':
          LoggerService.warn(formattedMsg, 'MedXEngine');
          break;
        case 'AGENT_FINISHED':
        case 'WORKFLOW_FINISHED':
        case 'PIPELINE_COMPLETED':
          LoggerService.success(formattedMsg, 'MedXEngine');
          break;
        default:
          LoggerService.info(formattedMsg, 'MedXEngine');
          break;
      }
    });
  }

  static stopListening() {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }
}
export default ExecutionLogger;
