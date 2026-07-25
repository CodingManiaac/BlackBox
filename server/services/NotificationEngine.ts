import { db } from '../database/db';
import { broadcastEvent } from '../routes/stream';

export interface NotificationRecord {
  id: string;
  requestId: string;
  patientId: string;
  recipientRole: string;
  recipientId: string | null;
  message: string;
  timestamp: number;
  read: number;
}

export class NotificationEngine {
  static createNotification(requestId: string, stage: string, patientId: string) {
    // 1. Get info about the order (medicine, assigned pharmacy/facility, ece_level)
    let medicine = 'medicine';
    let pharmacy = '';
    let eceLevel = 5;
    try {
      const order = db.prepare("SELECT medicine, assigned_pharmacy, ece_level FROM orders WHERE id = ?").get(requestId) as any;
      if (order) {
        medicine = order.medicine || 'medicine';
        pharmacy = order.assigned_pharmacy || '';
        eceLevel = order.ece_level || 5;
      }
    } catch (e) {}

    const getEceLabel = (level: number) => {
      switch (level) {
        case 1: return 'Life Threatening';
        case 2: return 'Critical';
        case 3: return 'Priority';
        case 4: return 'Moderate';
        case 5: return 'Routine';
        default: return 'Routine';
      }
    };
    const eceLabel = getEceLabel(eceLevel);

    // 2. Dispatch notifications depending on the stage
    switch (stage) {
      case 'REQUEST_CREATED':
      case 'WORKFLOW_STARTED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Order Confirmed: Your request for ${medicine} has been created successfully.`);
        this.insertNotification(requestId, patientId, 'admin', null, `Workflow Started: Clinical workflow initiated for request ${requestId}.`);
        if (eceLevel <= 2) {
          this.insertNotification(requestId, patientId, 'admin', null, `New Emergency: Critical case registered for request ${requestId}.`);
        }
        break;

      case 'AI_ANALYSIS_RUNNING':
        this.insertNotification(requestId, patientId, 'admin', null, `AI Analysis Running: Evaluating clinical attributes for request ${requestId}...`);
        break;

      case 'ECE_ASSIGNED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Emergency classification verified: ECE-${eceLevel} (${eceLabel}) for order ${requestId}.`);
        this.insertNotification(requestId, patientId, 'admin', null, `ECE Assigned: Severity set to ECE-${eceLevel} for case ${requestId}.`);
        if (eceLevel <= 2) {
          this.insertNotification(requestId, patientId, 'hospital', 'FAC-001', `Emergency Case Updated: High-risk telemetry case detected for ${requestId}.`);
          this.insertNotification(requestId, patientId, 'admin', null, `Critical Alert: High-risk ECE classification on request ${requestId}.`);
        }
        break;

      case 'FACILITY_IDENTIFIED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Nearest clinical supplier facility mapped for case ${requestId}.`);
        if (pharmacy) {
          this.insertNotification(requestId, patientId, 'pharmacy', pharmacy, `New Patient Order: Received dispatch request for ${medicine} (order ${requestId}).`);
          this.insertNotification(requestId, patientId, 'hospital', 'FAC-001', `Pharmacy Request Sent: Mapped supplier "${pharmacy}" for order ${requestId}.`);
        }
        break;

      case 'PHARMACY_ACCEPTED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Pharmacy Accepted: Supplier accepted clinical case ticket ${requestId}.`);
        if (pharmacy) {
          this.insertNotification(requestId, patientId, 'pharmacy', pharmacy, `New Patient Order Accepted: Successfully claimed order ticket ${requestId}.`);
        }
        break;

      case 'INVENTORY_RESERVED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Blood Reserved: Stock allocated and reserved for request ${requestId}.`);
        this.insertNotification(requestId, patientId, 'hospital', 'FAC-001', `Blood Reserved: Target units locked in database for case ${requestId}.`);
        this.insertNotification(requestId, patientId, 'blood_bank', 'FAC-005', `Reservation Confirmed: Allocated stock units for request ${requestId}.`);
        break;

      case 'LOGISTICS_ASSIGNED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Rider Assigned: Courier dispatch route locked for order ${requestId}.`);
        this.insertNotification(requestId, patientId, 'hospital', 'FAC-001', `Logistics Assigned: Transport rider locked for request ${requestId}.`);
        this.insertNotification(requestId, patientId, 'logistics', null, eceLevel <= 2 
          ? `Emergency Dispatch Assigned: High priority drone dispatch scheduled for ${requestId}.` 
          : `New Delivery Assigned: Regular ground courier route assigned for ${requestId}.`
        );
        break;

      case 'OUT_FOR_DELIVERY':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Rider has departed! Order ${requestId} is out for delivery.`);
        this.insertNotification(requestId, patientId, 'logistics', null, `Pickup Ready: Cargo picked up from supplier for order ${requestId}.`);
        this.insertNotification(requestId, patientId, 'blood_bank', 'FAC-005', `Dispatch Started: Delivery courier has picked up the reserved blood packs.`);
        break;

      case 'DELIVERED':
      case 'COMPLETED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Delivered: Order ${requestId} arrived! Delivery confirmed at location.`);
        this.insertNotification(requestId, patientId, 'logistics', null, `Delivery Completed: Successfully handed over order ${requestId}.`);
        this.insertNotification(requestId, patientId, 'admin', null, `Workflow Completed: Successfully closed case docket ${requestId}.`);
        this.insertNotification(requestId, patientId, 'blood_bank', 'FAC-005', `Dispatch Completed: Blood delivery successfully confirmed.`);
        break;

      case 'CANCELLED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Order Cancelled: You cancelled request ${requestId}.`);
        if (pharmacy) {
          this.insertNotification(requestId, patientId, 'pharmacy', pharmacy, `Order Cancelled: Patient cancelled active request ticket ${requestId}.`);
        }
        break;

      case 'RETURN_PENDING':
        if (pharmacy) {
          this.insertNotification(requestId, patientId, 'pharmacy', pharmacy, `Refund Request: Refund requisition submitted for order ${requestId}.`);
        }
        break;

      case 'REFUND_APPROVED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Refund Approved: The return request for order ${requestId} has been approved.`);
        break;

      case 'REFUND_REJECTED':
        this.insertNotification(requestId, patientId, 'patient', patientId, `Refund Rejected: The return request for order ${requestId} was rejected.`);
        break;
    }
  }

  static insertNotification(requestId: string, patientId: string, recipientRole: string, recipientId: string | null, message: string) {
    const notification = {
      id: `NOT-${Math.floor(100000 + Math.random() * 900000)}`,
      requestId,
      patientId,
      recipientRole,
      recipientId,
      message,
      timestamp: Date.now(),
      read: 0
    };

    try {
      db.prepare(`
        INSERT INTO notifications (id, request_id, patient_id, recipient_role, recipient_id, message, timestamp, read)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(notification.id, requestId, patientId, recipientRole, recipientId, message, notification.timestamp);
    } catch (e) {
      console.error('Failed writing notification to SQLite:', e);
    }

    broadcastEvent({
      type: 'NOTIFICATION_RECEIVED',
      notification: {
        id: notification.id,
        requestId: notification.requestId,
        patientId: notification.patientId,
        recipientRole: notification.recipientRole,
        recipientId: notification.recipientId,
        message: notification.message,
        timestamp: notification.timestamp,
        read: 0
      }
    });
  }

  static getNotifications(patientId?: string): NotificationRecord[] {
    try {
      let rows;
      if (patientId) {
        rows = db.prepare("SELECT id, request_id as requestId, patient_id as patientId, recipient_role as recipientRole, recipient_id as recipientId, message, timestamp, read FROM notifications WHERE recipient_role = 'patient' AND recipient_id = ? ORDER BY timestamp DESC").all(patientId);
      } else {
        rows = db.prepare('SELECT id, request_id as requestId, patient_id as patientId, recipient_role as recipientRole, recipient_id as recipientId, message, timestamp, read FROM notifications ORDER BY timestamp DESC').all();
      }
      return rows as NotificationRecord[];
    } catch (e) {
      console.error('Failed loading notifications from SQLite:', e);
      return [];
    }
  }

  static getNotificationsForRole(recipientRole: string, recipientId: string | null): any[] {
    try {
      let rows;
      if (recipientId) {
        rows = db.prepare(`
          SELECT id, request_id as requestId, patient_id as patientId, recipient_role as recipientRole, recipient_id as recipientId, message, timestamp, read 
          FROM notifications 
          WHERE recipient_role = ? AND (recipient_id = ? OR recipient_id IS NULL OR recipient_id = '') 
          ORDER BY timestamp DESC
        `).all(recipientRole, recipientId);
      } else {
        rows = db.prepare(`
          SELECT id, request_id as requestId, patient_id as patientId, recipient_role as recipientRole, recipient_id as recipientId, message, timestamp, read 
          FROM notifications 
          WHERE recipient_role = ? 
          ORDER BY timestamp DESC
        `).all(recipientRole);
      }
      return rows;
    } catch (e) {
      console.error('Failed loading notifications from SQLite:', e);
      return [];
    }
  }
}
export default NotificationEngine;
