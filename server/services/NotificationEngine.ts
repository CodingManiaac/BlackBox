import { db } from '../database/db';
import { broadcastEvent } from '../routes/stream';

export interface NotificationRecord {
  id: string;
  requestId: string;
  patientId: string;
  message: string;
  timestamp: number;
}

export class NotificationEngine {
  static createNotification(requestId: string, stage: string, patientId: string) {
    const message = this.getMessageForStage(stage, requestId);
    const notification: NotificationRecord = {
      id: `NOT-${Math.floor(100000 + Math.random() * 900000)}`,
      requestId,
      patientId,
      message,
      timestamp: Date.now()
    };

    try {
      db.prepare(`
        INSERT INTO notifications (id, request_id, patient_id, message, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(notification.id, requestId, patientId, message, notification.timestamp);
    } catch (e) {
      console.error('Failed writing notification to SQLite:', e);
    }

    // Broadcast through SSE stream
    broadcastEvent({
      type: 'NOTIFICATION_RECEIVED',
      notification
    });
  }

  static getNotifications(patientId?: string): NotificationRecord[] {
    try {
      let rows;
      if (patientId) {
        rows = db.prepare('SELECT id, request_id as requestId, patient_id as patientId, message, timestamp FROM notifications WHERE patient_id = ? ORDER BY timestamp DESC').all(patientId);
      } else {
        rows = db.prepare('SELECT id, request_id as requestId, patient_id as patientId, message, timestamp FROM notifications ORDER BY timestamp DESC').all();
      }
      return rows as NotificationRecord[];
    } catch (e) {
      console.error('Failed loading notifications from SQLite:', e);
      return [];
    }
  }

  private static getMessageForStage(stage: string, requestId: string): string {
    switch (stage) {
      case 'REQUEST_CREATED':
        return `New medical request ${requestId} created successfully.`;
      case 'AI_ANALYSIS_RUNNING':
        return `Gemini models analyzing clinical attributes for ${requestId}...`;
      case 'ECE_ASSIGNED':
        return `Emergency level assessed and verified for request ${requestId}.`;
      case 'FACILITY_IDENTIFIED':
        return `Nearest clinical supplier facility mapped for case ${requestId}.`;
      case 'PHARMACY_PENDING':
        return `Request ${requestId} forwarded to pharmacy queues for validation review.`;
      case 'PHARMACY_ACCEPTED':
        return `Pharmacy accepted clinical case ticket ${requestId}.`;
      case 'INVENTORY_RESERVED':
        return `Stock allocated and reserved for request ${requestId}.`;
      case 'LOGISTICS_ASSIGNED':
        return `Rider dispatch route locked for order ${requestId}.`;
      case 'OUT_FOR_DELIVERY':
        return `Rider has departed! Order ${requestId} is out for delivery.`;
      case 'DELIVERED':
        return `Order ${requestId} arrived! Delivery confirmed at location.`;
      case 'COMPLETED':
        return `Healthcare workflow finalized successfully for ${requestId}.`;
      case 'REJECTED':
        return `Case ${requestId} was rejected by pharmacist.`;
      case 'MANUAL_REVIEW':
        return `Warning: Ticket ${requestId} placed in Manual Practitioner review!`;
      case 'CANCELLED':
        return `Patient canceled request ${requestId}.`;
      default:
        return `Workflow status update on ${requestId}: ${stage}`;
    }
  }
}
export default NotificationEngine;
