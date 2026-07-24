import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database/db';
import { broadcastEvent } from './stream';
import { MedXEngine } from '../../src/core/MedXEngine';
import { WorkflowOrchestrator } from '../services/WorkflowOrchestrator';

const router = Router();

interface AddressBody {
  patientId: string;
  name: string;
  addressLine: string;
  city: string;
  zipCode: string;
  phone: string;
  isDefault: number;
}

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutBody {
  patientId: string;
  items: CheckoutItem[];
  totalAmount: number;
  paymentMethod: string;
  addressLine: string;
}

// 1. Fetch medicines catalogue
router.get('/medicines', (req: Request, res: Response, next: NextFunction) => {
  try {
    const medicines = db.prepare('SELECT * FROM medicines').all();
    res.json({ success: true, medicines });
  } catch (err) {
    next(err);
  }
});

// 2. Fetch patient shipping addresses
router.get('/addresses', (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.query;
  if (!patientId) {
    res.status(400).json({ success: false, message: 'Missing patientId query parameter.' });
    return;
  }

  try {
    const addresses = db.prepare('SELECT * FROM patient_addresses WHERE patient_id = ?').all(patientId);
    res.json({ success: true, addresses });
  } catch (err) {
    next(err);
  }
});

// 3. Save a new shipping address
router.post('/addresses', (req: Request, res: Response, next: NextFunction) => {
  const { patientId, name, addressLine, city, zipCode, phone, isDefault } = req.body as AddressBody;
  if (!patientId || !name || !addressLine || !city || !zipCode || !phone) {
    res.status(400).json({ success: false, message: 'Missing address field elements.' });
    return;
  }

  try {
    const addressId = 'ADD-' + Math.floor(100000 + Math.random() * 900000);
    
    db.transaction(() => {
      if (isDefault === 1) {
        db.prepare('UPDATE patient_addresses SET is_default = 0 WHERE patient_id = ?').run(patientId);
      }
      db.prepare(`
        INSERT INTO patient_addresses (id, patient_id, name, address_line, city, zip_code, phone, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(addressId, patientId, name, addressLine, city, zipCode, phone, isDefault);
    })();

    res.json({ success: true, message: 'Address saved successfully.', addressId });
  } catch (err) {
    next(err);
  }
});

// 4. Save checked out order
router.post('/orders/checkout', (req: Request, res: Response, next: NextFunction) => {
  const { patientId, items, totalAmount, paymentMethod, addressLine, discount, deliveryFee, tax } = req.body;
  if (!patientId || !items || !items.length || !totalAmount || !paymentMethod || !addressLine) {
    res.status(400).json({ success: false, message: 'Missing checkout order parameters.' });
    return;
  }

  try {
    const orderId = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const medicineStr = items.map(i => `${i.name} (x${i.quantity})`).join(', ');
    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
    const now = Date.now();

    db.transaction(() => {
      // 1. Insert order
      db.prepare(`
        INSERT INTO orders (
          id, patient_id, medicine, quantity, ece_level, status, 
          assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
          total_amount, payment_status, payment_method, address_line,
          discount, delivery_fee, tax
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId, patientId, medicineStr, totalQuantity, 0, 'Pending',
        'Unassigned', 'Unassigned', '2 days', now, now,
        totalAmount, 'Success', paymentMethod, addressLine,
        discount || 0, deliveryFee || 0, tax || 0
      );

      // 2. Initialize requests_context with PENDING stage
      const initialContext = {
        requestId: orderId,
        patientId,
        query: `Medicine purchase: ${medicineStr}`,
        workflowStage: 'PENDING',
        status: 'RUNNING',
        executionTimeline: [
          {
            timestamp: now,
            stepName: 'PENDING',
            status: 'FINISHED',
            message: 'Order created and pending review.'
          }
        ]
      };

      db.prepare(`
        INSERT OR REPLACE INTO requests_context (
          request_id, patient_id, query, workflow_stage, overall_confidence, status, context_json, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        patientId,
        `Medicine purchase: ${medicineStr}`,
        'PENDING',
        1.0,
        'RUNNING',
        JSON.stringify(initialContext),
        now
      );

      // 3. Insert order items
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (id, order_id, medicine_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of items) {
        const itemId = 'ORI-' + Math.floor(100000 + Math.random() * 900000);
        insertOrderItem.run(itemId, orderId, item.name, item.price, item.quantity);
      }

      // 4. Decrement medicine stocks
      for (const item of items) {
        db.prepare('UPDATE medicines SET stock = MAX(0, stock - ?) WHERE name = ?').run(item.quantity, item.name);
      }

      // 5. Clear SQLite cart for this patient
      db.prepare('DELETE FROM cart WHERE patient_id = ?').run(patientId);

      // 6. Log audit log
      db.prepare(`
        INSERT INTO audit_logs (type, timestamp, request_id, agent_id, message)
        VALUES (?, ?, ?, ?, ?)
      `).run('COMMERCE_ORDER', now, orderId, 'System', `Standard retail checkout completed for $${totalAmount}`);
    })();

    // Broadcast SSE live event update
    broadcastEvent({
      type: 'ORDER_PLACED',
      orderId,
      patientId,
      medicine: medicineStr
    });

    res.json({ success: true, message: 'Checkout successful.', orderId });
  } catch (err) {
    next(err);
  }
});

// 5. Submit AI Intake and process through existing MedX AI Engine
router.post('/orders/ai-intake', async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, patientId, query } = req.body;
  if (!orderId || !patientId || !query) {
    res.status(400).json({ success: false, message: 'Missing orderId, patientId, or diagnostic query.' });
    return;
  }

  try {
    // Run AI orchestration pipeline in backend context (forces Mock mode)
    const result = await MedXEngine.processRequest(patientId, query, 'Mock');
    const finalContext = result.finalContext;
    const xaiReport = finalContext.explainabilityReport;

    const eceOutput = finalContext.agentOutputs.find(o => o.agentId === 'ece')?.output;
    const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
    const facilityName = xaiReport ? xaiReport.facilityName : 'Care Pharmacy Store';
    const eta = xaiReport ? xaiReport.eta : '2 days';

    // 1. Update the corresponding order to Pending and map facility details
    let assignedRider = 'Rider: Dave Miller';
    if (eceLevel === 1 || eceLevel === 2) {
      assignedRider = 'Drone: DR-99';
    } else {
      assignedRider = 'Rider: Dave Miller';
    }

    db.prepare(`
      UPDATE orders
      SET ece_level = ?, assigned_pharmacy = ?, eta = ?, status = 'Pending', assigned_rider = ?
      WHERE id = ?
    `).run(eceLevel, facilityName, eta, assignedRider, orderId);

    // 2. Persist initial request context to SQLite matching orderId as request_id (starting workflow stage)
    db.prepare(`
      INSERT OR REPLACE INTO requests_context (
        request_id, patient_id, query, workflow_stage, overall_confidence, status,
        context_json, trace_json, timeline_json, risk_level, human_review_json,
        confidence_breakdown_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      patientId,
      query,
      'REQUEST_CREATED',
      finalContext.overallConfidence,
      'RUNNING',
      JSON.stringify(finalContext),
      JSON.stringify(finalContext.decisionTrace || []),
      JSON.stringify(finalContext.executionTimeline || []),
      finalContext.riskLevel || 'LOW',
      JSON.stringify(finalContext.humanReviewStatus || {}),
      JSON.stringify(finalContext.confidenceBreakdown || {}),
      Date.now()
    );

    // 3. Persist timeline events to audit logs
    for (const entry of finalContext.executionTimeline) {
      db.prepare(`
        INSERT INTO audit_logs (type, timestamp, request_id, agent_id, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(`AGENT_${entry.status}`, entry.timestamp, orderId, entry.stepName, entry.message);
    }

    // 4. Progress sequentially through business workflow stages via Orchestrator
    WorkflowOrchestrator.updateStage(orderId, 'AI_COMPLETED');
    WorkflowOrchestrator.updateStage(orderId, 'PHARMACY_PENDING');

    res.json({
      success: true,
      message: 'AI intake diagnostics and workflow routing completed successfully.',
      requestId: orderId,
      eceLevel,
      facilityName,
      eta,
      riskLevel: finalContext.riskLevel
    });
  } catch (err) {
    next(err);
  }
});

// --- Cart Endpoints ---

// Fetch cart items joined with medicines for details
router.get('/cart', (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.query;
  if (!patientId) {
    res.status(400).json({ success: false, message: 'Missing patientId parameter.' });
    return;
  }

  try {
    const items = db.prepare(`
      SELECT c.id, c.medicine_id, c.quantity, m.name, m.price, m.stock, m.dosage, m.prescription_required, m.image_url, m.description, m.category
      FROM cart c
      JOIN medicines m ON c.medicine_id = m.id
      WHERE c.patient_id = ?
    `).all(patientId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
});

// Add to cart or increment quantity
router.post('/cart', (req: Request, res: Response, next: NextFunction) => {
  const { patientId, medicineId, quantity } = req.body;
  if (!patientId || !medicineId || !quantity) {
    res.status(400).json({ success: false, message: 'Missing patientId, medicineId, or quantity.' });
    return;
  }

  try {
    // Check if already in cart
    const existing = db.prepare('SELECT id, quantity FROM cart WHERE patient_id = ? AND medicine_id = ?').get(patientId, medicineId) as { id: string; quantity: number } | undefined;
    
    if (existing) {
      db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
      res.json({ success: true, message: 'Cart quantity updated.' });
    } else {
      const cartId = 'CRT-' + Math.floor(100000 + Math.random() * 900000);
      db.prepare('INSERT INTO cart (id, patient_id, medicine_id, quantity) VALUES (?, ?, ?, ?)').run(cartId, patientId, medicineId, quantity);
      res.json({ success: true, message: 'Added to cart.' });
    }
  } catch (err) {
    next(err);
  }
});

// Update cart item quantity
router.put('/cart/:id', (req: Request, res: Response, next: NextFunction) => {
  const { quantity } = req.body;
  const { id } = req.params;
  if (quantity === undefined || quantity <= 0) {
    res.status(400).json({ success: false, message: 'Invalid quantity.' });
    return;
  }

  try {
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, id);
    res.json({ success: true, message: 'Cart item quantity updated.' });
  } catch (err) {
    next(err);
  }
});

// Delete cart item
router.delete('/cart/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM cart WHERE id = ?').run(id);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    next(err);
  }
});

// Clear cart
router.delete('/cart', (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.query;
  if (!patientId) {
    res.status(400).json({ success: false, message: 'Missing patientId parameter.' });
    return;
  }

  try {
    db.prepare('DELETE FROM cart WHERE patient_id = ?').run(patientId);
    res.json({ success: true, message: 'Cart cleared successfully.' });
  } catch (err) {
    next(err);
  }
});

// Fetch all categories
router.get('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

// P-03 Refill Workflow
router.post('/orders/refill', async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, medicineName } = req.body;
  if (!patientId || !medicineName) {
    res.status(400).json({ success: false, message: 'Missing patientId or medicineName.' });
    return;
  }

  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as any;
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }

    const medicine = db.prepare('SELECT * FROM medicines WHERE name = ?').get(medicineName) as any;
    if (!medicine) {
      res.status(404).json({ success: false, message: `Medicine "${medicineName}" not found.` });
      return;
    }

    // Validation: Check for allergy conflicts
    const allergiesList = (patient.allergies || '').split(',').map((s: string) => s.trim().toLowerCase());
    const isAllergic = allergiesList.some((alg: string) => medicineName.toLowerCase().includes(alg) || alg.includes(medicineName.toLowerCase()));

    if (isAllergic) {
      res.status(400).json({
        success: false,
        message: `Clinical Alert: Refill blocked. Patient has registered allergy to "${medicineName}" / "${patient.allergies}".`
      });
      return;
    }

    const orderId = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const now = Date.now();
    const prescriptionRequired = medicine.prescription_required === 1;

    const initialStatus = prescriptionRequired ? 'Pending Approval' : 'Pending';
    const workflowStage = prescriptionRequired ? 'MANUAL_REVIEW' : 'REQUEST_CREATED';

    db.transaction(() => {
      db.prepare(`
        INSERT INTO orders (
          id, patient_id, medicine, quantity, ece_level, status, 
          assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
          total_amount, payment_status, payment_method, address_line,
          discount, delivery_fee, tax
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId, patientId, `${medicineName} (x1)`, 1, 5, initialStatus,
        'Care Pharmacy Store', 'Unassigned', '2 days', now, now,
        medicine.price, 'Success', 'Prescription Refill', 'Default Address',
        0, 5, medicine.price * 0.12
      );

      db.prepare(`
        INSERT INTO order_items (id, order_id, medicine_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'ORI-' + Math.floor(100000 + Math.random() * 900000),
        orderId,
        medicineName,
        medicine.price,
        1
      );
    })();

    WorkflowOrchestrator.updateStage(orderId, workflowStage);

    if (!prescriptionRequired) {
      setTimeout(() => {
        WorkflowOrchestrator.updateStage(orderId, 'PHARMACY_PENDING');
        setTimeout(() => {
          WorkflowOrchestrator.acceptRequest(orderId, 'FAC-003');
          setTimeout(() => {
            WorkflowOrchestrator.reserveInventory(orderId);
          }, 2000);
        }, 2000);
      }, 2000);
    }

    res.json({
      success: true,
      message: prescriptionRequired
        ? `Refill requested. Lisinopril requires Doctor approval. Status: Pending Approval.`
        : `Refill order ${orderId} created successfully.`,
      orderId,
      status: initialStatus
    });
  } catch (err) {
    next(err);
  }
});

// P-04 SOS Emergency Workflow
router.post('/orders/sos', async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.body;
  if (!patientId) {
    res.status(400).json({ success: false, message: 'Missing patientId.' });
    return;
  }

  try {
    const orderId = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const now = Date.now();

    db.transaction(() => {
      db.prepare(`
        INSERT INTO orders (
          id, patient_id, medicine, quantity, ece_level, status, 
          assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
          total_amount, payment_status, payment_method, address_line,
          discount, delivery_fee, tax, request_source, request_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Patient', 'SOS')
      `).run(
        orderId, patientId, 'Ambulance Dispatch', 1, 1, 'Dispatched',
        'N/A', 'Ambulance AMB-09', '6 mins', now, now,
        0, 'Success', 'SOS Emergency', 'SOS Location (wearables gps)',
        0, 0, 0
      );
    })();

    WorkflowOrchestrator.updateStage(orderId, 'REQUEST_CREATED');
    setTimeout(() => {
      WorkflowOrchestrator.updateStage(orderId, 'ECE_ASSIGNED');
      setTimeout(() => {
        WorkflowOrchestrator.updateStage(orderId, 'LOGISTICS_ASSIGNED');
        setTimeout(() => {
          WorkflowOrchestrator.updateStage(orderId, 'OUT_FOR_DELIVERY');
        }, 1500);
      }, 1500);
    }, 1500);

    res.json({
      success: true,
      message: 'SOS emergency triggered. Ambulance dispatched.',
      orderId
    });
  } catch (err) {
    next(err);
  }
});

// P-05 Return & Refund Workflow
router.post('/orders/:id/return', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    res.status(400).json({ success: false, message: 'Missing reason.' });
    return;
  }

  try {
    db.prepare("UPDATE orders SET status = 'Return Requested' WHERE id = ?").run(id);
    WorkflowOrchestrator.updateStage(id, 'RETURN_REVIEW');

    setTimeout(() => {
      const isApproved = reason !== 'Changed my mind';
      const nextStatus = isApproved ? 'Refund Approved' : 'Refund Rejected';
      const nextStage = isApproved ? 'REFUND_APPROVED' : 'REFUND_REJECTED';

      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, id);
      WorkflowOrchestrator.updateStage(id, nextStage);
      WorkflowOrchestrator.updateStage(id, 'COMPLETED');
    }, 3000);

    res.json({ success: true, message: 'Return request submitted. Pending pharmacy review.' });
  } catch (err) {
    next(err);
  }
});

// P-08 Blood Request Workflow
router.post('/orders/blood', async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, bloodGroup, quantity, reason } = req.body;
  if (!patientId || !bloodGroup || !quantity) {
    res.status(400).json({ success: false, message: 'Missing patientId, bloodGroup, or quantity.' });
    return;
  }

  try {
    const orderId = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const now = Date.now();

    const bBank = db.prepare('SELECT quantity FROM blood_banks WHERE blood_group = ?').get(bloodGroup) as { quantity: number } | undefined;
    if (!bBank || bBank.quantity < quantity) {
      res.status(400).json({ success: false, message: `Insufficient units of Blood Group ${bloodGroup} available.` });
      return;
    }

    db.transaction(() => {
      db.prepare('UPDATE blood_banks SET quantity = MAX(0, quantity - ?) WHERE blood_group = ?').run(quantity, bloodGroup);

      db.prepare(`
        INSERT INTO orders (
          id, patient_id, medicine, quantity, ece_level, status, 
          assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
          total_amount, payment_status, payment_method, address_line,
          discount, delivery_fee, tax, request_source, request_type,
          blood_group, blood_units
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Patient', 'Blood', ?, ?)
      `).run(
        orderId, patientId, `Blood Group ${bloodGroup}`, quantity, 2, 'Pending',
        'Central Red Cross Blood Bank', 'Drone: DR-99', '20 mins', now, now,
        0, 'Success', 'Blood Request', 'Default Address',
        0, 0, 0, bloodGroup, quantity
      );

      db.prepare(`
        INSERT INTO order_items (id, order_id, medicine_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'ORI-' + Math.floor(100000 + Math.random() * 900000),
        orderId,
        `Blood Group ${bloodGroup}`,
        0,
        quantity
      );
    })();

    WorkflowOrchestrator.updateStage(orderId, 'REQUEST_CREATED');
    setTimeout(() => {
      WorkflowOrchestrator.updateStage(orderId, 'ECE_ASSIGNED');
      setTimeout(() => {
        WorkflowOrchestrator.updateStage(orderId, 'INVENTORY_RESERVED');
      }, 1500);
    }, 1500);

    res.json({ success: true, message: `Blood request ${orderId} submitted and reserved.`, orderId });
  } catch (err) {
    next(err);
  }
});

export default router;
