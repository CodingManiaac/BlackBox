import { useEffect } from 'react';

export function useWorkflowStream(onMessage: (event: any) => void) {
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');

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
