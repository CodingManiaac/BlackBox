import { useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export function useWorkflowStream(onMessage: (event: any) => void) {
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/workflow/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('[SSE] Failed to parse event payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      // Gracefully log connection warning without throwing errors
      console.warn('[SSE] EventSource stream connection warning:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [onMessage]);
}

export default useWorkflowStream;
