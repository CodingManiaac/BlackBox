import { Router, Request, Response, NextFunction } from 'express';
import { HospitalService } from '../services/HospitalService';
import { InventoryService } from '../services/InventoryService';

const router = Router();

import { MedXEngine } from '../../src/core/MedXEngine';
import { WorkflowOrchestrator } from '../services/WorkflowOrchestrator';
import { db } from '../database/db';
import { broadcastEvent } from './stream';

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = HospitalService.getActiveHospitals();
    res.json({ success: true, hospitals: list });
  } catch (err) {
    next(err);
  }
});

router.get('/blood', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = InventoryService.getBloodInventory();
    res.json({ success: true, blood: list });
  } catch (err) {
    next(err);
  }
});

router.post('/procure', async (req: Request, res: Response, next: NextFunction) => {
  const { facilityId, requestType, medicine, quantity, bloodGroup, bloodUnits, emergencyPriority, reason } = req.body;
  
  try {
    const orderId = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const now = Date.now();
    const eceLevel = emergencyPriority ? 1 : 5;
    
    // Construct query for AI Engine
    let query = `Hospital Procurement Request [Source: Hospital, Type: ${requestType}]. `;
    if (requestType === 'Medicine' || requestType === 'Combined') {
      query += `Medicine: ${medicine} (Qty: ${quantity}). `;
    }
    if (requestType === 'Blood' || requestType === 'Combined') {
      query += `Blood group: ${bloodGroup} (Units: ${bloodUnits}). `;
    }
    query += `Reason: ${reason || 'Clinical procurement'}. Urgency Level: ECE-${eceLevel}.`;

    // 1. Process Intake Request via AI Engine
    const result = await MedXEngine.processRequest('HOSP-001', query, 'Mock');
    const finalContext = result.finalContext;
    const xaiReport = finalContext.explainabilityReport;

    // 2. Persist request context to SQLite database
    db.prepare(`
      INSERT OR REPLACE INTO requests_context (
        request_id, patient_id, query, workflow_stage, overall_confidence, status,
        context_json, trace_json, timeline_json, risk_level, human_review_json,
        confidence_breakdown_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      'HOSP-001',
      query,
      'PENDING',
      finalContext.overallConfidence || 0.95,
      'RUNNING',
      JSON.stringify(finalContext),
      JSON.stringify(finalContext.decisionTrace || []),
      JSON.stringify(finalContext.executionTimeline || []),
      emergencyPriority ? 'HIGH' : 'LOW',
      JSON.stringify(finalContext.humanReviewStatus || {}),
      JSON.stringify(finalContext.confidenceBreakdown || {}),
      now
    );

    // 3. Save inside orders table (Unified Healthcare Request)
    const medicineStr = requestType === 'Combined' ? `${medicine} (x${quantity}), Blood Group ${bloodGroup} (x${bloodUnits})` : (requestType === 'Blood' ? `Blood Group ${bloodGroup}` : medicine);
    const totalQty = requestType === 'Combined' ? (Number(quantity) + Number(bloodUnits)) : (requestType === 'Blood' ? Number(bloodUnits) : Number(quantity));

    db.prepare(`
      INSERT INTO orders (
        id, patient_id, medicine, quantity, ece_level, status, 
        assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
        total_amount, payment_status, payment_method, address_line,
        discount, delivery_fee, tax,
        request_source, request_type, facility_id, blood_group, blood_units
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      'HOSP-001',
      medicineStr,
      totalQty,
      eceLevel,
      'Pending',
      requestType === 'Blood' ? 'Central Red Cross Blood Bank' : 'Care Pharmacy Store',
      'Unassigned',
      xaiReport?.eta || '15 mins',
      now,
      now,
      0,
      'Approved',
      'Hospital Billing Account',
      'Metro General Hospital (ER Ward)',
      0, 0, 0,
      'Hospital',
      requestType,
      facilityId || 'FAC-001',
      bloodGroup || null,
      bloodUnits || null
    );

    // 4. Broadcast visualization event
    broadcastEvent({
      type: 'START_AI_VISUALIZATION',
      orderId,
      patientId: 'HOSP-001',
      query,
      finalContext
    });

    // 5. Deduct inventory if validated
    if (requestType === 'Medicine' || requestType === 'Combined') {
      db.prepare('UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE medicine = ?').run(quantity, medicine);
    }
    if (requestType === 'Blood' || requestType === 'Combined') {
      db.prepare('UPDATE blood_banks SET quantity = MAX(0, quantity - ?) WHERE blood_group = ?').run(bloodUnits, bloodGroup);
    }

    // 6. Simulate asynchronous workflow stages for presentation mode
    setTimeout(() => {
      WorkflowOrchestrator.updateStage(orderId, 'PHARMACY_REVIEW');
    }, 9000);

    setTimeout(() => {
      WorkflowOrchestrator.updateStage(orderId, 'APPROVED');
    }, 12000);

    setTimeout(() => {
      WorkflowOrchestrator.reserveInventory(orderId);
    }, 15000);

    setTimeout(() => {
      WorkflowOrchestrator.assignRider(orderId, 'RD-001');
    }, 18000);

    setTimeout(() => {
      WorkflowOrchestrator.reachedStore(orderId);
    }, 21000);

    setTimeout(() => {
      WorkflowOrchestrator.shipOrder(orderId);
    }, 24000);

    setTimeout(() => {
      WorkflowOrchestrator.reachedCustomer(orderId);
    }, 27000);

    setTimeout(() => {
      WorkflowOrchestrator.completeDelivery(orderId);
    }, 30000);

    res.json({ success: true, message: 'Hospital procurement request submitted successfully.', orderId });

  } catch (err: any) {
    next(err);
  }
});

export default router;
