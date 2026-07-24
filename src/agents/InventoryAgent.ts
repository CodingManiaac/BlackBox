import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import inventoryMock from '../knowledge/inventoryMock.json';

export class InventoryAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    
    let isAvailable = false;
    let currentStock = 0;
    let alternatives: string[] = [];
    let isColdChain = false;
    let matchedItem = 'None';
    
    if (triageOutput) {
      const triageMeds = triageOutput.medicines as string[];
      const bloodGroup = triageOutput.detectedBloodGroup as string | null;
      
      let itemToSearch = '';
      if (triageMeds.length > 0) {
        itemToSearch = triageMeds[0];
      } else if (bloodGroup) {
        itemToSearch = bloodGroup === 'O-' ? 'O- Blood Pack' : '';
      }
      
      if (itemToSearch) {
        const invRecord = inventoryMock.inventory.find(i => 
          i.name.toLowerCase().includes(itemToSearch.toLowerCase())
        );
        
        if (invRecord) {
          matchedItem = invRecord.name;
          currentStock = invRecord.stock;
          isAvailable = invRecord.stock > 0;
          alternatives = invRecord.alternatives;
          isColdChain = invRecord.storage === 'Cold-Chain';
        }
      }
    }

    const inventoryOutput = {
      available: isAvailable,
      stock: currentStock,
      alternative: alternatives,
      coldChainRequired: isColdChain,
      itemName: matchedItem,
      confidence: 97.0
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: inventoryOutput,
        confidence: 97.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Inventory check: "${matchedItem}" stock = ${currentStock}.`
      }]
    };

    return nextContext;
  }
}
export default InventoryAgent;
