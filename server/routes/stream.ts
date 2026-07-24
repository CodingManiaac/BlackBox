import { Router, Request, Response } from 'express';
import { EventBus } from '../../src/core/EventBus';

const router = Router();
let clients: Response[] = [];

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add client response channel to pool
  clients.push(res);
  console.log(`[SSE] Client connected. Total connections: ${clients.length}`);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log(`[SSE] Client disconnected. Total connections: ${clients.length}`);
  });
});

export function broadcastEvent(event: any) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(c => {
    try {
      c.write(payload);
    } catch (err) {
      console.error('[SSE] Failed to write event to client channel:', err);
    }
  });
}

// Forward all EventBus logs/timelines over SSE to frontend listeners
EventBus.subscribe((event) => {
  broadcastEvent({
    type: 'EVENT_EMITTED',
    event
  });
});

export default router;
