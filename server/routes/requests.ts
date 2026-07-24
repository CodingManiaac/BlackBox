import { Router, Request, Response, NextFunction } from 'express';
import { MedXEngine } from '../../src/core/MedXEngine';
import { db } from '../database/db';
import { OrderService } from '../services/OrderService';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { AuditService } from '../services/AuditService';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, query, mode } = req.body;
  if (!patientId || !query) {
    res.status(400).json({ success: false, message: 'Missing patientId or query.' });
    return;
  }

  try {
    // Run AI orchestration pipeline in backend context
    const result = await MedXEngine.processRequest(patientId, query, mode || 'Mock');
    const finalContext = result.finalContext;
    const xaiReport = finalContext.explainabilityReport;

    // Persist request context to SQLite
    db.prepare(`
      INSERT OR REPLACE INTO requests_context (
        request_id, patient_id, query, workflow_stage, overall_confidence, status,
        context_json, trace_json, timeline_json, risk_level, human_review_json,
        confidence_breakdown_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.requestId,
      patientId,
      query,
      finalContext.workflowStage,
      finalContext.overallConfidence,
      finalContext.status,
      JSON.stringify(finalContext),
      JSON.stringify(finalContext.decisionTrace || []),
      JSON.stringify(finalContext.executionTimeline || []),
      finalContext.riskLevel || 'LOW',
      JSON.stringify(finalContext.humanReviewStatus || {}),
      JSON.stringify(finalContext.confidenceBreakdown || {}),
      Date.now()
    );

    // Persist timelines events to audit logs table
    for (const entry of finalContext.executionTimeline) {
      AuditService.log({
        type: `AGENT_${entry.status}`,
        timestamp: entry.timestamp,
        request_id: result.requestId,
        agent_id: entry.stepName,
        message: entry.message
      });
    }

    // Auto-create order if pipeline successfully completes and medicine/blood matches
    let createdOrder = null;
    if (result.success && xaiReport) {
      const eceOutput = finalContext.agentOutputs.find(o => o.agentId === 'ece')?.output;
      const inventoryOutput = finalContext.agentOutputs.find(o => o.agentId === 'inventory')?.output;
      
      const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
      const itemName = inventoryOutput ? inventoryOutput.itemName : 'None';
      const available = inventoryOutput ? inventoryOutput.available : false;

      if (itemName !== 'None' && available) {
        // Reserve stock in database
        if (xaiReport.symptoms.includes('blood') || triageHasBlood(xaiReport.symptoms)) {
          const group = triageBloodGroup(query);
          InventoryRepository.deductBlood(group, 1);
        } else {
          InventoryRepository.deductMedicine(itemName, 1);
        }

        // Create database order record
        createdOrder = OrderService.createOrder(
          patientId,
          itemName,
          1,
          eceLevel,
          xaiReport.facilityName,
          xaiReport.eta
        );

        AuditService.log({
          type: 'ORDER_CREATED',
          timestamp: Date.now(),
          request_id: result.requestId,
          message: `Automated order ${createdOrder.id} approved for medicine: ${itemName}. Assigned facility: ${xaiReport.facilityName}`
        });
      }
    }

    res.json({
      success: result.success,
      requestId: result.requestId,
      totalLatencyMs: result.totalLatencyMs,
      stepsExecuted: result.stepsExecuted,
      finalContext: finalContext,
      order: createdOrder
    });
  } catch (err) {
    next(err);
  }
});

function triageHasBlood(symptoms: string[]): boolean {
  return symptoms.some(s => s.includes('blood') || s.includes('o-') || s.includes('negative'));
}

function triageBloodGroup(query: string): string {
  const queryLower = query.toLowerCase();
  if (queryLower.includes('o negative') || queryLower.includes('o-')) return 'O-';
  if (queryLower.includes('a positive') || queryLower.includes('a+')) return 'A+';
  return 'O-';
}

export default router;
