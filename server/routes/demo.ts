import { Router, Request, Response } from 'express';
import { MedXEngine } from '../../src/core/MedXEngine';
import { WorkflowOrchestrator } from '../services/WorkflowOrchestrator';
import { db } from '../database/db';
import { OrderService } from '../services/OrderService';
import { AuditService } from '../services/AuditService';
import { broadcastEvent } from './stream';

const router = Router();

async function runAsyncSimulation(
  patientId: string, 
  query: string, 
  mode: 'Mock' | 'Production',
  facilityId: string,
  riderId: string,
  outOfStockMode = false
) {
  try {
    // 1. Process Intake Request via AI Engine
    const result = await MedXEngine.processRequest(patientId, query, mode);
    const requestId = result.requestId;
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
      requestId,
      patientId,
      query,
      finalContext.workflowStage || 'PENDING',
      finalContext.overallConfidence || 0.95,
      finalContext.status || 'RUNNING',
      JSON.stringify(finalContext),
      JSON.stringify(finalContext.decisionTrace || []),
      JSON.stringify(finalContext.executionTimeline || []),
      finalContext.riskLevel || 'LOW',
      JSON.stringify(finalContext.humanReviewStatus || {}),
      JSON.stringify(finalContext.confidenceBreakdown || {}),
      Date.now()
    );

    // Save timeline events to audit logs
    for (const entry of finalContext.executionTimeline) {
      AuditService.log({
        type: `AGENT_${entry.status}`,
        timestamp: entry.timestamp,
        request_id: requestId,
        agent_id: entry.stepName,
        message: entry.message
      });
    }

    // 3. Create database order
    let finalOrderId = requestId;
    if (result.success && xaiReport && !outOfStockMode) {
      const eceOutput = finalContext.agentOutputs.find(o => o.agentId === 'ece')?.output;
      const inventoryOutput = finalContext.agentOutputs.find(o => o.agentId === 'inventory')?.output;
      const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
      const itemName = inventoryOutput ? inventoryOutput.itemName : 'None';

      const createdOrder = OrderService.createOrder(
        patientId,
        itemName,
        1,
        eceLevel,
        xaiReport.facilityName,
        xaiReport.eta
      );

      finalOrderId = createdOrder.id;
      db.prepare('UPDATE orders SET id = ? WHERE id = ?').run(requestId, finalOrderId);
    }

    // Broadcast visualization start for Admin Command Center sequential visualization
    broadcastEvent({
      type: 'START_AI_VISUALIZATION',
      orderId: finalOrderId,
      patientId,
      query,
      finalContext
    });

    // 4. Progress stages sequentially
    setTimeout(() => {
      WorkflowOrchestrator.updateStage(finalOrderId, 'PHARMACY_REVIEW');
    }, 9000); // Wait for the frontend agent sequence playback to progress

    setTimeout(() => {
      WorkflowOrchestrator.updateStage(finalOrderId, 'APPROVED');
    }, 12000);

    if (outOfStockMode) {
      setTimeout(() => {
        WorkflowOrchestrator.markOutOfStock(finalOrderId);
      }, 15000);
      return;
    }

    setTimeout(() => {
      WorkflowOrchestrator.reserveInventory(finalOrderId);
    }, 15000);

    setTimeout(() => {
      WorkflowOrchestrator.assignRider(finalOrderId, riderId);
    }, 18000);

    setTimeout(() => {
      WorkflowOrchestrator.reachedStore(finalOrderId);
    }, 21000);

    setTimeout(() => {
      WorkflowOrchestrator.shipOrder(finalOrderId);
    }, 24000);

    setTimeout(() => {
      WorkflowOrchestrator.reachedCustomer(finalOrderId);
    }, 27000);

    setTimeout(() => {
      WorkflowOrchestrator.completeDelivery(finalOrderId);
    }, 30000);

  } catch (err) {
    console.error('[DemoSimulation] Simulation failed:', err);
  }
}

router.post('/chest-pain', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-001', 
    'Emergency: My father has severe crushing chest pain and left arm numbness.', 
    mode || 'Mock',
    'FAC-001', 
    'RD-001'
  );
  res.json({ success: true, message: 'Chest pain simulation initiated.' });
});

router.post('/high-fever', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-002', 
    'Patient has high fever of 104F and persistent vomiting.', 
    mode || 'Mock',
    'FAC-001', 
    'RD-002'
  );
  res.json({ success: true, message: 'High fever simulation initiated.' });
});

router.post('/snake-bite', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-001', 
    'Emergency: Bitten by a snake in the forest. Heavy swelling in leg.', 
    mode || 'Mock',
    'FAC-001', 
    'RD-001'
  );
  res.json({ success: true, message: 'Snake bite simulation initiated.' });
});

router.post('/blood', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-003', 
    'Emergency: Patient requires O Negative blood packs immediately.', 
    mode || 'Mock',
    'FAC-005', 
    'RD-002'
  );
  res.json({ success: true, message: 'Blood emergency simulation initiated.' });
});

router.post('/asthma-attack', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-001', 
    'Emergency: Severe asthma attack. Inhaler out of stock. Cannot breathe.', 
    mode || 'Mock',
    'FAC-003', 
    'RD-003'
  );
  res.json({ success: true, message: 'Asthma attack simulation initiated.' });
});

router.post('/insulin', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-002', 
    'I need Insulin refill.', 
    mode || 'Mock',
    'FAC-003', 
    'RD-003'
  );
  res.json({ success: true, message: 'Insulin duplicate warning simulation initiated.' });
});

router.post('/road-accident', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-004', 
    'Emergency: Car crash victim with compound fracture and active bleeding.', 
    mode || 'Mock',
    'FAC-001', 
    'RD-001'
  );
  res.json({ success: true, message: 'Road accident simulation initiated.' });
});

router.post('/out-of-stock', (req: Request, res: Response) => {
  const { mode } = req.body;
  runAsyncSimulation(
    'PAT-004', 
    'I need Atorvastatin urgently.', 
    mode || 'Mock',
    'FAC-003',
    'RD-001',
    true
  );
  res.json({ success: true, message: 'Out of stock simulation initiated.' });
});

export default router;
