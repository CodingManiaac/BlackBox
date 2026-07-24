import { AgentConfig } from '../types/workflow';
import { LoggerService } from '../services/LoggerService';

export class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: AgentConfig,
    onRetry: (attempt: number, error: any) => void
  ): Promise<T> {
    let attempt = 0;
    
    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > config.retryLimit) {
          LoggerService.error(`Execution failed after ${attempt - 1} retries: limit reached!`, config.name);
          throw error;
        }

        onRetry(attempt, error);
        
        // Wait retry delay
        await new Promise(resolve => setTimeout(resolve, config.retryDelayMs));
      }
    }
  }
}
