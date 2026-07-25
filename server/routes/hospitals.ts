import { Router, Request, Response, NextFunction } from 'express';
import { HospitalService } from '../services/HospitalService';
import { InventoryService } from '../services/InventoryService';

const router = Router();

import { MedXEngine } from '../../src/core/MedXEngine';
import { WorkflowOrchestrator } from '../services/WorkflowOrchestrator';
import { db } from '../database/db';
import { broadcastEvent } from './stream';
import { apiKeys } from '../../src/config/apiKeys';

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = HospitalService.getActiveHospitals();
    res.json({ success: true, hospitals: list });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  const { facilityId } = req.query;
  if (!facilityId) {
    res.status(400).json({ success: false, message: 'Missing facilityId.' });
    return;
  }
  try {
    const stats = db.prepare('SELECT * FROM hospital_stats WHERE facility_id = ?').get(facilityId);
    res.json({ success: true, stats: stats || { facility_id: facilityId, icu_occupied: 16, icu_total: 20, ventilator_occupied: 8, ventilator_total: 12 } });
  } catch (err) {
    next(err);
  }
});

router.post('/stats', (req: Request, res: Response, next: NextFunction) => {
  const { facilityId, icuOccupied, icuTotal, ventilatorOccupied, ventilatorTotal } = req.body;
  if (!facilityId) {
    res.status(400).json({ success: false, message: 'Missing facilityId.' });
    return;
  }
  try {
    db.prepare(`
      INSERT OR REPLACE INTO hospital_stats (facility_id, icu_occupied, icu_total, ventilator_occupied, ventilator_total)
      VALUES (?, ?, ?, ?, ?)
    `).run(facilityId, Number(icuOccupied), Number(icuTotal), Number(ventilatorOccupied), Number(ventilatorTotal));
    res.json({ success: true, message: 'Hospital stats updated successfully.' });
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

router.post('/blood/restock', async (req: Request, res: Response, next: NextFunction) => {
  const { facilityId, bloodGroup, quantity } = req.body;
  if (!facilityId || !bloodGroup || quantity === undefined) {
    res.status(400).json({ success: false, message: 'Missing facilityId, bloodGroup, or quantity.' });
    return;
  }
  try {
    db.prepare(`
      UPDATE blood_banks
      SET quantity = quantity + ?
      WHERE facility_id = ? AND blood_group = ?
    `).run(Number(quantity), facilityId, bloodGroup);
    res.json({ success: true, message: `Successfully restocked ${quantity} units of ${bloodGroup}.` });
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
    const mode = apiKeys.gemini ? 'Production' : 'Mock';
    const result = await MedXEngine.processRequest('HOSP-001', query, mode);
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
      requestType === 'Blood' ? 'Red Cross Blood Bank' : 'Unassigned',
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

    res.json({ success: true, message: 'Hospital procurement request submitted successfully.', orderId });

  } catch (err: any) {
    next(err);
  }
});

export default router;
