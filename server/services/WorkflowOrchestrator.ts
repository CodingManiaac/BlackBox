import { db } from '../database/db';
import { broadcastEvent } from '../routes/stream';
import { NotificationEngine } from './NotificationEngine';
import { AuditService } from './AuditService';

export class WorkflowOrchestrator {
  static updateStage(requestId: string, newStage: string, extraData: any = {}) {
    const row = db.prepare('SELECT context_json FROM requests_context WHERE request_id = ?').get(requestId) as { context_json: string } | undefined;
    
    let context: any = {};
    if (row) {
      context = JSON.parse(row.context_json);
    } else {
      context = {
        requestId,
        patientId: 'PAT-001',
        workflowStage: newStage,
        status: 'RUNNING',
        executionTimeline: []
      };
    }

    context.workflowStage = newStage;
    context.status = this.resolveStatus(newStage);
    if (!context.executionTimeline) {
      context.executionTimeline = [];
    }
    context.executionTimeline.push({
      timestamp: Date.now(),
      stepName: newStage,
      status: 'FINISHED',
      message: `Workflow state transitioned to: ${newStage}.`
    });

    db.prepare(`
      INSERT OR REPLACE INTO requests_context (
        request_id, patient_id, query, workflow_stage, overall_confidence, status, context_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      requestId,
      context.patientId || 'PAT-001',
      context.query || 'Prescription medication request',
      newStage,
      context.overallConfidence || 1.0,
      context.status,
      JSON.stringify(context),
      Date.now()
    );

    // Logging audit events
    AuditService.log({
      type: 'STAGE_UPDATED',
      timestamp: Date.now(),
      request_id: requestId,
      message: `Workflow stage updated to: ${newStage}`
    });

    // Create contextual notification
    NotificationEngine.createNotification(requestId, newStage, context.patientId || 'PAT-001');

    // Broadcast SSE update
    broadcastEvent({
      type: 'STAGE_CHANGED',
      requestId,
      stage: newStage,
      status: context.status,
      patientId: context.patientId || 'PAT-001',
      ...extraData
    });
  }

  static acceptRequest(requestId: string, facilityId: string, remarks?: string) {
    const facility = db.prepare('SELECT name FROM facilities WHERE id = ?').get(facilityId) as { name: string } | undefined;
    const facilityName = facility ? facility.name : 'Care Pharmacy Store';

    db.prepare("UPDATE orders SET status = 'Under Review', assigned_pharmacy = ? WHERE id = ?").run(facilityName, requestId);
    this.updateStage(requestId, 'PHARMACY_REVIEW', { facilityName, remarks });
  }

  static verifyPrescription(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Approved' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'APPROVED');
  }

  static reserveInventory(requestId: string) {
    // Deduct stock for medicines in order_items
    const items = db.prepare('SELECT medicine_name, quantity FROM order_items WHERE order_id = ?').all(requestId) as { medicine_name: string; quantity: number }[];
    for (const item of items) {
      db.prepare('UPDATE medicines SET stock = MAX(0, stock - ?) WHERE name = ?').run(item.quantity, item.medicine_name);
      db.prepare('UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE medicine = ?').run(item.quantity, item.medicine_name);
    }
    
    db.prepare("UPDATE orders SET status = 'Preparing' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'INVENTORY_RESERVED');
  }

  static markOutOfStock(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Out of Stock' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'OUT_OF_STOCK');
  }

  static suggestAlternative(requestId: string, alternativeDrug: string) {
    db.prepare("UPDATE orders SET medicine = ?, status = 'Manual Review' WHERE id = ?").run(alternativeDrug, requestId);
    this.updateStage(requestId, 'MANUAL_REVIEW', { alternative: alternativeDrug });
  }

  static rejectRequest(requestId: string, remarks: string) {
    db.prepare("UPDATE orders SET status = 'Rejected' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'REJECTED', { remarks });
  }

  static cancelRequest(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'CANCELLED');
  }

  static readyRequest(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Ready' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'READY');
  }

  static assignRider(requestId: string, riderId: string) {
    const rider = db.prepare('SELECT name FROM riders WHERE id = ?').get(riderId) as { name: string } | undefined;
    const riderName = rider ? rider.name : 'Dave Miller';

    db.prepare("UPDATE riders SET status = 'Busy' WHERE id = ?").run(riderId);
    db.prepare("UPDATE orders SET status = 'Preparing Dispatch', assigned_rider = ? WHERE id = ?").run(riderName, requestId);
    this.updateStage(requestId, 'DISPATCH_ASSIGNED', { riderName });
  }

  static reachedStore(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Reached Store' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'PICKED_UP');
  }

  static shipOrder(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Out for Delivery' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'OUT_FOR_DELIVERY');
  }

  static reachedCustomer(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Reached Customer' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'DELIVERED');
  }

  static completeDelivery(requestId: string) {
    db.prepare("UPDATE orders SET status = 'Delivered' WHERE id = ?").run(requestId);
    this.updateStage(requestId, 'COMPLETED');
  }

  private static resolveStatus(stage: string): string {
    if (['COMPLETED', 'DELIVERED', 'Delivered'].includes(stage)) return 'COMPLETED';
    if (['REJECTED', 'OUT_OF_STOCK', 'CANCELLED'].includes(stage)) return 'FAILED';
    if (['MANUAL_REVIEW'].includes(stage)) return 'PENDING';
    return 'RUNNING';
  }
}
export default WorkflowOrchestrator;
